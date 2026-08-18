import "server-only";

import type { Prisma, TenantLifecycleStatus } from "@prisma/client";
import type { BusinessType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import { buildOperatorTenantPlatformContext } from "@/modules/control-center/tenants/lib/build-operator-tenant-context";
import { CONTROL_CENTER_TENANT_PAGE_SIZE } from "@/modules/control-center/tenants/constants/control-center-tenants";
import type {
  ControlCenterTenantDetailBundle,
  ControlCenterTenantDirectoryQuery,
  ControlCenterTenantDirectoryResult,
  ControlCenterTenantManagementBundle,
  ControlCenterTenantPermissions,
  CreateControlCenterTenantInput,
} from "@/modules/control-center/tenants/types/control-center-tenants-types";
import type { ControlCenterOperatorContext } from "@/modules/control-center/types/control-center-types";
import { getPlatformConsumptionConfig } from "@/modules/platform/services/platform-config.service";
import type { ControlCenterPlatformSummary } from "@/modules/platform/types/control-center-platform.types";
import {
  serializeResourceLimit,
  serializeResourceUsage,
  serializeTenantActivity,
  serializeTenantAuditLog,
  serializeTenantPolicy,
  serializeTenantRecord,
  serializeTenantSettings,
} from "@/modules/tenant-platform/utils/tenant-platform-utils";
import {
  activateTenant,
  archiveTenant,
  createTenant,
  deleteTenant,
  ensureTenantPlatformDefaults,
  getTenantAnalytics,
  getTenantRecord,
  getTenantResourceLimit,
  getTenantResourceUsage,
  getTenantSettings,
  listTenantActivityEvents,
  listTenantPlatformAuditLogs,
  listTenantPolicies,
  reactivateTenant,
  refreshTenantResources,
  runTenantHealthCheck,
  setMaintenanceMode,
  suspendTenant,
  updateResourceLimits,
} from "@/services/tenant-platform.service";

function buildPermissions(operator: ControlCenterOperatorContext): ControlCenterTenantPermissions {
  const permissions = new Set(operator.permissions);
  const hasAdmin = permissions.has(PERMISSION_CODES.CONTROL_CENTER_ADMIN);

  return {
    canView:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_TENANTS) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_VIEW),
    canEdit:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_TENANTS_EDIT) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_TENANTS),
    canSuspend:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_TENANTS_SUSPEND) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_TENANTS),
    canDelete:
      hasAdmin || hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_TENANTS_DELETE),
    canManagePolicies:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_TENANTS_POLICIES) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_TENANTS),
    canManageResources:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_TENANTS_RESOURCES) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_TENANTS),
    canMaintenance:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_TENANTS_MAINTENANCE) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_MAINTENANCE),
    canViewAnalytics:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_TENANTS_ANALYTICS) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_ANALYTICS) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_TENANTS),
  };
}

function buildDirectoryWhere(
  query: ControlCenterTenantDirectoryQuery,
): Prisma.TenantRecordWhereInput {
  const where: Prisma.TenantRecordWhereInput = {};

  if (query.lifecycleStatus) {
    where.lifecycleStatus = query.lifecycleStatus;
  }

  if (query.healthStatus) {
    where.healthStatus = query.healthStatus;
  }

  if (query.subscriptionPlan) {
    where.subscriptionPlan = { equals: query.subscriptionPlan, mode: "insensitive" };
  }

  if (query.search?.trim()) {
    const search = query.search.trim();
    where.business = {
      OR: [
        { businessName: { contains: search, mode: "insensitive" } },
        { ownerName: { contains: search, mode: "insensitive" } },
        { owner: { email: { contains: search, mode: "insensitive" } } },
      ],
    };
  }

  if (query.country?.trim()) {
    where.business = {
      ...(where.business as Prisma.BusinessWhereInput | undefined),
      country: { equals: query.country.trim(), mode: "insensitive" },
    };
  }

  if (query.businessType?.trim()) {
    where.business = {
      ...(where.business as Prisma.BusinessWhereInput | undefined),
      businessType: query.businessType.trim() as BusinessType,
    };
  }

  return where;
}

function buildDirectoryOrderBy(
  query: ControlCenterTenantDirectoryQuery,
): Prisma.TenantRecordOrderByWithRelationInput {
  const direction = query.sortDirection ?? "desc";

  switch (query.sortBy) {
    case "businessName":
      return { business: { businessName: direction } };
    case "lifecycleStatus":
      return { lifecycleStatus: direction };
    case "lastActivity":
      return { updatedAt: direction };
    case "createdAt":
    default:
      return { createdAt: direction };
  }
}

