import type {
  TenantActivityEvent,
  TenantImpersonationSession,
  TenantPlatformAuditLog,
  TenantPolicy,
  TenantRecord,
  TenantResourceLimit,
  TenantResourceUsage,
  TenantSettings,
} from "@prisma/client";

import type {
  ImpersonationSessionView,
  ResourceLimitView,
  ResourceUsageView,
  TenantActivityView,
  TenantAnalyticsView,
  TenantAuditLogView,
  TenantHealthView,
  TenantPlatformDashboardMetrics,
  TenantPolicyView,
  TenantRecordView,
  TenantSettingsView,
} from "@/modules/tenant-platform/types/tenant-platform-types";

export function serializeTenantRecord(record: TenantRecord): TenantRecordView {
  return {
    id: record.id,
    businessId: record.businessId,
    lifecycleStatus: record.lifecycleStatus,
    healthStatus: record.healthStatus,
    subscriptionPlan: record.subscriptionPlan,
    subscriptionStatus: record.subscriptionStatus,
    maintenanceMode: record.maintenanceMode,
    scheduledMaintenanceAt: record.scheduledMaintenanceAt?.toISOString() ?? null,
    branchCount: record.branchCount,
    suspendedAt: record.suspendedAt?.toISOString() ?? null,
    archivedAt: record.archivedAt?.toISOString() ?? null,
  };
}

export function serializeTenantSettings(settings: TenantSettings): TenantSettingsView {
  return {
    id: settings.id,
    displayName: settings.displayName,
    supportEmail: settings.supportEmail,
    billingEmail: settings.billingEmail,
    defaultTimezone: settings.defaultTimezone,
    defaultLocale: settings.defaultLocale,
    complianceMode: settings.complianceMode,
  };
}

export function serializeResourceLimit(limit: TenantResourceLimit): ResourceLimitView {
  return {
    maxUsers: limit.maxUsers,
    maxBranches: limit.maxBranches,
    maxStorageBytes: limit.maxStorageBytes.toString(),
    maxApiCallsPerMonth: limit.maxApiCallsPerMonth,
    maxAiTokensPerMonth: limit.maxAiTokensPerMonth,
    maxDatabaseRows: limit.maxDatabaseRows,
    maxMarketplaceLicenses: limit.maxMarketplaceLicenses,
  };
}

export function serializeResourceUsage(usage: TenantResourceUsage): ResourceUsageView {
  const moduleUsage =
    usage.moduleUsage && typeof usage.moduleUsage === "object" && !Array.isArray(usage.moduleUsage)
      ? (usage.moduleUsage as Record<string, number>)
      : {};

  return {
    activeUsers: usage.activeUsers,
    storageUsedBytes: usage.storageUsedBytes.toString(),
    apiCallsThisMonth: usage.apiCallsThisMonth,
    aiTokensThisMonth: usage.aiTokensThisMonth,
    databaseRows: usage.databaseRows,
    marketplaceLicenses: usage.marketplaceLicenses,
    fileCount: usage.fileCount,
    workflowCount: usage.workflowCount,
    loginActivityCount: usage.loginActivityCount,
    moduleUsage,
    lastCalculatedAt: usage.lastCalculatedAt.toISOString(),
  };
}

export function serializeTenantPolicy(policy: TenantPolicy): TenantPolicyView {
  return {
    id: policy.id,
    policyKey: policy.policyKey,
    name: policy.name,
    module: policy.module,
    isActive: policy.isActive,
  };
}

export function serializeTenantActivity(event: TenantActivityEvent): TenantActivityView {
  return {
    id: event.id,
    eventType: event.eventType,
    title: event.title,
    description: event.description,
    createdAt: event.createdAt.toISOString(),
  };
}

export function serializeTenantAuditLog(log: TenantPlatformAuditLog): TenantAuditLogView {
  return {
    id: log.id,
    eventType: log.eventType,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeImpersonationSession(
  session: TenantImpersonationSession,
): ImpersonationSessionView {
  return {
    id: session.id,
    adminUserId: session.adminUserId,
    targetUserId: session.targetUserId,
    reason: session.reason,
    isActive: session.isActive,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt?.toISOString() ?? null,
  };
}

export function serializeTenantPlatformDashboard(
  metrics: TenantPlatformDashboardMetrics,
): TenantPlatformDashboardMetrics {
  return metrics;
}

export type TenantPlatformDashboardView = TenantPlatformDashboardMetrics;

export type TenantAnalyticsViewSerialized = TenantAnalyticsView;

export type TenantHealthViewSerialized = TenantHealthView;
