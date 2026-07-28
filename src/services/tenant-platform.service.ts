import "server-only";

import type { TenantAuditEventType, TenantMaintenanceMode, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  evaluatePermission,
  toPermissionEvaluationContext,
} from "@/modules/iam/engine/permission-engine";
import { buildTenantAnalytics } from "@/modules/tenant-platform/engine/analytics-engine";
import {
  buildHealthChecks,
  evaluateTenantHealth,
} from "@/modules/tenant-platform/engine/health-engine";
import { assertTenantIsolation } from "@/modules/tenant-platform/engine/isolation-engine";
import {
  countUsageBreaches,
  isLimitExceeded,
} from "@/modules/tenant-platform/engine/limits-engine";
import { resolveEffectiveMaintenanceMode } from "@/modules/tenant-platform/engine/maintenance-engine";
import { resolveLifecycleTransition } from "@/modules/tenant-platform/engine/lifecycle-engine";
import { DEFAULT_TENANT_FEATURES } from "@/modules/tenant-platform/constants/routes";
import { ensureBootstrapTenantPlatform } from "@/modules/tenant-platform/plugins/bootstrap-tenant-platform";
import {
  listTenantPolicyDefinitions,
  registerTenantPolicyDefinition,
} from "@/modules/tenant-platform/registry/policy-registry";
import type {
  CreateTenantInput,
  FeatureAssignmentInput,
  ImpersonationInput,
  RegisteredTenantPolicyDefinition,
  ResourceLimitInput,
  SubscriptionAssignmentInput,
  TenantPlatformDashboardMetrics,
  TenantProfileInput,
  TenantSettingsInput,
} from "@/modules/tenant-platform/types/tenant-platform-types";
import { recordStructuredLog } from "@/services/monitoring-platform.service";

function assertPermission(platform: BusinessContext, permission: string): void {
  const context = toPermissionEvaluationContext({
    permissions: platform.permissions,
    roleSlug: platform.roleSlug ?? null,
    isOwner: platform.isOwner,
    businessId: platform.business.id,
    branchId: platform.branchId,
  });

  if (!evaluatePermission(context, permission)) {
    throw new Error(`Permission denied: ${permission} required`);
  }
}

