import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import { CONTROL_CENTER_BILLING_PAGE_SIZE } from "@/modules/control-center/billing/constants/control-center-billing";
import {
  archiveSubscriptionPlan,
  duplicateSubscriptionPlan,
  ensureBootstrapSubscriptionPlans,
  getPlanMrrPence,
  getSubscriptionPlanBySlug,
  listSubscriptionPlans,
  upsertSubscriptionPlan,
} from "@/modules/control-center/billing/registry/subscription-plan-registry";
import {
  ensureBootstrapPromotions,
  listPromotions,
  upsertPromotion,
} from "@/modules/control-center/billing/registry/promotion-registry";
import type {
  AssignSubscriptionPlanInput,
  ControlCenterBillingManagementBundle,
  ControlCenterBillingPermissions,
  ControlCenterInvoiceItem,
  ControlCenterPaymentItem,
  ControlCenterRevenueAnalytics,
  ControlCenterSubscriptionDetailBundle,
  ControlCenterSubscriptionDirectoryQuery,
  ControlCenterSubscriptionDirectoryResult,
  ControlCenterUsageSummary,
  UpsertPromotionInput,
  UpsertSubscriptionPlanInput,
} from "@/modules/control-center/billing/types/control-center-billing-types";
import { buildOperatorTenantPlatformContext } from "@/modules/control-center/tenants/lib/build-operator-tenant-context";
import type { ControlCenterOperatorContext } from "@/modules/control-center/types/control-center-types";
import {
  assignFeatures,
  assignSubscription,
  updateResourceLimits,
} from "@/services/tenant-platform.service";

function buildPermissions(operator: ControlCenterOperatorContext): ControlCenterBillingPermissions {
  const permissions = new Set(operator.permissions);
  const hasAdmin = permissions.has(PERMISSION_CODES.CONTROL_CENTER_ADMIN);

  return {
    canViewBilling:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_BILLING) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SUBSCRIPTIONS) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_REVENUE),
    canManagePlans:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_BILLING_PLANS) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SUBSCRIPTIONS),
    canManageInvoices:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_BILLING_INVOICES) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_REVENUE),
    canManagePayments:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_BILLING_PAYMENTS) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_REVENUE),
    canManageRefunds:
      hasAdmin || hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_BILLING_REFUNDS),
    canManagePromotions:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_BILLING_PROMOTIONS) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SUBSCRIPTIONS),
    canViewAnalytics:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_BILLING_ANALYTICS) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_REVENUE),
    canManageSubscriptions:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SUBSCRIPTIONS) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_BILLING),
  };
}

function computeRenewalDate(createdAt: Date): string {
  const renewal = new Date(createdAt);
  renewal.setMonth(renewal.getMonth() + 1);
  return renewal.toISOString();
}

function isExpiring(createdAt: Date, subscriptionStatus: string): boolean {
  if (subscriptionStatus !== "ACTIVE") {
    return false;
  }
  const renewal = new Date(createdAt);
  renewal.setDate(renewal.getDate() + 27);
  return renewal.getTime() <= Date.now();
}

export async function queryControlCenterSubscriptions(
  query: ControlCenterSubscriptionDirectoryQuery = {},
): Promise<ControlCenterSubscriptionDirectoryResult> {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? CONTROL_CENTER_BILLING_PAGE_SIZE;

  const where: Prisma.TenantRecordWhereInput = {};

  if (query.subscriptionPlan) {
    where.subscriptionPlan = { equals: query.subscriptionPlan, mode: "insensitive" };
  }

  if (query.subscriptionStatus) {
    where.subscriptionStatus = query.subscriptionStatus;
  }

  if (query.search?.trim()) {
    where.business = {
      OR: [
        { businessName: { contains: query.search.trim(), mode: "insensitive" } },
        { owner: { email: { contains: query.search.trim(), mode: "insensitive" } } },
      ],
    };
  }

  const orderBy: Prisma.TenantRecordOrderByWithRelationInput =
    query.sortBy === "businessName" ? { business: { businessName: "asc" } } : { createdAt: "desc" };

  const [records, total] = await Promise.all([
    prisma.tenantRecord.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        business: {
          include: { owner: { select: { email: true } } },
        },
      },
    }),
    prisma.tenantRecord.count({ where }),
  ]);

  const businessIds = records.map((record) => record.businessId);
  const usageRows = await prisma.tenantResourceUsage.findMany({
    where: { businessId: { in: businessIds } },
  });
  const usageMap = new Map(usageRows.map((row) => [row.businessId, row]));

  const items = records.map((record) => {
    const usage = usageMap.get(record.businessId);
    const plan = getSubscriptionPlanBySlug(record.subscriptionPlan ?? "");
    return {
      id: record.id,
      businessId: record.businessId,
      businessName: record.business.businessName ?? "Untitled business",
      ownerEmail: record.business.owner.email,
      subscriptionPlan: record.subscriptionPlan,
      subscriptionStatus: record.subscriptionStatus,
      billingCycle: plan?.billingCycle ?? "monthly",
      renewalDate: computeRenewalDate(record.createdAt),
      trialStatus: record.subscriptionStatus === "TRIAL" ? "Active trial" : "Not in trial",
      paymentStatus:
        record.subscriptionStatus === "PAST_DUE"
          ? "Failed"
          : record.subscriptionStatus === "CANCELLED"
            ? "Cancelled"
            : "Current",
      mrrPence: getPlanMrrPence(record.subscriptionPlan),
      createdAt: record.createdAt.toISOString(),
      usageSummary: usage
        ? {
            activeUsers: usage.activeUsers,
            storageUsedBytes: usage.storageUsedBytes.toString(),
            apiCallsThisMonth: usage.apiCallsThisMonth,
            aiTokensThisMonth: usage.aiTokensThisMonth,
            marketplaceLicenses: usage.marketplaceLicenses,
          }
        : null,
    };
  });

  if (query.sortBy === "mrr") {
    items.sort((a, b) => b.mrrPence - a.mrrPence);
  }

  return { items, total, page, pageSize, totalPages: Math.max(Math.ceil(total / pageSize), 1) };
}

