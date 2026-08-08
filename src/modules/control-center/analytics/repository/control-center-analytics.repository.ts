import "server-only";

import { prisma } from "@/lib/prisma";
import { getPlanMrrPence } from "@/modules/control-center/billing/registry/subscription-plan-registry";
import type { ControlCenterAnalyticsRange } from "@/modules/control-center/analytics/types/control-center-analytics-types";

export interface AnalyticsDateWindow {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
  days: ControlCenterAnalyticsRange;
}

export function buildAnalyticsDateWindow(days: ControlCenterAnalyticsRange): AnalyticsDateWindow {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const previousEnd = new Date(start);
  previousEnd.setMilliseconds(-1);

  const previousStart = new Date(previousEnd);
  previousStart.setHours(0, 0, 0, 0);
  previousStart.setDate(previousStart.getDate() - (days - 1));

  return { start, end, previousStart, previousEnd, days };
}

export function computeGrowthPct(current: number, previous: number | null): number | null {
  if (previous === null || previous === 0) {
    return current === 0 ? 0 : null;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export async function buildDailyTrend(
  days: ControlCenterAnalyticsRange,
  counter: (dayStart: Date, dayEnd: Date) => Promise<number>,
): Promise<Array<{ day: string; value: number }>> {
  const points: Array<{ day: string; value: number }> = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - offset);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    points.push({
      day: dayStart.toISOString().slice(0, 10),
      value: await counter(dayStart, dayEnd),
    });
  }

  return points;
}

export async function countInRange(
  counter: (where: { gte: Date; lt: Date }) => Promise<number>,
  window: AnalyticsDateWindow,
  usePrevious = false,
): Promise<number> {
  const range = usePrevious
    ? { gte: window.previousStart, lt: window.previousEnd }
    : { gte: window.start, lt: window.end };

  return counter(range);
}

export async function aggregatePlatformMetrics(window: AnalyticsDateWindow) {
  const range = { gte: window.start, lt: window.end };
  const previousRange = { gte: window.previousStart, lt: window.previousEnd };

  const [
    totalBusinesses,
    totalTenants,
    activeTenants,
    totalUsers,
    totalCustomers,
    totalOrders,
    totalNotifications,
    totalIntegrations,
    openSupportTickets,
    securityEvents,
    activeSessions,
    totalInvoices,
    totalPayments,
    aiToolTokens,
    aiAgentTokens,
    storageUsage,
    apiRequests,
    marketplaceRevenue,
    revenueInvoices,
    healthyTenants,
    degradedTenants,
    criticalTenants,
    newBusinesses,
    previousNewBusinesses,
    newTenants,
    previousNewTenants,
    previousOrders,
    previousPayments,
    previousAiTokens,
    previousApiRequests,
    tenantPlans,
  ] = await Promise.all([
    prisma.business.count(),
    prisma.tenantRecord.count(),
    prisma.tenantRecord.count({ where: { lifecycleStatus: "ACTIVE" } }),
    prisma.user.count(),
    prisma.customer.count(),
    prisma.restaurantOrder.count({ where: { createdAt: range } }),
    prisma.notification.count({ where: { createdAt: range } }),
    prisma.integrationConnection.count({ where: { status: "ACTIVE" } }),
    prisma.communicationConversation.count({
      where: { status: { in: ["OPEN", "WAITING_STAFF", "WAITING_CUSTOMER"] } },
    }),
    prisma.iamSecurityAuditLog.count({ where: { createdAt: range } }),
    prisma.iamSession.count({ where: { isActive: true, revokedAt: null } }),
    prisma.revenueInvoice.count({ where: { createdAt: range } }),
    prisma.payment.count({ where: { createdAt: range } }),
    prisma.aiToolExecution.aggregate({
      where: { createdAt: range },
      _sum: { tokensUsed: true },
    }),
    prisma.aiAgentExecution.aggregate({
      where: { createdAt: range },
      _sum: { tokensUsed: true },
    }),
    prisma.tenantResourceUsage.aggregate({ _sum: { storageUsedBytes: true, aiTokensThisMonth: true } }),
    prisma.monitoringPerformanceLog.count({ where: { createdAt: range } }),
    prisma.marketplaceRevenueRecord.aggregate({
      where: { createdAt: range },
      _sum: { amountCents: true },
    }),
    prisma.revenueInvoice.aggregate({
      where: { createdAt: range },
      _sum: { totalPence: true },
    }),
    prisma.tenantRecord.count({ where: { healthStatus: "HEALTHY" } }),
    prisma.tenantRecord.count({ where: { healthStatus: "DEGRADED" } }),
    prisma.tenantRecord.count({ where: { healthStatus: "CRITICAL" } }),
    prisma.business.count({ where: { createdAt: range } }),
    prisma.business.count({ where: { createdAt: previousRange } }),
    prisma.tenantRecord.count({ where: { createdAt: range } }),
    prisma.tenantRecord.count({ where: { createdAt: previousRange } }),
    prisma.restaurantOrder.count({ where: { createdAt: previousRange } }),
    prisma.payment.count({ where: { createdAt: previousRange } }),
    Promise.all([
      prisma.aiToolExecution.aggregate({
        where: { createdAt: previousRange },
        _sum: { tokensUsed: true },
      }),
      prisma.aiAgentExecution.aggregate({
        where: { createdAt: previousRange },
        _sum: { tokensUsed: true },
      }),
    ]).then(([tools, agents]) => (tools._sum.tokensUsed ?? 0) + (agents._sum.tokensUsed ?? 0)),
    prisma.monitoringPerformanceLog.count({ where: { createdAt: previousRange } }),
    prisma.tenantRecord.findMany({
      select: { subscriptionPlan: true, subscriptionStatus: true },
    }),
  ]);

  const aiTokens = (aiToolTokens._sum.tokensUsed ?? 0) + (aiAgentTokens._sum.tokensUsed ?? 0);
  const mrrPence = tenantPlans.reduce(
    (sum, record) =>
      record.subscriptionStatus === "ACTIVE" || record.subscriptionStatus === "TRIAL"
        ? sum + getPlanMrrPence(record.subscriptionPlan)
        : sum,
    0,
  );
  const revenuePence =
    (marketplaceRevenue._sum.amountCents ?? 0) + (revenueInvoices._sum.totalPence ?? 0);

  return {
    totalBusinesses,
    totalTenants,
    activeTenants,
    totalWorkspaces: totalBusinesses,
    totalUsers,
    totalCustomers,
    totalOrders,
    previousOrders,
    totalNotifications,
    totalIntegrations,
    openSupportTickets,
    securityEvents,
    activeSessions,
    totalInvoices,
    totalPayments,
    previousPayments,
    aiTokens,
    previousAiTokens,
    storageBytes: Number(storageUsage._sum.storageUsedBytes ?? BigInt(0)),
    monthlyAiTokens: storageUsage._sum.aiTokensThisMonth ?? 0,
    apiRequests,
    previousApiRequests,
    revenuePence,
    mrrPence,
    healthyTenants,
    degradedTenants,
    criticalTenants,
    newBusinesses,
    previousNewBusinesses,
    newTenants,
    previousNewTenants,
  };
}

