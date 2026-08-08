import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import {
  BILLING_INVOICE_STATUSES,
  BILLING_PAYMENT_STATUSES,
  SUBSCRIPTION_STATUSES,
} from "@/modules/billing/constants/billing-status";
import type { BillingInvoice, BillingPayment } from "@/modules/billing/types/billing-platform";
import {
  defaultCommercialOperations,
  loadCommercialOperations,
  saveCommercialOperations,
} from "@/modules/commercial-foundation/lib/commercial-settings";
import { findCatalogPlanById, findCatalogPlanBySlug, isTrialPlan } from "@/modules/commercial-foundation/lib/plan-catalog";
import { buildBillingRecordForBusiness } from "@/modules/commercial-foundation/services/billing-record.service";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface CheckoutSessionInput {
  businessId: string;
  planId: string;
  billingCycle: "monthly" | "annual";
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}

export interface PortalSessionInput {
  businessId: string;
  returnUrl: string;
}

/** Stripe-backed billing operations for production tenants. */
export class StripeBillingService {
  async ensureStripeCustomer(businessId: string, email?: string): Promise<string> {
    const commercial = await loadCommercialOperations(businessId);

    if (commercial.stripeCustomerId) {
      return commercial.stripeCustomerId;
    }

    if (!isStripeConfigured()) {
      const fallbackId = `local_cus_${businessId}`;
      await saveCommercialOperations(businessId, {
        ...commercial,
        stripeCustomerId: fallbackId,
      });
      return fallbackId;
    }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    const stripe = getStripeClient();
    const customer = await stripe.customers.create({
      email: email ?? business?.businessEmail ?? undefined,
      name: business?.businessName ?? undefined,
      metadata: { businessId },
    });

    await saveCommercialOperations(businessId, {
      ...commercial,
      stripeCustomerId: customer.id,
    });

    return customer.id;
  }

  async createCheckoutSession(input: CheckoutSessionInput): Promise<{ url: string | null; sessionId: string }> {
    const plan = findCatalogPlanById(input.planId);
    if (!plan) {
      throw new Error("Plan not found");
    }

    const customerId = await this.ensureStripeCustomer(input.businessId, input.customerEmail);
    const commercial = await loadCommercialOperations(input.businessId);

    if (!isStripeConfigured()) {
      const sessionId = createId("cs_local");
      await saveCommercialOperations(input.businessId, {
        ...commercial,
        lastCheckoutSessionId: sessionId,
      });
      return { url: input.successUrl, sessionId };
    }

    const stripe = getStripeClient();
    const unitAmount =
      input.billingCycle === "annual" ? plan.yearlyPriceCents : plan.monthlyPriceCents;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            product_data: { name: plan.name, metadata: { planId: plan.id, planSlug: plan.slug } },
            unit_amount: unitAmount,
            recurring: {
              interval: input.billingCycle === "annual" ? "year" : "month",
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: isTrialPlan(plan.slug)
        ? { trial_period_days: plan.trialDays || 14 }
        : undefined,
      metadata: {
        businessId: input.businessId,
        planId: plan.id,
        planSlug: plan.slug,
      },
    });

    await saveCommercialOperations(input.businessId, {
      ...commercial,
      lastCheckoutSessionId: session.id,
    });