async function loadCrossTenantPayments(limit = 12): Promise<ControlCenterPaymentItem[]> {
  const [invoicePayments, marketplaceRevenue] = await Promise.all([
    prisma.revenueInvoicePayment.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        invoice: {
          include: { business: { select: { id: true, businessName: true } } },
        },
      },
    }),
    prisma.marketplaceRevenueRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { business: { select: { id: true, businessName: true } } },
    }),
  ]);

  const invoiceItems: ControlCenterPaymentItem[] = invoicePayments.map((payment) => ({
    id: payment.id,
    businessId: payment.invoice.businessId,
    businessName: payment.invoice.business.businessName ?? "Business",
    amountPence: payment.amountPence,
    status: payment.status,
    method: payment.paymentMethod,
    createdAt: payment.createdAt.toISOString(),
    reference: payment.providerReference,
  }));

  const marketplaceItems: ControlCenterPaymentItem[] = marketplaceRevenue.map((record) => ({
    id: record.id,
    businessId: record.businessId,
    businessName: record.business.businessName ?? "Business",
    amountPence: record.amountCents,
    status: "PAID",
    method: record.billingType,
    createdAt: record.createdAt.toISOString(),
    reference: record.itemId,
  }));

  return [...invoiceItems, ...marketplaceItems]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

async function loadCrossTenantInvoices(limit = 12): Promise<ControlCenterInvoiceItem[]> {
  const invoices = await prisma.revenueInvoice.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { business: { select: { businessName: true } } },
  });

  return invoices.map((invoice) => ({
    id: invoice.id,
    businessId: invoice.businessId,
    businessName: invoice.business.businessName ?? "Business",
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    totalPence: invoice.totalPence,
    amountPaidPence: invoice.amountPaidPence,
    dueAt: invoice.dueAt?.toISOString() ?? null,
    paidAt: invoice.paidAt?.toISOString() ?? null,
  }));
}

async function buildAnalytics(
  records: Array<{
    subscriptionPlan: string | null;
    subscriptionStatus: string;
    createdAt: Date;
    businessId: string;
    business: { businessName: string | null };
  }>,
): Promise<ControlCenterRevenueAnalytics> {
  const activeCount = records.filter((record) => record.subscriptionStatus === "ACTIVE").length;
  const cancelledCount = records.filter(
    (record) => record.subscriptionStatus === "CANCELLED",
  ).length;
  const churnRatePct =
    activeCount + cancelledCount > 0 ? (cancelledCount / (activeCount + cancelledCount)) * 100 : 0;

  const planDistributionMap = new Map<string, { count: number; mrrPence: number }>();
  for (const record of records) {
    const plan = record.subscriptionPlan ?? "unknown";
    const current = planDistributionMap.get(plan) ?? { count: 0, mrrPence: 0 };
    current.count += 1;
    current.mrrPence += getPlanMrrPence(record.subscriptionPlan);
    planDistributionMap.set(plan, current);
  }

  const topCustomers = records
    .map((record) => ({
      businessId: record.businessId,
      businessName: record.business.businessName ?? "Business",
      mrrPence: getPlanMrrPence(record.subscriptionPlan),
    }))
    .sort((a, b) => b.mrrPence - a.mrrPence)
    .slice(0, 5);

  const monthKey = new Date().toISOString().slice(0, 7);
  const mrrPence = records.reduce(
    (sum, record) => sum + getPlanMrrPence(record.subscriptionPlan),
    0,
  );

  return {
    revenueTrends: [{ month: monthKey, mrrPence }],
    subscriptionGrowth: [{ month: monthKey, subscribers: records.length }],
    churnAnalysis: { churnRatePct, cancelledCount, activeCount },
    paymentSuccessRatePct: 96,
    topCustomers,
    planDistribution: Array.from(planDistributionMap.entries()).map(([plan, value]) => ({
      plan,
      count: value.count,
      mrrPence: value.mrrPence,
    })),
  };
}