export async function queryControlCenterTenantDirectory(
  query: ControlCenterTenantDirectoryQuery = {},
): Promise<ControlCenterTenantDirectoryResult> {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? CONTROL_CENTER_TENANT_PAGE_SIZE;
  const where = buildDirectoryWhere(query);
  const orderBy = buildDirectoryOrderBy(query);

  const [records, total] = await Promise.all([
    prisma.tenantRecord.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        business: {
          include: {
            owner: { select: { id: true, email: true, fullName: true } },
          },
        },
      },
    }),
    prisma.tenantRecord.count({ where }),
  ]);

  const businessIds = records.map((record) => record.businessId);
  const [usageRows, activityRows] = await Promise.all([
    prisma.tenantResourceUsage.findMany({
      where: { businessId: { in: businessIds } },
      select: { businessId: true, activeUsers: true, lastCalculatedAt: true },
    }),
    prisma.tenantActivityEvent.groupBy({
      by: ["businessId"],
      where: { businessId: { in: businessIds } },
      _max: { createdAt: true },
    }),
  ]);

  const usageMap = new Map(usageRows.map((row) => [row.businessId, row]));
  const activityMap = new Map(activityRows.map((row) => [row.businessId, row._max.createdAt]));

  return {
    items: records.map((record) => {
      const usage = usageMap.get(record.businessId);
      const lastActivity = activityMap.get(record.businessId) ?? record.updatedAt;

      return {
        id: record.id,
        businessId: record.businessId,
        tenantId: record.id,
        businessName: record.business.businessName ?? "Untitled business",
        ownerName: record.business.ownerName ?? record.business.owner.fullName,
        ownerEmail: record.business.owner.email,
        lifecycleStatus: record.lifecycleStatus,
        healthStatus: record.healthStatus,
        subscriptionPlan: record.subscriptionPlan,
        subscriptionStatus: record.subscriptionStatus,
        country: record.business.country,
        businessType: record.business.businessType,
        timezone: record.business.timezone,
        branchCount: record.branchCount,
        userCount: usage?.activeUsers ?? 0,
        createdAt: record.createdAt.toISOString(),
        lastActivityAt: lastActivity?.toISOString() ?? null,
      };
    }),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

export async function getControlCenterTenantManagementBundle(
  operator: ControlCenterOperatorContext,
  query: ControlCenterTenantDirectoryQuery = {},
): Promise<ControlCenterTenantManagementBundle> {
  const permissions = buildPermissions(operator);

  if (!permissions.canView) {
    throw new Error("Permission denied");
  }

  const directory = await queryControlCenterTenantDirectory(query);

  return { directory, permissions };
}

export async function getControlCenterTenantDetailBundle(
  operator: ControlCenterOperatorContext,
  businessId: string,
): Promise<ControlCenterTenantDetailBundle> {
  const permissions = buildPermissions(operator);

  if (!permissions.canView) {
    throw new Error("Permission denied");
  }

  await ensureTenantPlatformDefaults(businessId);

  const platform = await buildOperatorTenantPlatformContext(operator, businessId);

  const [
    business,
    tenant,
    settings,
    limits,
    usage,
    policies,
    branches,
    activities,
    auditLogs,
    activeSessions,
    health,
    analytics,
    platformConfig,
    apiKeyCount,
    webhookCount,
  ] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      include: { owner: { select: { id: true, email: true, fullName: true } } },
    }),
    getTenantRecord(businessId),
    getTenantSettings(businessId),
    getTenantResourceLimit(businessId),
    getTenantResourceUsage(businessId),
    listTenantPolicies(businessId),
    prisma.branch.findMany({
      where: { businessId },
      orderBy: [{ isMain: "desc" }, { name: "asc" }],
      include: {
        _count: { select: { staff: true } },
        staff: {
          where: {
            OR: [
              { jobTitle: { contains: "manager", mode: "insensitive" } },
              { jobTitle: { contains: "lead", mode: "insensitive" } },
            ],
          },
          select: { id: true },
        },
      },
    }),
    listTenantActivityEvents(businessId),
    listTenantPlatformAuditLogs(businessId),
    prisma.iamSession.count({ where: { businessId, isActive: true } }),
    permissions.canViewAnalytics ? runTenantHealthCheck(platform) : Promise.resolve(null),
    permissions.canViewAnalytics ? getTenantAnalytics(platform) : Promise.resolve(null),
    getPlatformConsumptionConfig(businessId),
    prisma.platformApiKey.count({ where: { businessId, status: "ACTIVE" } }),
    prisma.platformApiWebhookSubscription.count({ where: { businessId, status: "ACTIVE" } }),
  ]);

  if (!business || !tenant) {
    throw new Error("Tenant not found");
  }

  const platformSummary: ControlCenterPlatformSummary = {
    deploymentMode: platformConfig.deploymentMode,
    whiteLabelEnabled: platformConfig.whiteLabelEnabled,
    platformStatus: platformConfig.platformStatus,
    subdomain: platformConfig.domains.subdomain,
    customDomain: platformConfig.domains.customDomain,
    customDomainVerified: platformConfig.domains.customDomainVerificationStatus === "verified",
    apiEnabled: platformConfig.api.enabled,
    webhooksEnabled: platformConfig.webhooks.enabled,
    embedEnabled: platformConfig.embed.enabled,
    apiKeyCount,
    webhookCount,
  };

  return {
    permissions,
    profile: {
      businessId: business.id,
      tenantId: tenant.id,
      businessName: business.businessName,
      businessType: business.businessType,
      country: business.country,
      timezone: business.timezone,
      onboardingCompleted: business.onboardingCompleted,
      createdAt: business.createdAt.toISOString(),
      owner: {
        id: business.owner.id,
        fullName: business.owner.fullName,
        email: business.owner.email,
      },
      tenant: serializeTenantRecord(tenant),
      settings: settings ? serializeTenantSettings(settings) : null,
      limits: limits ? serializeResourceLimit(limits) : null,
      usage: usage ? serializeResourceUsage(usage) : null,
      policies: policies.map(serializeTenantPolicy),
      branches: branches.map((branch) => ({
        id: branch.id,
        name: branch.name,
        city: branch.city,
        country: branch.country,
        isMain: branch.isMain,
        isActive: branch.isActive,
        staffCount: branch._count.staff,
        managerCount: branch.staff.length,
      })),
      analytics,
      health,
      activities: activities.map(serializeTenantActivity),
      auditLogs: auditLogs.map(serializeTenantAuditLog),
      activeSessions,
      maintenanceMode: tenant.maintenanceMode,
      scheduledMaintenanceAt: tenant.scheduledMaintenanceAt?.toISOString() ?? null,
      platform: platformSummary,
    },
  };
}