async function logTenantAudit(input: {
  businessId?: string | null;
  userId?: string | null;
  eventType: TenantAuditEventType;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.tenantPlatformAuditLog.create({
    data: {
      businessId: input.businessId ?? null,
      userId: input.userId ?? null,
      eventType: input.eventType,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

async function recordTenantActivity(input: {
  businessId: string;
  userId?: string | null;
  eventType: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.tenantActivityEvent.create({
    data: {
      businessId: input.businessId,
      userId: input.userId ?? null,
      eventType: input.eventType,
      title: input.title,
      description: input.description ?? null,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });

  await logTenantAudit({
    businessId: input.businessId,
    userId: input.userId,
    eventType: "ACTIVITY_RECORDED",
    metadata: { eventType: input.eventType, title: input.title },
  });
}

async function syncPolicyToDatabase(
  businessId: string,
  definition: RegisteredTenantPolicyDefinition,
): Promise<void> {
  await prisma.tenantPolicy.upsert({
    where: {
      businessId_policyKey: {
        businessId,
        policyKey: definition.policyKey,
      },
    },
    create: {
      businessId,
      policyKey: definition.policyKey,
      name: definition.name,
      module: definition.module,
      description: definition.description ?? "",
      rules: definition.rules as unknown as Prisma.InputJsonValue,
      isActive: definition.isActive,
    },
    update: {
      name: definition.name,
      module: definition.module,
      description: definition.description ?? "",
      rules: definition.rules as unknown as Prisma.InputJsonValue,
      isActive: definition.isActive,
    },
  });
}

async function refreshTenantUsage(businessId: string): Promise<void> {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [
    staffCount,
    branchCount,
    apiCalls,
    fileStorage,
    fileCount,
    workflowCount,
    marketplaceLicenses,
    loginActivityCount,
    aiToolTokens,
    aiAgentTokens,
  ] = await Promise.all([
    prisma.staff.count({ where: { businessId } }),
    prisma.branch.count({ where: { businessId } }),
    prisma.apiRequestLog.count({
      where: { businessId, createdAt: { gte: monthStart } },
    }),
    prisma.platformFile.aggregate({
      where: { businessId },
      _sum: { sizeBytes: true },
    }),
    prisma.platformFile.count({ where: { businessId } }),
    prisma.automationWorkflow.count({ where: { businessId } }),
    prisma.marketplaceLicense.count({ where: { businessId, status: "ACTIVE" } }),
    prisma.iamSession.count({
      where: { businessId, loginAt: { gte: monthStart } },
    }),
    prisma.aiToolExecution.aggregate({
      where: { businessId, createdAt: { gte: monthStart } },
      _sum: { tokensUsed: true },
    }),
    prisma.aiAgentExecution.aggregate({
      where: { businessId, createdAt: { gte: monthStart } },
      _sum: { tokensUsed: true },
    }),
  ]);

  const aiTokensThisMonth =
    (aiToolTokens._sum.tokensUsed ?? 0) + (aiAgentTokens._sum.tokensUsed ?? 0);
  const databaseRows = staffCount + branchCount + fileCount + workflowCount;
  const moduleUsage = {
    staff: staffCount,
    branches: branchCount,
    files: fileCount,
    workflows: workflowCount,
    api: apiCalls,
    ai: aiTokensThisMonth,
    marketplace: marketplaceLicenses,
  };

  await prisma.tenantResourceUsage.upsert({
    where: { businessId },
    create: {
      businessId,
      activeUsers: staffCount,
      storageUsedBytes: BigInt(fileStorage._sum.sizeBytes ?? 0),
      apiCallsThisMonth: apiCalls,
      aiTokensThisMonth,
      databaseRows,
      marketplaceLicenses,
      fileCount,
      workflowCount,
      loginActivityCount,
      moduleUsage: moduleUsage as unknown as Prisma.InputJsonValue,
    },
    update: {
      activeUsers: staffCount,
      storageUsedBytes: BigInt(fileStorage._sum.sizeBytes ?? 0),
      apiCallsThisMonth: apiCalls,
      aiTokensThisMonth,
      databaseRows,
      marketplaceLicenses,
      fileCount,
      workflowCount,
      loginActivityCount,
      moduleUsage: moduleUsage as unknown as Prisma.InputJsonValue,
      lastCalculatedAt: new Date(),
    },
  });

  await prisma.tenantRecord.update({
    where: { businessId },
    data: { branchCount },
  });
}

export async function ensureTenantPlatformDefaults(businessId: string): Promise<void> {
  ensureBootstrapTenantPlatform();

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) {
    throw new Error("Business not found");
  }

  const branchCount = await prisma.branch.count({ where: { businessId } });

  await prisma.tenantRecord.upsert({
    where: { businessId },
    create: {
      businessId,
      subscriptionPlan: "starter",
      assignedFeatures: DEFAULT_TENANT_FEATURES as unknown as Prisma.InputJsonValue,
      branchCount,
    },
    update: { branchCount },
  });

  await prisma.tenantSettings.upsert({
    where: { businessId },
    create: {
      businessId,
      displayName: business.businessName,
    },
    update: {},
  });

  await prisma.tenantResourceLimit.upsert({
    where: { businessId },
    create: { businessId },
    update: {},
  });

  await prisma.tenantResourceUsage.upsert({
    where: { businessId },
    create: { businessId },
    update: {},
  });

  for (const definition of listTenantPolicyDefinitions()) {
    await syncPolicyToDatabase(businessId, definition);
  }

  await refreshTenantUsage(businessId);
}

export async function provisionTenantForBusiness(businessId: string): Promise<void> {
  await ensureTenantPlatformDefaults(businessId);
}

export async function createTenant(input: CreateTenantInput): Promise<{ businessId: string }> {
  const business = await prisma.business.create({
    data: {
      ownerId: input.ownerId,
      businessName: input.businessName,
      country: input.country,
      timezone: input.timezone ?? "UTC",
    },
  });

  await ensureTenantPlatformDefaults(business.id);

  await prisma.tenantRecord.update({
    where: { businessId: business.id },
    data: {
      lifecycleStatus: "PENDING",
      ...(input.subscriptionPlan ? { subscriptionPlan: input.subscriptionPlan } : {}),
    },
  });

  await logTenantAudit({
    businessId: business.id,
    eventType: "TENANT_CREATED",
    metadata: { businessName: input.businessName },
  });

  await recordTenantActivity({
    businessId: business.id,
    eventType: "TENANT_CREATED",
    title: "Tenant created",
    description: `Tenant ${input.businessName} was created`,
  });

  return { businessId: business.id };
}

export async function activateTenant(
  platform: BusinessContext,
): Promise<{ lifecycleStatus: string }> {
  assertPermission(platform, PERMISSION_CODES.TENANT_PLATFORM_MANAGE);

  const record = await prisma.tenantRecord.findUnique({
    where: { businessId: platform.business.id },
  });
  if (!record) {
    throw new Error("Tenant not found");
  }

  const nextStatus = resolveLifecycleTransition("activate", record.lifecycleStatus);
  if (!nextStatus) {
    throw new Error("Tenant cannot be activated");
  }

  await prisma.tenantRecord.update({
    where: { businessId: platform.business.id },
    data: { lifecycleStatus: nextStatus },
  });

  await logTenantAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "TENANT_ACTIVATED",
  });

  await recordTenantActivity({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "TENANT_ACTIVATED",
    title: "Tenant activated",
  });

  return { lifecycleStatus: nextStatus };
}

export async function suspendTenant(
  platform: BusinessContext,
): Promise<{ lifecycleStatus: string }> {
  assertPermission(platform, PERMISSION_CODES.TENANT_PLATFORM_MANAGE);

  const record = await prisma.tenantRecord.findUnique({
    where: { businessId: platform.business.id },
  });
  if (!record) {
    throw new Error("Tenant not found");
  }

  const nextStatus = resolveLifecycleTransition("suspend", record.lifecycleStatus);
  if (!nextStatus) {
    throw new Error("Tenant cannot be suspended");
  }

  await prisma.tenantRecord.update({
    where: { businessId: platform.business.id },
    data: { lifecycleStatus: nextStatus, suspendedAt: new Date() },
  });

  await logTenantAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "TENANT_SUSPENDED",
  });

  await recordTenantActivity({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "TENANT_SUSPENDED",
    title: "Tenant suspended",
  });

  return { lifecycleStatus: nextStatus };
}

export async function reactivateTenant(
  platform: BusinessContext,
): Promise<{ lifecycleStatus: string }> {
  assertPermission(platform, PERMISSION_CODES.TENANT_PLATFORM_MANAGE);

  const record = await prisma.tenantRecord.findUnique({
    where: { businessId: platform.business.id },
  });
  if (!record) {
    throw new Error("Tenant not found");
  }

  const nextStatus = resolveLifecycleTransition("reactivate", record.lifecycleStatus);
  if (!nextStatus) {
    throw new Error("Tenant cannot be reactivated");
  }

  await prisma.tenantRecord.update({
    where: { businessId: platform.business.id },
    data: { lifecycleStatus: nextStatus, suspendedAt: null },
  });

  await logTenantAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "TENANT_REACTIVATED",
  });

  await recordTenantActivity({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "TENANT_REACTIVATED",
    title: "Tenant reactivated",
  });

  return { lifecycleStatus: nextStatus };
}