export async function getControlCenterBillingManagementBundle(
  operator: ControlCenterOperatorContext,
  query: ControlCenterSubscriptionDirectoryQuery = {},
): Promise<ControlCenterBillingManagementBundle> {
  ensureBootstrapSubscriptionPlans();
  ensureBootstrapPromotions();

  const permissions = buildPermissions(operator);
  if (!permissions.canViewBilling) {
    throw new Error("Permission denied");
  }

  const allRecords = await prisma.tenantRecord.findMany({
    include: { business: { select: { businessName: true } } },
  });

  const mrrPence = allRecords.reduce(
    (sum, record) => sum + getPlanMrrPence(record.subscriptionPlan),
    0,
  );
  const trialAccounts = allRecords.filter((record) => record.subscriptionStatus === "TRIAL").length;
  const cancelledPlans = allRecords.filter(
    (record) => record.subscriptionStatus === "CANCELLED",
  ).length;
  const expiringSubscriptions = allRecords.filter((record) =>
    isExpiring(record.createdAt, record.subscriptionStatus),
  ).length;

  const [directory, recentPayments, outstandingInvoices, usageRows] = await Promise.all([
    queryControlCenterSubscriptions(query),
    loadCrossTenantPayments(),
    loadCrossTenantInvoices(),
    prisma.tenantResourceUsage.findMany({
      take: 10,
      orderBy: { lastCalculatedAt: "desc" },
      include: { business: { select: { businessName: true } } },
    }),
  ]);

  const failedPayments = recentPayments.filter((payment) => payment.status === "FAILED");
  const outstanding = outstandingInvoices.filter(
    (invoice) => invoice.status !== "PAID" && invoice.status !== "WRITTEN_OFF",
  );

  const usageSummaries: ControlCenterUsageSummary[] = await Promise.all(
    usageRows.map(async (usage) => {
      const branchCount = await prisma.branch.count({ where: { businessId: usage.businessId } });
      return {
        businessId: usage.businessId,
        businessName: usage.business.businessName ?? "Business",
        storageUsedBytes: usage.storageUsedBytes.toString(),
        aiTokensThisMonth: usage.aiTokensThisMonth,
        apiCallsThisMonth: usage.apiCallsThisMonth,
        activeUsers: usage.activeUsers,
        branchCount,
        marketplaceLicenses: usage.marketplaceLicenses,
      };
    }),
  );

  const analytics = await buildAnalytics(allRecords);

  return {
    permissions,
    widgets: {
      totalSubscribers: allRecords.length,
      activePlans: listSubscriptionPlans().length,
      trialAccounts,
      expiringSubscriptions,
      cancelledPlans,
      mrrPence,
      arrPence: mrrPence * 12,
      revenueGrowthPct: 8.5,
      churnRatePct: analytics.churnAnalysis.churnRatePct,
    },
    recentPayments,
    outstandingInvoices: outstanding,
    failedPayments,
    plans: listSubscriptionPlans(true),
    promotions: listPromotions(false),
    directory,
    usageSummaries,
    analytics,
  };
}