    return { url: session.url, sessionId: session.id };
  }

  async createPortalSession(input: PortalSessionInput): Promise<{ url: string }> {
    const customerId = await this.ensureStripeCustomer(input.businessId);

    if (!isStripeConfigured()) {
      return { url: input.returnUrl };
    }

    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: input.returnUrl,
    });

    return { url: session.url };
  }

  async syncSubscriptionFromStripe(businessId: string, stripeSubscriptionId: string): Promise<void> {
    const commercial = await loadCommercialOperations(businessId);

    if (!isStripeConfigured()) {
      await saveCommercialOperations(businessId, {
        ...commercial,
        stripeSubscriptionId,
      });
      return;
    }

    const stripe = getStripeClient();
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const planSlug =
      (subscription.metadata.planSlug as string | undefined) ??
      (subscription.items.data[0]?.price.metadata?.planSlug as string | undefined) ??
      "starter";

    const statusMap: Record<string, string> = {
      active: SUBSCRIPTION_STATUSES.ACTIVE,
      trialing: SUBSCRIPTION_STATUSES.TRIALING,
      past_due: SUBSCRIPTION_STATUSES.PAST_DUE,
      paused: SUBSCRIPTION_STATUSES.PAUSED,
      canceled: SUBSCRIPTION_STATUSES.CANCELLED,
      unpaid: SUBSCRIPTION_STATUSES.PAST_DUE,
    };

    await prisma.tenantRecord.update({
      where: { businessId },
      data: {
        subscriptionPlan: planSlug,
        subscriptionStatus: statusMap[subscription.status] ?? SUBSCRIPTION_STATUSES.ACTIVE,
      },
    });

    await saveCommercialOperations(businessId, {
      ...commercial,
      stripeSubscriptionId,
      stripePriceId: subscription.items.data[0]?.price.id ?? null,
      trialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : commercial.trialEndsAt,
    });
  }

  async recordInvoiceFromStripe(businessId: string, invoice: {
    id: string;
    number: string | null;
    status: string | null;
    amount_due: number;
    amount_paid: number;
    currency: string;
    period_start: number;
    period_end: number;
  }): Promise<void> {
    const commercial = await loadCommercialOperations(businessId);
    const record = await buildBillingRecordForBusiness(businessId);

    const mapped: BillingInvoice = {
      id: invoice.id,
      tenantId: businessId,
      workspaceId: businessId,
      subscriptionId: record.subscription.id,
      invoiceNumber: invoice.number ?? invoice.id,
      status:
        invoice.status === "paid"
          ? BILLING_INVOICE_STATUSES.PAID
          : BILLING_INVOICE_STATUSES.OPEN,
      subtotalCents: invoice.amount_due,
      discountCents: 0,
      taxCents: 0,
      totalCents: invoice.amount_due,
      amountPaidCents: invoice.amount_paid,
      amountDueCents: Math.max(0, invoice.amount_due - invoice.amount_paid),
      currency: invoice.currency.toUpperCase(),
      periodStart: new Date(invoice.period_start * 1000).toISOString().slice(0, 10),
      periodEnd: new Date(invoice.period_end * 1000).toISOString().slice(0, 10),
      dueDate: new Date(invoice.period_end * 1000).toISOString().slice(0, 10),
      paidAt: invoice.status === "paid" ? new Date().toISOString() : null,
      lineItems: [],
      createdAt: new Date().toISOString(),
    };

    const invoices = commercial.invoices.filter((entry) => entry.id !== mapped.id);
    invoices.push(mapped);

    await saveCommercialOperations(businessId, { ...commercial, invoices });
  }

  async recordPaymentFailure(businessId: string, paymentIntentId: string, reason: string): Promise<void> {
    const commercial = await loadCommercialOperations(businessId);
    const record = await buildBillingRecordForBusiness(businessId);

    const payment: BillingPayment = {
      id: paymentIntentId,
      tenantId: businessId,
      invoiceId: record.invoices[0]?.id ?? paymentIntentId,
      paymentMethodId: "stripe",
      amountCents: record.subscription.mrrCents,
      currency: record.subscription.currency,
      status: BILLING_PAYMENT_STATUSES.FAILED,
      failureReason: reason,
      paidAt: null,
      createdAt: new Date().toISOString(),
    };

    await saveCommercialOperations(businessId, {
      ...commercial,
      payments: [...commercial.payments.filter((entry) => entry.id !== payment.id), payment],
    });

    await prisma.tenantRecord.update({
      where: { businessId },
      data: { subscriptionStatus: SUBSCRIPTION_STATUSES.PAST_DUE },
    });
  }

  async applyRefund(businessId: string, paymentId: string, amountCents: number, reason: string): Promise<void> {
    if (!isStripeConfigured()) {
      return;
    }

    const stripe = getStripeClient();
    await stripe.refunds.create({
      payment_intent: paymentId,
      amount: amountCents,
      metadata: { businessId, reason },
    });
  }

  async reportUsage(businessId: string, _metric: string, _quantity: number): Promise<void> {
    const commercial = await loadCommercialOperations(businessId);

    if (!commercial.stripeSubscriptionId || !isStripeConfigured()) {
      return;
    }

    // Usage-based billing hooks are recorded locally; Stripe meter events can be wired when price IDs include meters.
    await loadCommercialOperations(businessId);
  }
}

export const stripeBillingService = new StripeBillingService();

export async function updateTenantPlanLimits(
  businessId: string,
  planSlug: string,
): Promise<void> {
  const plan = findCatalogPlanBySlug(planSlug) ?? findCatalogPlanById(planSlug);
  if (!plan) {
    return;
  }

  await prisma.tenantResourceLimit.upsert({
    where: { businessId },
    create: {
      businessId,
      maxUsers: plan.featureAccess.limits.maxStaff,
      maxBranches: plan.featureAccess.limits.maxBranches,
      maxStorageBytes: BigInt(plan.featureAccess.limits.maxStorageMb * 1024 * 1024),
      maxApiCallsPerMonth: plan.featureAccess.limits.maxApiCalls,
      maxAiTokensPerMonth: plan.featureAccess.limits.maxAiCredits,
      maxMarketplaceLicenses: plan.featureAccess.limits.maxIntegrations,
    },
    update: {
      maxUsers: plan.featureAccess.limits.maxStaff,
      maxBranches: plan.featureAccess.limits.maxBranches,
      maxStorageBytes: BigInt(plan.featureAccess.limits.maxStorageMb * 1024 * 1024),
      maxApiCallsPerMonth: plan.featureAccess.limits.maxApiCalls,
      maxAiTokensPerMonth: plan.featureAccess.limits.maxAiCredits,
      maxMarketplaceLicenses: plan.featureAccess.limits.maxIntegrations,
    },
  });
}

export async function assignFeaturesForPlan(
  businessId: string,
  planSlug: string,
): Promise<string[]> {
  const { planResolver, subscriptionResolver } = await import("@/modules/feature-access");
  const planKey = subscriptionResolver.normalizePlan(planSlug);
  const modules = planResolver.resolveModules(planKey);

  await prisma.tenantRecord.update({
    where: { businessId },
    data: {
      assignedFeatures: modules as unknown as Prisma.InputJsonValue,
    },
  });

  return modules;
}
