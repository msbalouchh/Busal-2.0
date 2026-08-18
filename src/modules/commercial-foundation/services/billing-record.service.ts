import "server-only";

import { prisma } from "@/lib/prisma";
import {
  BILLING_CYCLES,
  BILLING_INVOICE_STATUSES,
  BILLING_PAYMENT_STATUSES,
  SUBSCRIPTION_STATUSES,
  TRIAL_STATUSES,
  type BillingCycle,
} from "@/modules/billing/constants/billing-status";
import type {
  BillingAnalytics,
  BillingAiContext,
  BillingRecord,
  PlanFeatureAccess,
  SubscriptionPlan,
} from "@/modules/billing/types/billing-platform";
import {
  defaultCommercialOperations,
  loadCommercialOperations,
} from "@/modules/commercial-foundation/lib/commercial-settings";
import {
  defaultBillingCycleForPlan,
  findCatalogPlanBySlug,
  isTrialPlan,
  listCatalogPlans,
  normalizeSubscriptionStatus,
} from "@/modules/commercial-foundation/lib/plan-catalog";
import { planResolver } from "@/modules/feature-access";
import { subscriptionResolver } from "@/modules/feature-access";
import { BILLING_MODULE_KEYS } from "@/modules/billing/constants/feature-access";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function mapModulesToBillingAccess(enabledModules: string[]): PlanFeatureAccess["enabledModules"] {
  const mapping: Record<string, PlanFeatureAccess["enabledModules"][number]> = {
    crm: BILLING_MODULE_KEYS.CRM,
    menu: BILLING_MODULE_KEYS.MENU,
    orders: BILLING_MODULE_KEYS.ORDERS,
    pos: BILLING_MODULE_KEYS.POS,
    kitchen: BILLING_MODULE_KEYS.KITCHEN,
    reservations: BILLING_MODULE_KEYS.RESERVATIONS,
    inventory: BILLING_MODULE_KEYS.INVENTORY,
    staff: BILLING_MODULE_KEYS.STAFF,
    finance: BILLING_MODULE_KEYS.FINANCE,
    analytics: BILLING_MODULE_KEYS.ANALYTICS,
    ai: BILLING_MODULE_KEYS.AI_ASSISTANT,
    notifications: BILLING_MODULE_KEYS.MARKETING,
  };

  const modules = enabledModules
    .map((key) => mapping[key])
    .filter((entry): entry is PlanFeatureAccess["enabledModules"][number] => Boolean(entry));

  return [BILLING_MODULE_KEYS.DASHBOARD, ...new Set(modules)];
}

function buildFeatureAccessFromPlan(plan: SubscriptionPlan, businessId: string): PlanFeatureAccess {
  const record = { businessId, subscriptionPlan: plan.slug, subscriptionStatus: "ACTIVE", assignedFeatures: [] };
  const resolved = subscriptionResolver.normalizePlan(plan.slug);
  const modules = planResolver.resolveModules(resolved);
  return {
    ...plan.featureAccess,
    enabledModules: mapModulesToBillingAccess(modules),
  };
}

