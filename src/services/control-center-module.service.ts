import "server-only";

import { prisma } from "@/lib/prisma";
import type {
  ControlCenterActivityItem,
  ControlCenterAlertItem,
  ControlCenterDeploymentItem,
  ControlCenterIncidentItem,
  ControlCenterPlatformBundle,
  ControlCenterTenantSummary,
} from "@/modules/control-center/types/control-center-types";

import { getPlanMrrPence } from "@/modules/control-center/billing/registry/subscription-plan-registry";

function normalizePlan(plan: string | null | undefined): number {
  return getPlanMrrPence(plan);
}

export async function getControlCenterPlatformBundle(): Promise<ControlCenterPlatformBundle> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalTenants,
    activeBusinesses,
    allTenantMetrics,
    tenantRecords,
    recentBusinesses,
    marketplaceInstalls,
    marketplaceRevenue,
    aiToolTokens,
    aiAgentTokens,
    automationTokens,
    apiRequests,
    storageUsage,
    openAlerts,
    openIncidents,
    tenantActivities,
    backupRecords,
    communicationThreads,
  ] = await Promise.all([
    prisma.tenantRecord.count(),
    prisma.business.count({ where: { onboardingCompleted: true } }),
    prisma.tenantRecord.findMany({
      select: { subscriptionPlan: true, healthStatus: true },
    }),
    prisma.tenantRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { business: { select: { businessName: true, createdAt: true } } },
    }),
    prisma.business.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.marketplaceInstallation.count({ where: { status: "INSTALLED" } }),
    prisma.marketplaceRevenueRecord.aggregate({ _sum: { amountCents: true } }),
    prisma.aiToolExecution.aggregate({ _sum: { tokensUsed: true } }),
    prisma.aiAgentExecution.aggregate({ _sum: { tokensUsed: true } }),
    prisma.automationWorkflowExecution.aggregate({ _sum: { aiCostTokens: true } }),
    prisma.monitoringPerformanceLog.count(),
    prisma.platformFile.aggregate({ _sum: { sizeBytes: true } }),
    prisma.monitoringAlert.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.monitoringErrorLog.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.tenantActivityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.backupRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.communicationConversation.count({ where: { status: "OPEN" } }),
  ]);

  const mrrPence = allTenantMetrics.reduce(
    (sum, tenant) => sum + normalizePlan(tenant.subscriptionPlan),
    0,
  );

  const healthyTenants = allTenantMetrics.filter(
    (tenant) => tenant.healthStatus === "HEALTHY",
  ).length;
  const platformHealthScore =
    allTenantMetrics.length > 0 ? healthyTenants / allTenantMetrics.length : 1;

  const aiTokensUsed =
    (aiToolTokens._sum.tokensUsed ?? 0) +
    (aiAgentTokens._sum.tokensUsed ?? 0) +
    (automationTokens._sum.aiCostTokens ?? 0);

  const tenantSummaries: ControlCenterTenantSummary[] = tenantRecords.map((tenant) => ({
    id: tenant.id,
    businessName: tenant.business.businessName ?? "Untitled business",
    lifecycleStatus: tenant.lifecycleStatus,
    healthStatus: tenant.healthStatus,
    subscriptionPlan: tenant.subscriptionPlan,
    createdAt: tenant.business.createdAt.toISOString(),
  }));

  const activity: ControlCenterActivityItem[] = tenantActivities.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description ?? event.eventType,
    category: event.eventType,
    createdAt: event.createdAt.toISOString(),
  }));

  const incidents: ControlCenterIncidentItem[] = openIncidents.map((incident) => ({
    id: incident.id,
    title: incident.message,
    severity: incident.errorType,
    status: "OPEN",
    createdAt: incident.createdAt.toISOString(),
  }));

  const alerts: ControlCenterAlertItem[] = openAlerts.map((alert) => ({
    id: alert.id,
    title: alert.title,
    severity: alert.alertType,
    status: alert.status,
    createdAt: alert.createdAt.toISOString(),
  }));

  const deployments: ControlCenterDeploymentItem[] = backupRecords.map((record) => ({
    id: record.id,
    title: record.backupKey,
    environment: record.scope,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
  }));

  return {
    widgets: {
      totalTenants,
      activeBusinesses,
      mrrPence,
      arrPence: mrrPence * 12,
      platformRevenuePence: marketplaceRevenue._sum.amountCents ?? 0,
      aiTokensUsed,
      apiRequests,
      storageUsageBytes: storageUsage._sum.sizeBytes ?? 0,
      platformHealthScore,
      activeIncidents: openIncidents.length,
      marketplaceInstalls,
      systemAlerts: openAlerts.length,
      recentSignups: recentBusinesses,
      supportQueue: communicationThreads,
    },
    activity,
    tenantSummaries,
    incidents,
    alerts,
    deployments,
  };
}