export async function archiveTenant(
  platform: BusinessContext,
): Promise<{ lifecycleStatus: string }> {
  assertPermission(platform, PERMISSION_CODES.TENANT_PLATFORM_MANAGE);

  const record = await prisma.tenantRecord.findUnique({
    where: { businessId: platform.business.id },
  });
  if (!record) {
    throw new Error("Tenant not found");
  }

  const nextStatus = resolveLifecycleTransition("archive", record.lifecycleStatus);
  if (!nextStatus) {
    throw new Error("Tenant cannot be archived");
  }

  await prisma.tenantRecord.update({
    where: { businessId: platform.business.id },
    data: { lifecycleStatus: nextStatus, archivedAt: new Date() },
  });

  await logTenantAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "TENANT_ARCHIVED",
  });

  return { lifecycleStatus: nextStatus };
}

export async function deleteTenant(
  platform: BusinessContext,
): Promise<{ lifecycleStatus: string }> {
  assertPermission(platform, PERMISSION_CODES.TENANT_PLATFORM_ADMIN);

  const record = await prisma.tenantRecord.findUnique({
    where: { businessId: platform.business.id },
  });
  if (!record) {
    throw new Error("Tenant not found");
  }

  const nextStatus = resolveLifecycleTransition("delete", record.lifecycleStatus);
  if (!nextStatus) {
    throw new Error("Tenant cannot be deleted");
  }

  await prisma.tenantRecord.update({
    where: { businessId: platform.business.id },
    data: { lifecycleStatus: nextStatus, deletedAt: new Date() },
  });

  await logTenantAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "TENANT_DELETED",
  });

  return { lifecycleStatus: nextStatus };
}

