import "server-only";

import { prisma } from "@/lib/prisma";
import { getPlanMrrPence } from "@/modules/control-center/billing/registry/subscription-plan-registry";
import type {
  PlatformIntelligenceAlert,
  PlatformIntelligenceBusinessRanking,
  PlatformIntelligenceQuery,
  PlatformIntelligenceRange,
  PlatformIntelligenceRecommendation,
  PlatformIntelligenceTrendPoint,
} from "@/modules/control-center/platform-intelligence/types/platform-intelligence-types";

export interface IntelligenceDateWindow {
  start: Date | null;
  end: Date;
  previousStart: Date | null;
  previousEnd: Date | null;
  range: PlatformIntelligenceRange;
}

export function buildIntelligenceDateWindow(range: PlatformIntelligenceRange): IntelligenceDateWindow {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  if (range === "all") {
    return { start: null, end, previousStart: null, previousEnd: null, range };
  }

  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (range - 1));

  const previousEnd = new Date(start);
  previousEnd.setMilliseconds(-1);

  const previousStart = new Date(previousEnd);
  previousStart.setHours(0, 0, 0, 0);
  previousStart.setDate(previousStart.getDate() - (range - 1));

  return { start, end, previousStart, previousEnd, range };
}

export function computeGrowthPct(current: number, previous: number | null): number | null {
  if (previous === null || previous === 0) {
    return current === 0 ? 0 : null;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function dateFilter(window: IntelligenceDateWindow) {
  if (!window.start) return undefined;
  return { gte: window.start, lt: window.end };
}

function previousDateFilter(window: IntelligenceDateWindow) {
  if (!window.previousStart || !window.previousEnd) return undefined;
  return { gte: window.previousStart, lt: window.previousEnd };
}

function businessScope(query: PlatformIntelligenceQuery) {
  if (query.drillDown === "business" && query.drillDownId) {
    return { businessId: query.drillDownId };
  }
  if (query.drillDown === "tenant" && query.drillDownId) {
    return { businessId: query.drillDownId };
  }
  if (query.drillDown === "workspace" && query.drillDownId) {
    return { businessId: query.drillDownId.replace(/-ws$/, "") };
  }
  return {};
}

export async function buildIntelligenceTrend(
  window: IntelligenceDateWindow,
  days: number,
  counter: (dayStart: Date, dayEnd: Date) => Promise<number>,
): Promise<PlatformIntelligenceTrendPoint[]> {
  const points: PlatformIntelligenceTrendPoint[] = [];
  const effectiveDays = window.range === "all" ? Math.min(days, 90) : window.range;

  for (let offset = effectiveDays - 1; offset >= 0; offset -= 1) {
    const dayStart = new Date(window.end);
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

export interface AggregatedIntelligenceMetrics {
  totalBusinesses: number;
  activeTenants: number;
  healthyTenants: number;
  degradedTenants: number;
  criticalTenants: number;
  mrrPence: number;
  periodRevenuePence: number;
  previousRevenuePence: number;
  totalOrders: number;
  previousOrders: number;
  aiRequests: number;
  previousAiRequests: number;
  activeFeatureFlags: number;
  securityEvents: number;
  openSupportTickets: number;
  openAlerts: number;
  notificationsSent: number;
  activeIntegrations: number;
  customers: number;
  reservations: number;
  inventoryItems: number;
  posPayments: number;
  operatorCount: number;
  previousNewBusinesses: number;
  newBusinesses: number;
  avgApiDurationMs: number;
  storageUsedBytes: number;
}

export async function aggregateIntelligenceMetrics(
  window: IntelligenceDateWindow,
  query: PlatformIntelligenceQuery,
): Promise<AggregatedIntelligenceMetrics> {
  const range = dateFilter(window);
  const previousRange = previousDateFilter(window);
  const scope = businessScope(query);

  const [
    totalBusinesses,
    activeTenants,
    healthyTenants,
    degradedTenants,
    criticalTenants,
    tenantPlans,
    marketplaceRevenue,
    revenueInvoices,
    previousMarketplaceRevenue,
    previousRevenueInvoices,
    totalOrders,
    previousOrders,
    aiToolCount,
    aiAgentCount,
    previousAiToolCount,
    previousAiAgentCount,
    activeFeatureFlags,
    securityEvents,
    openSupportTickets,
    openAlerts,
    notificationsSent,
    activeIntegrations,
    customers,
    reservations,
    inventoryItems,
    posPayments,
    newBusinesses,
    previousNewBusinesses,
    perfLogs,
    storageUsage,
  ] = await Promise.all([
    prisma.business.count(scope.businessId ? { where: { id: scope.businessId } } : undefined),
    prisma.tenantRecord.count({
      where: { lifecycleStatus: "ACTIVE", ...(scope.businessId ? { businessId: scope.businessId } : {}) },
    }),
    prisma.tenantRecord.count({
      where: { healthStatus: "HEALTHY", ...(scope.businessId ? { businessId: scope.businessId } : {}) },
    }),
    prisma.tenantRecord.count({
      where: { healthStatus: "DEGRADED", ...(scope.businessId ? { businessId: scope.businessId } : {}) },
    }),
    prisma.tenantRecord.count({
      where: { healthStatus: "CRITICAL", ...(scope.businessId ? { businessId: scope.businessId } : {}) },
    }),
    prisma.tenantRecord.findMany({
      where: scope.businessId ? { businessId: scope.businessId } : undefined,
      select: { subscriptionPlan: true, subscriptionStatus: true },
    }),
    range
      ? prisma.marketplaceRevenueRecord.aggregate({
          where: { createdAt: range, ...scope },
          _sum: { amountCents: true },
        })
      : prisma.marketplaceRevenueRecord.aggregate({ where: scope, _sum: { amountCents: true } }),
    range
      ? prisma.revenueInvoice.aggregate({
          where: { createdAt: range, ...scope },
          _sum: { totalPence: true },
        })
      : prisma.revenueInvoice.aggregate({ where: scope, _sum: { totalPence: true } }),
    previousRange
      ? prisma.marketplaceRevenueRecord.aggregate({
          where: { createdAt: previousRange, ...scope },
          _sum: { amountCents: true },
        })
      : Promise.resolve({ _sum: { amountCents: 0 } }),
    previousRange
      ? prisma.revenueInvoice.aggregate({
          where: { createdAt: previousRange, ...scope },
          _sum: { totalPence: true },
        })
      : Promise.resolve({ _sum: { totalPence: 0 } }),
    range
      ? prisma.restaurantOrder.count({ where: { createdAt: range, ...scope } })
      : prisma.restaurantOrder.count({ where: scope }),
    previousRange
      ? prisma.restaurantOrder.count({ where: { createdAt: previousRange, ...scope } })
      : Promise.resolve(0),
    range
      ? prisma.aiToolExecution.count({ where: { createdAt: range, ...scope } })
      : prisma.aiToolExecution.count({ where: scope }),
    range
      ? prisma.aiAgentExecution.count({ where: { createdAt: range, ...scope } })
      : prisma.aiAgentExecution.count({ where: scope }),
    previousRange
      ? prisma.aiToolExecution.count({ where: { createdAt: previousRange, ...scope } })
      : Promise.resolve(0),
    previousRange
      ? prisma.aiAgentExecution.count({ where: { createdAt: previousRange, ...scope } })
      : Promise.resolve(0),
    prisma.featureFlag.count({ where: { status: "ACTIVE" } }),
    range
      ? prisma.iamSecurityAuditLog.count({ where: { createdAt: range, ...scope } })
      : prisma.iamSecurityAuditLog.count({ where: scope }),
    prisma.communicationConversation.count({
      where: { status: { in: ["OPEN", "WAITING_STAFF", "WAITING_CUSTOMER"] }, ...scope },
    }),
    prisma.platformAlert.count({ where: { status: { in: ["ACTIVE", "ACKNOWLEDGED"] }, ...scope } }),
    range
      ? prisma.notification.count({ where: { createdAt: range, ...scope } })
      : prisma.notification.count({ where: scope }),
    prisma.integrationConnection.count({
      where: { status: "ACTIVE", ...(scope.businessId ? scope : {}) },
    }),
    prisma.customer.count({ where: scope }),
    range
      ? prisma.reservation.count({ where: { createdAt: range, ...scope } })
      : prisma.reservation.count({ where: scope }),
    prisma.inventoryItem.count({ where: scope }),
    range
      ? prisma.payment.count({ where: { createdAt: range, ...scope } })
      : prisma.payment.count({ where: scope }),
    range
      ? prisma.business.count({ where: { createdAt: range, ...scope } })
      : Promise.resolve(0),
    previousRange
      ? prisma.business.count({ where: { createdAt: previousRange, ...scope } })
      : Promise.resolve(0),
    prisma.monitoringPerformanceLog.findMany({
      where: {
        ...(range ? { createdAt: range } : {}),
        ...(scope.businessId ? scope : {}),
      },
      select: { durationMs: true },
      take: 2000,
    }),
    prisma.tenantResourceUsage.aggregate({
      where: scope.businessId ? scope : undefined,
      _sum: { storageUsedBytes: true },
    }),
  ]);

  const mrrPence = tenantPlans.reduce(
    (sum, record) =>
      record.subscriptionStatus === "ACTIVE" || record.subscriptionStatus === "TRIAL"
        ? sum + getPlanMrrPence(record.subscriptionPlan)
        : sum,
    0,
  );

  const periodRevenuePence =
    (marketplaceRevenue._sum.amountCents ?? 0) + (revenueInvoices._sum.totalPence ?? 0);
  const previousRevenuePence =
    (previousMarketplaceRevenue._sum.amountCents ?? 0) + (previousRevenueInvoices._sum.totalPence ?? 0);

  return {
    totalBusinesses,
    activeTenants,
    healthyTenants,
    degradedTenants,
    criticalTenants,
    mrrPence,
    periodRevenuePence,
    previousRevenuePence,
    totalOrders,
    previousOrders,
    aiRequests: aiToolCount + aiAgentCount,
    previousAiRequests: previousAiToolCount + previousAiAgentCount,
    activeFeatureFlags,
    securityEvents,
    openSupportTickets,
    openAlerts,
    notificationsSent,
    activeIntegrations,
    customers,
    reservations,
    inventoryItems,
    posPayments,
    operatorCount: 0,
    newBusinesses,
    previousNewBusinesses,
    avgApiDurationMs:
      perfLogs.length > 0
        ? Math.round(perfLogs.reduce((sum, log) => sum + log.durationMs, 0) / perfLogs.length)
        : 0,
    storageUsedBytes: Number(storageUsage._sum.storageUsedBytes ?? BigInt(0)),
  };
}

export function computePlatformHealthScore(metrics: AggregatedIntelligenceMetrics): number {
  const tenantHealth =
    metrics.activeTenants === 0
      ? 100
      : Math.round((metrics.healthyTenants / metrics.activeTenants) * 100);
  const supportPenalty = Math.min(metrics.openSupportTickets * 3, 30);
  const alertPenalty = Math.min(metrics.openAlerts * 5, 25);
  const securityPenalty = Math.min(Math.floor(metrics.securityEvents / 10), 20);
  return Math.max(0, Math.min(100, tenantHealth - supportPenalty - alertPenalty - securityPenalty));
}

export function computeGrowthScore(metrics: AggregatedIntelligenceMetrics): number {
  const signupGrowth = computeGrowthPct(metrics.newBusinesses, metrics.previousNewBusinesses) ?? 0;
  const revenueGrowth =
    computeGrowthPct(metrics.periodRevenuePence, metrics.previousRevenuePence) ?? 0;
  const orderGrowth = computeGrowthPct(metrics.totalOrders, metrics.previousOrders) ?? 0;
  const composite = (signupGrowth + revenueGrowth + orderGrowth) / 3;
  return Math.max(0, Math.min(100, Math.round(50 + composite / 2)));
}

export function computeChurnRiskScore(metrics: AggregatedIntelligenceMetrics): number {
  if (metrics.activeTenants === 0) return 0;
  const unhealthyRatio =
    (metrics.degradedTenants + metrics.criticalTenants * 2) / Math.max(metrics.activeTenants, 1);
  return Math.max(0, Math.min(100, Math.round(unhealthyRatio * 100)));
}

export function computeAiAdoptionScore(metrics: AggregatedIntelligenceMetrics): number {
  if (metrics.totalBusinesses === 0) return 0;
  const requestsPerBusiness = metrics.aiRequests / metrics.totalBusinesses;
  return Math.max(0, Math.min(100, Math.round(Math.min(requestsPerBusiness * 5, 100))));
}

export function computeFeatureAdoptionScore(metrics: AggregatedIntelligenceMetrics): number {
  if (metrics.totalBusinesses === 0) return 0;
  const flagsPerBusiness = metrics.activeFeatureFlags / metrics.totalBusinesses;
  return Math.max(0, Math.min(100, Math.round(Math.min(flagsPerBusiness * 20, 100))));
}

export function computeSecurityRiskScore(metrics: AggregatedIntelligenceMetrics): number {
  return Math.max(0, Math.min(100, Math.min(metrics.securityEvents, 100)));
}

export function computeSupportHealthScore(metrics: AggregatedIntelligenceMetrics): number {
  return Math.max(0, Math.min(100, 100 - Math.min(metrics.openSupportTickets * 4, 100)));
}

export function computeSystemCapacityScore(metrics: AggregatedIntelligenceMetrics): number {
  const storageGb = metrics.storageUsedBytes / (1024 * 1024 * 1024);
  const penalty = Math.min(Math.round(storageGb / 10), 40) + Math.min(metrics.avgApiDurationMs / 50, 30);
  return Math.max(0, Math.min(100, 100 - penalty));
}

export function forecastRevenue(metrics: AggregatedIntelligenceMetrics, range: PlatformIntelligenceRange): number {
  const days = range === "all" ? 30 : range;
  const dailyAvg = metrics.periodRevenuePence / Math.max(days, 1);
  return Math.round(dailyAvg * 30);
}

export async function loadBusinessIntelligenceRankings(
  window: IntelligenceDateWindow,
  query: PlatformIntelligenceQuery,
): Promise<PlatformIntelligenceBusinessRanking[]> {
  const range = dateFilter(window);
  const search = query.search?.trim().toLowerCase();

  const businesses = await prisma.business.findMany({
    where: search
      ? {
          OR: [
            { businessName: { contains: search, mode: "insensitive" } },
            { owner: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: {
      tenantRecord: { select: { healthStatus: true, subscriptionPlan: true } },
      owner: { select: { email: true } },
    },
    take: 200,
    orderBy: { updatedAt: "desc" },
  });

  const rankings: PlatformIntelligenceBusinessRanking[] = [];

  for (const business of businesses) {
    if (query.drillDown === "business" && query.drillDownId && business.id !== query.drillDownId) {
      continue;
    }

    const [orders, revenue, aiUsage, lastOrder] = await Promise.all([
      range
        ? prisma.restaurantOrder.count({ where: { businessId: business.id, createdAt: range } })
        : prisma.restaurantOrder.count({ where: { businessId: business.id } }),
      range
        ? prisma.revenueInvoice.aggregate({
            where: { businessId: business.id, createdAt: range },
            _sum: { totalPence: true },
          })
        : prisma.revenueInvoice.aggregate({
            where: { businessId: business.id },
            _sum: { totalPence: true },
          }),
      range
        ? prisma.aiToolExecution.count({ where: { businessId: business.id, createdAt: range } })
        : prisma.aiToolExecution.count({ where: { businessId: business.id } }),
      prisma.restaurantOrder.findFirst({
        where: { businessId: business.id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const health = business.tenantRecord?.healthStatus ?? "HEALTHY";
    const healthScore =
      health === "HEALTHY" ? 90 : health === "DEGRADED" ? 60 : health === "CRITICAL" ? 25 : 50;
    const activityScore = Math.min(orders * 5, 50);
    const revenuePence = revenue._sum.totalPence ?? 0;
    const score = Math.min(100, healthScore + activityScore);

    const daysSinceActivity = lastOrder
      ? Math.floor((Date.now() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    let riskLevel: PlatformIntelligenceBusinessRanking["riskLevel"] = "low";
    if (health === "CRITICAL" || daysSinceActivity > 60) riskLevel = "high";
    else if (health === "DEGRADED" || daysSinceActivity > 30) riskLevel = "medium";

    rankings.push({
      id: business.id,
      name: business.businessName ?? "Untitled",
      workspaceId: `${business.id}-ws`,
      score,
      metric: `£${(revenuePence / 100).toFixed(0)}`,
      metricLabel: "Revenue",
      secondary: `${orders} orders · ${aiUsage} AI calls · ${business.owner.email}`,
      riskLevel,
    });
  }

  return rankings;
}

export function buildAlerts(metrics: AggregatedIntelligenceMetrics): PlatformIntelligenceAlert[] {
  const alerts: PlatformIntelligenceAlert[] = [];

  if (metrics.criticalTenants > 0) {
    alerts.push({
      id: "critical-tenants",
      severity: "critical",
      title: "Critical tenant health detected",
      description: `${metrics.criticalTenants} tenant(s) are in critical health status.`,
      module: "tenants",
    });
  }

  if (metrics.openSupportTickets > 10) {
    alerts.push({
      id: "support-backlog",
      severity: "warning",
      title: "Support backlog elevated",
      description: `${metrics.openSupportTickets} open support conversations require attention.`,
      module: "support",
    });
  }

  if (metrics.securityEvents > 50) {
    alerts.push({
      id: "security-volume",
      severity: "warning",
      title: "Elevated security activity",
      description: `${metrics.securityEvents} security audit events recorded in the selected period.`,
      module: "security",
    });
  }

  if (metrics.openAlerts > 0) {
    alerts.push({
      id: "platform-alerts",
      severity: "info",
      title: "Active platform alerts",
      description: `${metrics.openAlerts} monitoring alert(s) are currently open.`,
      module: "monitoring",
    });
  }

  if (metrics.avgApiDurationMs > 500) {
    alerts.push({
      id: "api-latency",
      severity: "warning",
      title: "Operational bottleneck detected",
      description: `Average API response time is ${metrics.avgApiDurationMs}ms in the selected period.`,
      module: "monitoring",
    });
  }

  return alerts;
}

export function buildRecommendations(
  metrics: AggregatedIntelligenceMetrics,
  rankings: PlatformIntelligenceBusinessRanking[],
): PlatformIntelligenceRecommendation[] {
  const recommendations: PlatformIntelligenceRecommendation[] = [];
  const atRisk = rankings.filter((row) => row.riskLevel === "high").length;
  const dormant = rankings.filter((row) => row.score < 40).length;

  if (atRisk > 0) {
    recommendations.push({
      id: "review-at-risk",
      priority: "high",
      title: "Review at-risk businesses",
      description: `${atRisk} business(es) show high churn risk based on health and inactivity signals.`,
      actionLabel: "Review rankings",
    });
  }

  if (metrics.aiRequests / Math.max(metrics.totalBusinesses, 1) < 5) {
    recommendations.push({
      id: "ai-adoption",
      priority: "medium",
      title: "Increase AI adoption",
      description: "AI usage per business is below platform targets. Consider enablement campaigns.",
      actionLabel: "Open AI Usage",
    });
  }

  if (dormant > 0) {
    recommendations.push({
      id: "reactivate-dormant",
      priority: "medium",
      title: "Re-engage dormant businesses",
      description: `${dormant} business(es) show low activity scores and may need outreach.`,
      actionLabel: "View dormant list",
    });
  }

  if (metrics.activeFeatureFlags < metrics.totalBusinesses) {
    recommendations.push({
      id: "feature-rollout",
      priority: "low",
      title: "Expand feature adoption",
      description: "Active feature flags are lower than total businesses. Review rollout coverage.",
      actionLabel: "Feature Management",
    });
  }

  const expansionCandidates = rankings.filter((row) => row.score > 75).length;
  if (expansionCandidates > 0) {
    recommendations.push({
      id: "expansion",
      priority: "low",
      title: "Expansion opportunities",
      description: `${expansionCandidates} high-performing business(es) may be ready for plan upgrades.`,
      actionLabel: "Review top performers",
    });
  }

  return recommendations;
}

export function buildExecutiveSummary(
  metrics: AggregatedIntelligenceMetrics,
  platformHealth: number,
  growthScore: number,
): { weekly: string; monthly: string } {
  const weekly = [
    `Platform health is ${platformHealth}/100 with ${metrics.activeTenants} active tenants.`,
    `Growth score ${growthScore}/100 driven by ${metrics.newBusinesses} new businesses and ${metrics.totalOrders} orders.`,
    `${metrics.aiRequests} AI requests and ${metrics.activeFeatureFlags} active feature flags indicate adoption momentum.`,
    `${metrics.openSupportTickets} open support tickets and ${metrics.openAlerts} platform alerts require operator attention.`,
  ].join(" ");

  const monthly = [
    `Monthly recurring revenue stands at £${(metrics.mrrPence / 100).toFixed(0)} with period revenue of £${(metrics.periodRevenuePence / 100).toFixed(0)}.`,
    `Revenue forecast projects £${(forecastRevenue(metrics, 30) / 100).toFixed(0)} over the next 30 days based on current run-rate.`,
    `CRM base of ${metrics.customers} customers, ${metrics.reservations} reservations, and ${metrics.posPayments} POS payments reflects operational breadth.`,
    `Security events (${metrics.securityEvents}) and system capacity indicators should be monitored alongside ${metrics.activeIntegrations} active integrations.`,
  ].join(" ");

  return { weekly, monthly };
}

export function buildOperationalInsights(metrics: AggregatedIntelligenceMetrics): string[] {
  return [
    `${metrics.totalOrders} orders processed in the selected period (${computeGrowthPct(metrics.totalOrders, metrics.previousOrders) ?? 0}% vs prior).`,
    `${metrics.notificationsSent} notifications delivered across the platform.`,
    `${metrics.inventoryItems} inventory items tracked with ${metrics.reservations} reservations recorded.`,
    `Average API response time: ${metrics.avgApiDurationMs}ms · Storage used: ${(metrics.storageUsedBytes / (1024 ** 3)).toFixed(1)} GB.`,
    `${metrics.operatorCount} operator registry entries and ${metrics.activeIntegrations} active integrations support platform operations.`,
  ];
}