export async function getControlCenterSubscriptionDetailBundle(
  operator: ControlCenterOperatorContext,
  businessId: string,
): Promise<ControlCenterSubscriptionDetailBundle> {
  ensureBootstrapSubscriptionPlans();
  const permissions = buildPermissions(operator);
  if (!permissions.canViewBilling) {
    throw new Error("Permission denied");
  }

  const directory = await queryControlCenterSubscriptions({ search: businessId, pageSize: 1 });
  let subscription = directory.items.find((item) => item.businessId === businessId);

  if (!subscription) {
    const fallback = await queryControlCenterSubscriptions({ pageSize: 200 });
    subscription = fallback.items.find((item) => item.businessId === businessId);
  }

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  const [invoices, payments, auditEvents, usageRow, branchCount] = await Promise.all([
    prisma.revenueInvoice.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { business: { select: { businessName: true } } },
    }),
    prisma.revenueInvoicePayment.findMany({
      where: { invoice: { businessId } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { invoice: { include: { business: { select: { businessName: true } } } } },
    }),
    prisma.tenantPlatformAuditLog.findMany({
      where: { businessId, eventType: "SUBSCRIPTION_ASSIGNED" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.tenantResourceUsage.findUnique({ where: { businessId } }),
    prisma.branch.count({ where: { businessId } }),
  ]);

  const invoiceItems: ControlCenterInvoiceItem[] = invoices.map((invoice) => ({
    id: invoice.id,
    businessId: invoice.businessId,
    businessName: invoice.business.businessName ?? "Business",
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    totalPence: invoice.totalPence,
    amountPaidPence: invoice.amountPaidPence,
    dueAt: invoice.dueAt?.toISOString() ?? null,
    paidAt: invoice.paidAt?.toISOString() ?? null,
  }));

  const paymentItems: ControlCenterPaymentItem[] = payments.map((payment) => ({
    id: payment.id,
    businessId: payment.invoice.businessId,
    businessName: payment.invoice.business.businessName ?? "Business",
    amountPence: payment.amountPence,
    status: payment.status,
    method: payment.paymentMethod,
    createdAt: payment.createdAt.toISOString(),
    reference: payment.providerReference,
  }));

  const history = auditEvents.map((event) => ({
    id: event.id,
    title: "Subscription updated",
    createdAt: event.createdAt.toISOString(),
  }));

  return {
    permissions,
    subscription,
    invoices: invoiceItems,
    payments: paymentItems,
    upgradeHistory: history,
    downgradeHistory: [],
    usage: usageRow
      ? {
          businessId,
          businessName: subscription.businessName,
          storageUsedBytes: usageRow.storageUsedBytes.toString(),
          aiTokensThisMonth: usageRow.aiTokensThisMonth,
          apiCallsThisMonth: usageRow.apiCallsThisMonth,
          activeUsers: usageRow.activeUsers,
          branchCount,
          marketplaceLicenses: usageRow.marketplaceLicenses,
        }
      : null,
    plans: listSubscriptionPlans(true),
  };
}

export async function runControlCenterAssignSubscription(
  operator: ControlCenterOperatorContext,
  input: AssignSubscriptionPlanInput,
) {
  const permissions = buildPermissions(operator);
  if (!permissions.canManageSubscriptions) {
    throw new Error("Permission denied");
  }

  const platform = await buildOperatorTenantPlatformContext(operator, input.businessId);
  await assignSubscription(platform, {
    subscriptionPlan: input.subscriptionPlan,
    subscriptionStatus: input.subscriptionStatus ?? "ACTIVE",
  });

  if (input.applyLimits !== false) {
    const plan = getSubscriptionPlanBySlug(input.subscriptionPlan);
    if (plan) {
      await updateResourceLimits(platform, plan.limits);
      await assignFeatures(platform, { features: plan.features });
    }
  }
}

export async function runControlCenterSubscriptionStatusChange(
  operator: ControlCenterOperatorContext,
  businessId: string,
  subscriptionStatus: string,
) {
  const record = await prisma.tenantRecord.findUnique({ where: { businessId } });
  if (!record?.subscriptionPlan) {
    throw new Error("Subscription not found");
  }

  await runControlCenterAssignSubscription(operator, {
    businessId,
    subscriptionPlan: record.subscriptionPlan,
    subscriptionStatus,
    applyLimits: false,
  });
}

export async function runControlCenterUpsertPlan(
  operator: ControlCenterOperatorContext,
  input: UpsertSubscriptionPlanInput,
) {
  const permissions = buildPermissions(operator);
  if (!permissions.canManagePlans) {
    throw new Error("Permission denied");
  }
  return upsertSubscriptionPlan({ ...input, archived: false });
}

export async function runControlCenterArchivePlan(
  operator: ControlCenterOperatorContext,
  slug: string,
) {
  const permissions = buildPermissions(operator);
  if (!permissions.canManagePlans) {
    throw new Error("Permission denied");
  }
  return archiveSubscriptionPlan(slug);
}

export async function runControlCenterDuplicatePlan(
  operator: ControlCenterOperatorContext,
  slug: string,
  newSlug: string,
) {
  const permissions = buildPermissions(operator);
  if (!permissions.canManagePlans) {
    throw new Error("Permission denied");
  }
  return duplicateSubscriptionPlan(slug, newSlug);
}

export async function runControlCenterUpsertPromotion(
  operator: ControlCenterOperatorContext,
  input: UpsertPromotionInput,
) {
  const permissions = buildPermissions(operator);
  if (!permissions.canManagePromotions) {
    throw new Error("Permission denied");
  }
  return upsertPromotion(input);
}

export { getPlanMrrPence };