export async function updateTenantProfile(
  platform: BusinessContext,
  input: TenantProfileInput,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.TENANT_PLATFORM_MANAGE);

  if (!assertTenantIsolation(platform.business.id, platform.business.id)) {
    throw new Error("Tenant isolation violation");
  }

  await prisma.business.update({
    where: { id: platform.business.id },
    data: {
      businessName: input.businessName,
      country: input.country,
      timezone: input.timezone,
    },
  });

  if (input.displayName || input.supportEmail || input.billingEmail) {
    await prisma.tenantSettings.update({
      where: { businessId: platform.business.id },
      data: {
        displayName: input.displayName,
        supportEmail: input.supportEmail,
        billingEmail: input.billingEmail,
      },
    });
  }

  await logTenantAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "PROFILE_UPDATED",
  });
}

export async function assignSubscription(
  platform: BusinessContext,
  input: SubscriptionAssignmentInput,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.TENANT_PLATFORM_MANAGE);

  await prisma.tenantRecord.update({
    where: { businessId: platform.business.id },
    data: {
      subscriptionPlan: input.subscriptionPlan,
      subscriptionStatus: input.subscriptionStatus ?? "ACTIVE",
    },
  });

  await logTenantAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "SUBSCRIPTION_ASSIGNED",
    metadata: { plan: input.subscriptionPlan },
  });
}

export async function assignFeatures(
  platform: BusinessContext,
  input: FeatureAssignmentInput,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.TENANT_PLATFORM_MANAGE);

  await prisma.tenantRecord.update({
    where: { businessId: platform.business.id },
    data: {
      assignedFeatures: input.features as unknown as Prisma.InputJsonValue,
    },
  });

  await logTenantAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "FEATURE_ASSIGNED",
    metadata: { features: input.features },
  });
}

export async function updateResourceLimits(
  platform: BusinessContext,
  input: ResourceLimitInput,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.TENANT_PLATFORM_MANAGE);

  await prisma.tenantResourceLimit.update({
    where: { businessId: platform.business.id },
    data: {
      maxUsers: input.maxUsers,
      maxBranches: input.maxBranches,
      maxStorageBytes:
        input.maxStorageBytes !== undefined ? BigInt(input.maxStorageBytes) : undefined,
      maxApiCallsPerMonth: input.maxApiCallsPerMonth,
      maxAiTokensPerMonth: input.maxAiTokensPerMonth,
      maxDatabaseRows: input.maxDatabaseRows,
      maxMarketplaceLicenses: input.maxMarketplaceLicenses,
    },
  });

  await logTenantAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "LIMIT_UPDATED",
    metadata: input as Record<string, unknown>,
  });
}

export async function updateTenantSettings(
  platform: BusinessContext,
  input: TenantSettingsInput,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.TENANT_PLATFORM_MANAGE);

  await prisma.tenantSettings.update({
    where: { businessId: platform.business.id },
    data: {
      displayName: input.displayName,
      supportEmail: input.supportEmail,
      billingEmail: input.billingEmail,
      defaultTimezone: input.defaultTimezone,
      defaultLocale: input.defaultLocale,
      complianceMode: input.complianceMode,
      customSettings: input.customSettings
        ? (input.customSettings as unknown as Prisma.InputJsonValue)
        : undefined,
    },
  });

  await logTenantAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "SETTINGS_UPDATED",
  });
}

export async function setMaintenanceMode(
  platform: BusinessContext,
  mode: TenantMaintenanceMode,
  scheduledAt?: Date | null,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.TENANT_PLATFORM_MANAGE);

  if (mode === "SCHEDULED" && !scheduledAt) {
    throw new Error("Scheduled maintenance requires a scheduledAt timestamp");
  }

  const record = await prisma.tenantRecord.findUnique({
    where: { businessId: platform.business.id },
  });
  if (!record) {
    throw new Error("Tenant not found");
  }

  await prisma.tenantRecord.update({
    where: { businessId: platform.business.id },
    data: {
      maintenanceMode: mode,
      scheduledMaintenanceAt: mode === "SCHEDULED" ? scheduledAt : null,
    },
  });

  const eventType =
    mode === "NONE"
      ? "MAINTENANCE_DISABLED"
      : record.maintenanceMode === "NONE"
        ? "MAINTENANCE_ENABLED"
        : "MAINTENANCE_UPDATED";

  await logTenantAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType,
    metadata: { mode, scheduledAt: scheduledAt?.toISOString() ?? null },
  });
}