function periodEndFromStart(start: Date, cycle: BillingCycle): Date {
  const end = new Date(start);
  if (cycle === BILLING_CYCLES.YEARLY) {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}

/** Builds a billing aggregate from tenant platform records. */
export async function buildBillingRecordForBusiness(businessId: string): Promise<BillingRecord> {
  const [tenantRecord, business, branchCount, staffCount, commercial, limits] = await Promise.all([
    prisma.tenantRecord.findUnique({ where: { businessId } }),
    prisma.business.findUnique({ where: { id: businessId } }),
    prisma.branch.count({ where: { businessId, isActive: true } }),
    prisma.staff.count({ where: { businessId, isActive: true } }),
    loadCommercialOperations(businessId).catch(() => defaultCommercialOperations()),
    prisma.tenantResourceLimit.findUnique({ where: { businessId } }),
  ]);

  const planSlug = tenantRecord?.subscriptionPlan ?? "starter";
  const plan =
    findCatalogPlanBySlug(planSlug) ??
    findCatalogPlanBySlug("starter") ??
    listCatalogPlans()[0];

  if (!plan) {
    throw new Error(`No subscription plan configured for business ${businessId}`);
  }

  const status = normalizeSubscriptionStatus(tenantRecord?.subscriptionStatus ?? SUBSCRIPTION_STATUSES.ACTIVE);
  const billingCycle = defaultBillingCycleForPlan(plan.slug);
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = periodEndFromStart(periodStart, billingCycle);
  const subscriptionId = commercial.stripeSubscriptionId ?? `sub-${businessId}`;
  const tenantId = businessId;
  const workspaceId = businessId;
  const featureAccess = buildFeatureAccessFromPlan(plan, businessId);

  if (limits) {
    featureAccess.limits = {
      ...featureAccess.limits,
      maxStaff: limits.maxUsers,
      maxBranches: limits.maxBranches,
      maxStorageMb: Math.round(Number(limits.maxStorageBytes) / (1024 * 1024)),
      maxAiCredits: limits.maxAiTokensPerMonth,
      maxApiCalls: limits.maxApiCallsPerMonth,
      maxIntegrations: limits.maxMarketplaceLicenses,
    };
  }

  const mrrCents = billingCycle === BILLING_CYCLES.YEARLY ? plan.yearlyPriceCents / 12 : plan.monthlyPriceCents;

  const subscription = {
    id: subscriptionId,
    tenantId,
    planId: plan.id,
    status,
    billingCycle,
    currentPeriodStart: periodStart.toISOString().slice(0, 10),
    currentPeriodEnd: periodEnd.toISOString().slice(0, 10),
    cancelAtPeriodEnd: false,
    cancelledAt: null,
    pausedAt: tenantRecord?.suspendedAt?.toISOString() ?? null,
    trialEnd: commercial.trialEndsAt,
    quantity: 1,
    currency: business?.currency ?? "GBP",
    mrrCents,
    createdAt: tenantRecord?.createdAt.toISOString() ?? now.toISOString(),
    updatedAt: tenantRecord?.updatedAt.toISOString() ?? now.toISOString(),
  };

  const analytics: BillingAnalytics = {
    tenantId,
    mrrCents,
    arrCents: mrrCents * 12,
    activeSubscriptions: status === SUBSCRIPTION_STATUSES.ACTIVE ? 1 : 0,
    trialingCount: isTrialPlan(plan.slug) ? 1 : 0,
    churnRateBps: 0,
    arpuCents: mrrCents,
    failedPaymentCount: commercial.payments.filter(
      (payment) => payment.status === BILLING_PAYMENT_STATUSES.FAILED,
    ).length,
    couponRedemptionCount: commercial.couponsApplied.length,
    upgradeCount: 0,
    downgradeCount: 0,
  };

  const aiContext: BillingAiContext = {
    tenantId,
    summary: `${plan.name} subscription for ${business?.businessName ?? "tenant"}`,
    churnRiskScore: analytics.failedPaymentCount > 0 ? 65 : 20,
    mrrForecastCents: mrrCents,
    recommendedPlanId: null,
    pricingOptimizationScore: 75,
    insights: [],
    recommendedActions: [],
    lastGeneratedAt: now.toISOString(),
  };

  return {
    plan,
    subscription,
    workspaceSubscription: {
      id: `ws-sub-${businessId}`,
      tenantId,
      workspaceId,
      subscriptionId,
      planId: plan.id,
      status,
      featureAccess,
      effectiveFrom: subscription.currentPeriodStart,
      effectiveTo: null,
    },
    businessSubscriptions: [
      {
        id: `biz-sub-${businessId}`,
        tenantId,
        workspaceId,
        businessId,
        subscriptionId,
        planId: plan.id,
        status,
        branchCount,
        staffCount,
        featureAccess,
      },
    ],
    billingCycles: [
      {
        id: createId("cycle"),
        subscriptionId,
        cycle: billingCycle,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
        amountCents: mrrCents,
        currency: subscription.currency,
        isPaid: commercial.invoices.some((invoice) => invoice.status === BILLING_INVOICE_STATUSES.PAID),
      },
    ],
    invoices: commercial.invoices,
    payments: commercial.payments,
    paymentMethods: [],
    refunds: [],
    coupons: [],
    promotions: [],
    discounts: [],
    trial: commercial.trialEndsAt
      ? {
          id: `trial-${businessId}`,
          tenantId,
          workspaceId,
          planId: plan.id,
          status: TRIAL_STATUSES.ACTIVE,
          startedAt: commercial.trialStartedAt ?? tenantRecord?.createdAt.toISOString() ?? now.toISOString(),
          endsAt: commercial.trialEndsAt,
          convertedAt: null,
          daysRemaining: Math.max(
            0,
            Math.ceil((new Date(commercial.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          ),
        }
      : null,
    taxes: [],
    usageRecords: [],
    enterpriseContract: null,
    customPlan: null,
    analytics,
    aiContext,
  };
}