export async function createControlCenterTenant(
  operator: ControlCenterOperatorContext,
  input: CreateControlCenterTenantInput,
) {
  const permissions = buildPermissions(operator);

  if (!permissions.canEdit) {
    throw new Error("Permission denied");
  }

  return createTenant(input);
}

export async function runControlCenterTenantLifecycleAction(
  operator: ControlCenterOperatorContext,
  businessId: string,
  action: "activate" | "suspend" | "reactivate" | "archive" | "delete",
) {
  const permissions = buildPermissions(operator);
  const platform = await buildOperatorTenantPlatformContext(operator, businessId);

  switch (action) {
    case "activate":
      if (!permissions.canEdit) throw new Error("Permission denied");
      return activateTenant(platform);
    case "suspend":
      if (!permissions.canSuspend) throw new Error("Permission denied");
      return suspendTenant(platform);
    case "reactivate":
      if (!permissions.canSuspend) throw new Error("Permission denied");
      return reactivateTenant(platform);
    case "archive":
      if (!permissions.canEdit) throw new Error("Permission denied");
      return archiveTenant(platform);
    case "delete":
      if (!permissions.canDelete) throw new Error("Permission denied");
      return deleteTenant(platform);
    default:
      throw new Error("Unsupported lifecycle action");
  }
}

export async function runControlCenterTenantMaintenanceAction(
  operator: ControlCenterOperatorContext,
  businessId: string,
  mode: Parameters<typeof setMaintenanceMode>[1],
  scheduledAt?: Date | null,
) {
  const permissions = buildPermissions(operator);

  if (!permissions.canMaintenance) {
    throw new Error("Permission denied");
  }

  const platform = await buildOperatorTenantPlatformContext(operator, businessId);
  await setMaintenanceMode(platform, mode, scheduledAt);
}

export async function runControlCenterTenantResourceRefresh(
  operator: ControlCenterOperatorContext,
  businessId: string,
) {
  const permissions = buildPermissions(operator);

  if (!permissions.canManageResources) {
    throw new Error("Permission denied");
  }

  const platform = await buildOperatorTenantPlatformContext(operator, businessId);
  await refreshTenantResources(platform);
}

export async function runControlCenterTenantResourceLimitsUpdate(
  operator: ControlCenterOperatorContext,
  businessId: string,
  input: Parameters<typeof updateResourceLimits>[1],
) {
  const permissions = buildPermissions(operator);

  if (!permissions.canManageResources) {
    throw new Error("Permission denied");
  }

  const platform = await buildOperatorTenantPlatformContext(operator, businessId);
  await updateResourceLimits(platform, input);
}

export async function listControlCenterTenantLifecycleStatuses(): Promise<TenantLifecycleStatus[]> {
  const rows = await prisma.tenantRecord.groupBy({
    by: ["lifecycleStatus"],
  });

  return rows.map((row) => row.lifecycleStatus);
}