export async function startImpersonation(
  platform: BusinessContext,
  input: ImpersonationInput,
): Promise<{ sessionId: string }> {
  assertPermission(platform, PERMISSION_CODES.TENANT_PLATFORM_ADMIN);

  const session = await prisma.tenantImpersonationSession.create({
    data: {
      businessId: platform.business.id,
      adminUserId: platform.user.id,
      targetUserId: input.targetUserId ?? null,
      reason: input.reason,
    },
  });

  await logTenantAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "IMPERSONATION_STARTED",
    metadata: { sessionId: session.id, targetUserId: input.targetUserId },
  });

  return { sessionId: session.id };
}

export async function endImpersonation(
  platform: BusinessContext,
  sessionId: string,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.TENANT_PLATFORM_ADMIN);

  await prisma.tenantImpersonationSession.update({
    where: { id: sessionId },
    data: { isActive: false, endedAt: new Date() },
  });

  await logTenantAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "IMPERSONATION_ENDED",
    metadata: { sessionId },
  });
}

export async function registerModuleTenantPolicy(
  businessId: string,
  definition: RegisteredTenantPolicyDefinition,
): Promise<void> {
  ensureBootstrapTenantPlatform();
  registerTenantPolicyDefinition(definition);
  await syncPolicyToDatabase(businessId, definition);

  await logTenantAudit({
    businessId,
    eventType: "POLICY_UPDATED",
    metadata: { policyKey: definition.policyKey },
  });
}

export async function runTenantHealthCheck(platform: BusinessContext) {
  assertPermission(platform, PERMISSION_CODES.TENANT_PLATFORM_VIEW);

  await refreshTenantUsage(platform.business.id);

  const [record, limits, usage] = await Promise.all([
    prisma.tenantRecord.findUnique({ where: { businessId: platform.business.id } }),
    prisma.tenantResourceLimit.findUnique({ where: { businessId: platform.business.id } }),
    prisma.tenantResourceUsage.findUnique({ where: { businessId: platform.business.id } }),
  ]);

  if (!record || !limits || !usage) {
    throw new Error("Tenant data not found");
  }

  const breaches = countUsageBreaches([
    { used: usage.activeUsers, limit: limits.maxUsers },
    { used: usage.apiCallsThisMonth, limit: limits.maxApiCallsPerMonth },
    { used: Number(usage.storageUsedBytes), limit: Number(limits.maxStorageBytes) },
  ]);

  const storagePct = limits.maxStorageBytes
    ? Math.round((Number(usage.storageUsedBytes) / Number(limits.maxStorageBytes)) * 100)
    : 0;
  const apiPct = limits.maxApiCallsPerMonth
    ? Math.round((usage.apiCallsThisMonth / limits.maxApiCallsPerMonth) * 100)
    : 0;

  const effectiveMaintenance = resolveEffectiveMaintenanceMode(
    record.maintenanceMode,
    record.scheduledMaintenanceAt,
  );

  const healthStatus = evaluateTenantHealth({
    lifecycleStatus: record.lifecycleStatus,
    maintenanceMode: effectiveMaintenance,
    usageBreaches: breaches,
  });

  await prisma.tenantRecord.update({
    where: { businessId: platform.business.id },
    data: { healthStatus },
  });

  const checks = buildHealthChecks({
    lifecycleStatus: record.lifecycleStatus,
    maintenanceMode: effectiveMaintenance,
    storageUsagePct: storagePct,
    apiUsagePct: apiPct,
  });

  await logTenantAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "HEALTH_CHECK",
    metadata: { healthStatus, breaches },
  });

  await recordStructuredLog(platform, {
    level: healthStatus === "HEALTHY" ? "INFO" : "WARNING",
    message: `Tenant health check: ${healthStatus}`,
    source: "tenant-platform",
    correlationId: record.id,
  });

  return {
    healthStatus,
    lifecycleStatus: record.lifecycleStatus,
    maintenanceMode: record.maintenanceMode,
    scheduledMaintenanceAt: record.scheduledMaintenanceAt?.toISOString() ?? null,
    checks,
  };
}