export async function loadTopBusinesses(limit = 10, search?: string) {
  const businesses = await prisma.business.findMany({
    where: search?.trim()
      ? {
          OR: [
            { businessName: { contains: search.trim(), mode: "insensitive" } },
            { owner: { email: { contains: search.trim(), mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: {
      tenantRecord: { select: { subscriptionPlan: true, healthStatus: true, branchCount: true } },
      owner: { select: { email: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  return businesses.map((business) => ({
    id: business.id,
    name: business.businessName ?? "Untitled",
    email: business.owner.email,
    plan: business.tenantRecord?.subscriptionPlan ?? "—",
    health: business.tenantRecord?.healthStatus ?? "—",
    branches: business.tenantRecord?.branchCount ?? 0,
  }));
}

export async function loadPlanDistribution() {
  const groups = await prisma.tenantRecord.groupBy({
    by: ["subscriptionPlan"],
    _count: { _all: true },
  });

  return groups.map((group) => ({
    plan: group.subscriptionPlan ?? "none",
    count: group._count._all,
    mrrPence: getPlanMrrPence(group.subscriptionPlan) * group._count._all,
  }));
}

export async function loadRecentSecurityEvents(limit = 10) {
  return prisma.iamSecurityAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { email: true } } },
  });
}

export async function loadSupportVolumeTrend(days: ControlCenterAnalyticsRange) {
  return buildDailyTrend(days, (dayStart, dayEnd) =>
    prisma.communicationConversation.count({
      where: { createdAt: { gte: dayStart, lt: dayEnd } },
    }),
  );
}

export async function loadBusinessGrowthTrend(days: ControlCenterAnalyticsRange) {
  return buildDailyTrend(days, (dayStart, dayEnd) =>
    prisma.business.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
  );
}

export async function loadRevenueTrend(days: ControlCenterAnalyticsRange) {
  return buildDailyTrend(days, async (dayStart, dayEnd) => {
    const [marketplace, invoices] = await Promise.all([
      prisma.marketplaceRevenueRecord.aggregate({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
        _sum: { amountCents: true },
      }),
      prisma.revenueInvoice.aggregate({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
        _sum: { totalPence: true },
      }),
    ]);

    return (marketplace._sum.amountCents ?? 0) + (invoices._sum.totalPence ?? 0);
  });
}

export async function loadAiUsageTrend(days: ControlCenterAnalyticsRange) {
  return buildDailyTrend(days, async (dayStart, dayEnd) => {
    const [tools, agents] = await Promise.all([
      prisma.aiToolExecution.aggregate({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
        _sum: { tokensUsed: true },
      }),
      prisma.aiAgentExecution.aggregate({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
        _sum: { tokensUsed: true },
      }),
    ]);

    return (tools._sum.tokensUsed ?? 0) + (agents._sum.tokensUsed ?? 0);
  });
}

export async function loadApiUsageTrend(days: ControlCenterAnalyticsRange) {
  return buildDailyTrend(days, (dayStart, dayEnd) =>
    prisma.monitoringPerformanceLog.count({
      where: { createdAt: { gte: dayStart, lt: dayEnd } },
    }),
  );
}

export async function loadOrderTrend(days: ControlCenterAnalyticsRange) {
  return buildDailyTrend(days, (dayStart, dayEnd) =>
    prisma.restaurantOrder.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
  );
}

export async function loadMarketplaceInstallTrend(days: ControlCenterAnalyticsRange) {
  return buildDailyTrend(days, (dayStart, dayEnd) =>
    prisma.marketplaceInstallation.count({
      where: { installedAt: { gte: dayStart, lt: dayEnd } },
    }),
  );
}

export async function loadOpenAlertsCount() {
  return prisma.platformAlert.count({
    where: { status: { in: ["ACTIVE", "ACKNOWLEDGED"] } },
  });
}

export async function loadIntegrationActivity(limit = 10) {
  return prisma.integrationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { connection: { select: { displayName: true } } },
  });
}