export async function getTenantAnalytics(platform: BusinessContext) {
  await refreshTenantUsage(platform.business.id);

  const [record, limits, usage] = await Promise.all([
    prisma.tenantRecord.findUnique({ where: { businessId: platform.business.id } }),
    prisma.tenantResourceLimit.findUnique({ where: { businessId: platform.business.id } }),
    prisma.tenantResourceUsage.findUnique({ where: { businessId: platform.business.id } }),
  ]);

  if (!record || !limits || !usage) {
    throw new Error("Tenant data not found");
  }

  const moduleUsage =
    usage.moduleUsage && typeof usage.moduleUsage === "object" && !Array.isArray(usage.moduleUsage)
      ? (usage.moduleUsage as Record<string, number>)
      : {};

  return buildTenantAnalytics({
    activeUsers: usage.activeUsers,
    maxUsers: limits.maxUsers,
    storageUsedBytes: usage.storageUsedBytes,
    maxStorageBytes: limits.maxStorageBytes,
    apiCallsThisMonth: usage.apiCallsThisMonth,
    maxApiCallsPerMonth: limits.maxApiCallsPerMonth,
    aiTokensThisMonth: usage.aiTokensThisMonth,
    maxAiTokensPerMonth: limits.maxAiTokensPerMonth,
    loginActivityCount: usage.loginActivityCount,
    fileCount: usage.fileCount,
    workflowCount: usage.workflowCount,
    moduleUsage,
    subscriptionStatus: record.subscriptionStatus,
    healthStatus: record.healthStatus,
  });
}

export async function logTenantDashboardAccess(
  platform: BusinessContext,
  dashboard: string,
): Promise<void> {
  await logTenantAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "DASHBOARD_ACCESS",
    metadata: { dashboard },
  });
}

export async function getTenantPlatformDashboard(
  businessId: string,
): Promise<TenantPlatformDashboardMetrics> {
  ensureBootstrapTenantPlatform();

  const [record, policies, impersonations, activities] = await Promise.all([
    prisma.tenantRecord.findUnique({ where: { businessId } }),
    prisma.tenantPolicy.findMany({ where: { businessId, isActive: true } }),
    prisma.tenantImpersonationSession.findMany({ where: { businessId, isActive: true } }),
    prisma.tenantActivityEvent.count({ where: { businessId } }),
  ]);

  if (!record) {
    throw new Error("Tenant not found");
  }

  const features = Array.isArray(record.assignedFeatures) ? record.assignedFeatures : [];

  return {
    lifecycleStatus: record.lifecycleStatus,
    healthStatus: record.healthStatus,
    maintenanceMode: record.maintenanceMode,
    scheduledMaintenanceAt: record.scheduledMaintenanceAt?.toISOString() ?? null,
    subscriptionPlan: record.subscriptionPlan,
    subscriptionStatus: record.subscriptionStatus,
    branchCount: record.branchCount,
    assignedFeatureCount: features.length,
    activePolicies: policies.length,
    activeImpersonations: impersonations.length,
    totalActivityEvents: activities,
  };
}

export async function getTenantRecord(businessId: string) {
  return prisma.tenantRecord.findUnique({ where: { businessId } });
}

export async function getTenantSettings(businessId: string) {
  return prisma.tenantSettings.findUnique({ where: { businessId } });
}

export async function getTenantResourceLimit(businessId: string) {
  return prisma.tenantResourceLimit.findUnique({ where: { businessId } });
}

export async function getTenantResourceUsage(businessId: string) {
  return prisma.tenantResourceUsage.findUnique({ where: { businessId } });
}

export async function listTenantPolicies(businessId: string) {
  return prisma.tenantPolicy.findMany({ where: { businessId }, orderBy: { module: "asc" } });
}

export async function listTenantActivityEvents(businessId: string) {
  return prisma.tenantActivityEvent.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listTenantImpersonationSessions(businessId: string) {
  return prisma.tenantImpersonationSession.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function listTenantPlatformAuditLogs(businessId: string) {
  return prisma.tenantPlatformAuditLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listRegisteredTenantPolicies() {
  ensureBootstrapTenantPlatform();
  return listTenantPolicyDefinitions();
}

export async function getTenantApiPayload(businessId: string) {
  const [record, settings, limits, usage] = await Promise.all([
    getTenantRecord(businessId),
    getTenantSettings(businessId),
    getTenantResourceLimit(businessId),
    getTenantResourceUsage(businessId),
  ]);

  return {
    tenant: record,
    settings,
    limits,
    usage,
    policies: listTenantPolicyDefinitions(),
  };
}

export { isLimitExceeded };

export async function refreshTenantResources(platform: BusinessContext): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.TENANT_PLATFORM_VIEW);
  await refreshTenantUsage(platform.business.id);

  await logTenantAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "RESOURCE_UPDATED",
  });
}
