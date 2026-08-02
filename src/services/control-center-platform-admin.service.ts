import "server-only";

import type { ConfigScope, Prisma, TenantMaintenanceMode } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import { PLATFORM_SERVICE_TARGETS } from "@/modules/control-center/monitoring/constants/control-center-monitoring";
import {
  CONTROL_CENTER_PLATFORM_ADMIN_PAGE_SIZE,
  PLATFORM_RELEASE_RECORD_TYPE,
  PLATFORM_SETTING_GROUPS,
} from "@/modules/control-center/platform-admin/constants/control-center-platform-admin";
import {
  buildOperatorPlatformContext,
  resolvePlatformBusinessId,
} from "@/modules/control-center/platform-admin/lib/build-operator-platform-context";
import { listPlatformAdminModules } from "@/modules/control-center/platform-admin/lib/platform-admin-registry";
import {
  formatStaffName,
  inferAuditCategory,
  parsePlatformReleaseMetadata,
  serializePlatformReleaseMetadata,
  serializeReleaseRecord,
} from "@/modules/control-center/platform-admin/lib/platform-admin-utils";
import type {
  ControlCenterEnvironmentItem,
  ControlCenterFeatureFlagDirectoryResult,
  ControlCenterFeatureFlagItem,
  ControlCenterFeatureFlagQuery,
  ControlCenterMaintenanceWindowItem,
  ControlCenterPlatformAdminManagementBundle,
  ControlCenterPlatformAdminPermissions,
  ControlCenterPlatformAdminWidgets,
  ControlCenterPlatformAnalytics,
  ControlCenterPlatformAuditDirectoryResult,
  ControlCenterPlatformAuditItem,
  ControlCenterPlatformAuditQuery,
  ControlCenterPlatformSettingItem,
  ControlCenterPlatformStaffItem,
  ControlCenterReleaseDirectoryResult,
  ControlCenterReleaseItem,
  ControlCenterReleaseQuery,
  CreateControlCenterFeatureFlagInput,
  CreateControlCenterReleaseInput,
  ScheduleControlCenterMaintenanceInput,
  UpdateControlCenterFeatureFlagInput,
  UpdateControlCenterPlatformSettingInput,
} from "@/modules/control-center/platform-admin/types/control-center-platform-admin-types";
import { getControlCenterOperatorEmails } from "@/modules/control-center/lib/resolve-control-center-authorization";
import type { ControlCenterOperatorContext } from "@/modules/control-center/types/control-center-types";
import { ensureBootstrapSettingsEngine } from "@/modules/settings-engine/plugins/bootstrap-settings";
import { listSettingDefinitions } from "@/modules/settings-engine/registry/settings-registry";
import { getPlanMrrPence } from "@/modules/control-center/billing/registry/subscription-plan-registry";
import { createFeatureFlag, updateFeatureFlag } from "@/services/feature-flags.service";
import { listIamIdentities, listIamSessions } from "@/services/iam.service";
import {
  getConfiguration,
  registerModuleSettingDefinition,
  setConfigurationValue,
} from "@/services/settings-engine.service";
import { setMaintenanceMode } from "@/services/tenant-platform.service";

let platformAdminSettingsRegistered = false;

async function ensurePlatformAdminSettings(): Promise<void> {
  if (platformAdminSettingsRegistered) {
    return;
  }

  ensureBootstrapSettingsEngine();

  const definitions = [
    {
      key: "platform.maintenance_mode",
      module: "platform",
      category: "platform",
      valueType: "ENUM" as const,
      defaultValue: "NONE",
      allowedValues: ["NONE", "READ_ONLY", "FULL_LOCK", "SCHEDULED"],
      helpText: "Platform-wide maintenance mode",
      supportedScopes: ["PLATFORM"] as ConfigScope[],
    },
    {
      key: "platform.maintenance_message",
      module: "platform",
      category: "platform",
      valueType: "STRING" as const,
      defaultValue: "",
      helpText: "Maintenance message shown to users",
      supportedScopes: ["PLATFORM"] as ConfigScope[],
    },
    {
      key: "platform.maintenance_scheduled_at",
      module: "platform",
      category: "platform",
      valueType: "STRING" as const,
      defaultValue: "",
      helpText: "Scheduled maintenance start time (ISO)",
      supportedScopes: ["PLATFORM"] as ConfigScope[],
    },
    {
      key: "platform.current_version",
      module: "platform",
      category: "platform",
      valueType: "STRING" as const,
      defaultValue: "1.0.0",
      helpText: "Current deployed platform version",
      supportedScopes: ["PLATFORM"] as ConfigScope[],
    },
  ];

  for (const definition of definitions) {
    await registerModuleSettingDefinition(definition);
  }

  platformAdminSettingsRegistered = true;
}

function buildPermissions(
  operator: ControlCenterOperatorContext,
): ControlCenterPlatformAdminPermissions {
  const permissions = new Set(operator.permissions);
  const hasAdmin = permissions.has(PERMISSION_CODES.CONTROL_CENTER_ADMIN);

  return {
    canViewSettings:
      hasAdmin || hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SETTINGS),
    canManageSettings:
      hasAdmin || hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SETTINGS),
    canViewFeatureFlags:
      hasAdmin || hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_FEATURE_FLAGS),
    canManageFeatureFlags:
      hasAdmin || hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_FEATURE_FLAGS),
    canViewReleases:
      hasAdmin || hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_RELEASES),
    canManageReleases:
      hasAdmin || hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_RELEASES),
    canViewMaintenance:
      hasAdmin || hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_MAINTENANCE),
    canManageMaintenance:
      hasAdmin || hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_MAINTENANCE),
    canViewStaff: hasAdmin || hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_STAFF),
    canManageStaff: hasAdmin || hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_STAFF),
    canViewAudit: hasAdmin || hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_AUDIT),
    canViewAnalytics:
      hasAdmin || hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_ANALYTICS),
  };
}

async function loadPlatformMaintenanceMode(): Promise<TenantMaintenanceMode | "NONE"> {
  await ensurePlatformAdminSettings();
  const value = await prisma.configSettingValue.findFirst({
    where: {
      definitionKey: "platform.maintenance_mode",
      scope: "PLATFORM",
      scopeIdentifier: "platform",
    },
    select: { value: true },
  });

  const mode = value?.value;
  if (typeof mode === "string" && ["NONE", "READ_ONLY", "FULL_LOCK", "SCHEDULED"].includes(mode)) {
    return mode as TenantMaintenanceMode;
  }

  return "NONE";
}

async function loadDashboardWidgets(): Promise<ControlCenterPlatformAdminWidgets> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    activeFeatureFlags,
    scheduledReleases,
    platformMaintenanceMode,
    activeTenants,
    activeUsers,
    tenantRecords,
    marketplaceRevenue,
    aiToolTokens,
    aiAgentTokens,
    automationTokens,
    apiRequests,
    marketplaceInstalls,
    healthyTenants,
  ] = await Promise.all([
    prisma.featureFlag.count({ where: { status: "ACTIVE" } }),
    prisma.backupRecord.count({
      where: {
        metadata: {
          path: ["rolloutStatus"],
          equals: "SCHEDULED",
        },
      },
    }),
    loadPlatformMaintenanceMode(),
    prisma.tenantRecord.count({ where: { lifecycleStatus: "ACTIVE" } }),
    prisma.user.count({ where: { updatedAt: { gte: thirtyDaysAgo } } }),
    prisma.tenantRecord.findMany({ select: { subscriptionPlan: true, healthStatus: true } }),
    prisma.marketplaceRevenueRecord.aggregate({ _sum: { amountCents: true } }),
    prisma.aiToolExecution.aggregate({ _sum: { tokensUsed: true } }),
    prisma.aiAgentExecution.aggregate({ _sum: { tokensUsed: true } }),
    prisma.automationWorkflowExecution.aggregate({ _sum: { aiCostTokens: true } }),
    prisma.monitoringPerformanceLog.count(),
    prisma.marketplaceInstallation.count({ where: { status: "INSTALLED" } }),
    prisma.tenantRecord.count({ where: { healthStatus: "HEALTHY" } }),
  ]);

  const mrrPence = tenantRecords.reduce(
    (sum, tenant) => sum + getPlanMrrPence(tenant.subscriptionPlan),
    0,
  );

  const aiTokensUsed =
    (aiToolTokens._sum.tokensUsed ?? 0) +
    (aiAgentTokens._sum.tokensUsed ?? 0) +
    (automationTokens._sum.aiCostTokens ?? 0);

  const totalTenants = tenantRecords.length;
  const systemHealthPct =
    totalTenants > 0 ? Math.round((healthyTenants / totalTenants) * 100) : 100;

  return {
    activeFeatureFlags,
    scheduledReleases,
    platformMaintenanceMode,
    activeTenants,
    activeUsers,
    platformRevenuePence: marketplaceRevenue._sum.amountCents ?? mrrPence,
    aiTokensUsed,
    apiRequests,
    marketplaceInstalls,
    systemHealthPct,
  };
}

async function loadPlatformSettings(
  operator: ControlCenterOperatorContext,
): Promise<ControlCenterPlatformSettingItem[]> {
  await ensurePlatformAdminSettings();
  const platform = await buildOperatorPlatformContext(operator);
  const keys = PLATFORM_SETTING_GROUPS.flatMap((group) => [...group.keys]);
  const definitions = listSettingDefinitions().filter((definition) =>
    (keys as string[]).includes(definition.key),
  );

  const stored = await prisma.configSettingValue.findMany({
    where: {
      definitionKey: { in: keys },
      scope: "PLATFORM",
      scopeIdentifier: "platform",
    },
  });

  const storedByKey = new Map(stored.map((entry) => [entry.definitionKey, entry]));

  const items: ControlCenterPlatformSettingItem[] = [];

  for (const definition of definitions) {
    const storedValue = storedByKey.get(definition.key);
    let resolvedValue = definition.defaultValue;

    if (storedValue) {
      resolvedValue = storedValue.value;
    } else {
      const resolved = await getConfiguration(platform, definition.key, {
        context: { businessId: platform.business.id },
        environment: "PRODUCTION",
      });
      if (resolved) {
        resolvedValue = resolved.value;
      }
    }

    items.push({
      key: definition.key,
      label: definition.key.split(".").slice(-1)[0]?.replace(/_/g, " ") ?? definition.key,
      category: definition.category,
      valueType: definition.valueType,
      scope: "PLATFORM",
      environment: "PRODUCTION",
      value: resolvedValue,
      defaultValue: definition.defaultValue,
      helpText: definition.helpText ?? null,
      allowedValues: definition.allowedValues ?? null,
      updatedAt: storedValue?.updatedAt.toISOString() ?? null,
    });
  }

  return items;
}

function serializeFeatureFlag(
  flag: Prisma.FeatureFlagGetPayload<{
    include: {
      business: { select: { businessName: true } };
      _count: { select: { targets: true } };
    };
  }>,
): ControlCenterFeatureFlagItem {
  return {
    id: flag.id,
    key: flag.key,
    name: flag.name,
    module: flag.module,
    flagType: flag.flagType,
    status: flag.status,
    defaultEnabled: flag.defaultEnabled,
    rolloutPercentage: flag.rolloutPercentage,
    businessId: flag.businessId,
    businessName: flag.business?.businessName ?? null,
    scheduledActivateAt: flag.scheduledActivateAt?.toISOString() ?? null,
    scheduledDeactivateAt: flag.scheduledDeactivateAt?.toISOString() ?? null,
    targetCount: flag._count.targets,
    updatedAt: flag.updatedAt.toISOString(),
  };
}

export async function queryControlCenterFeatureFlags(
  query: ControlCenterFeatureFlagQuery = {},
): Promise<ControlCenterFeatureFlagDirectoryResult> {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? CONTROL_CENTER_PLATFORM_ADMIN_PAGE_SIZE;
  const where: Prisma.FeatureFlagWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.search?.trim()) {
    where.OR = [
      { key: { contains: query.search.trim(), mode: "insensitive" } },
      { name: { contains: query.search.trim(), mode: "insensitive" } },
    ];
  }

  const [total, flags] = await Promise.all([
    prisma.featureFlag.count({ where }),
    prisma.featureFlag.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        business: { select: { businessName: true } },
        _count: { select: { targets: true } },
      },
    }),
  ]);

  return {
    items: flags.map(serializeFeatureFlag),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

export async function queryControlCenterReleases(
  query: ControlCenterReleaseQuery = {},
): Promise<ControlCenterReleaseDirectoryResult> {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? CONTROL_CENTER_PLATFORM_ADMIN_PAGE_SIZE;

  const records = await prisma.backupRecord.findMany({
    where: {
      metadata: {
        path: ["recordType"],
        equals: PLATFORM_RELEASE_RECORD_TYPE,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  let items = records
    .map(serializeReleaseRecord)
    .filter((entry): entry is ControlCenterReleaseItem => entry !== null);

  if (query.environment) {
    items = items.filter((entry) => entry.environment === query.environment);
  }

  if (query.status) {
    items = items.filter((entry) => entry.rolloutStatus === query.status);
  }

  if (query.search?.trim()) {
    const search = query.search.trim().toLowerCase();
    items = items.filter(
      (entry) =>
        entry.version.toLowerCase().includes(search) ||
        entry.releaseNotes.toLowerCase().includes(search),
    );
  }

  const total = items.length;
  const paged = items.slice((page - 1) * pageSize, page * pageSize);

  return {
    items: paged,
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

async function loadEnvironments(): Promise<ControlCenterEnvironmentItem[]> {
  const releases = await prisma.backupRecord.findMany({
    where: {
      metadata: {
        path: ["recordType"],
        equals: PLATFORM_RELEASE_RECORD_TYPE,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const healthChecks = await prisma.monitoringHealthCheck.findMany({
    orderBy: { lastCheckedAt: "desc" },
    take: 100,
  });

  const healthByKey = new Map<string, number>();
  for (const check of healthChecks) {
    if (!healthByKey.has(check.checkKey)) {
      healthByKey.set(
        check.checkKey,
        check.status === "HEALTHY" ? 1 : check.status === "DEGRADED" ? 0.6 : 0.3,
      );
    }
  }

  const platformHealth =
    PLATFORM_SERVICE_TARGETS.reduce(
      (sum, target) => sum + (healthByKey.get(target.checkKey) ?? 1),
      0,
    ) / Math.max(PLATFORM_SERVICE_TARGETS.length, 1);

  return ["development", "staging", "production"].map((environment) => {
    const environmentReleases = releases
      .map(serializeReleaseRecord)
      .filter(
        (entry): entry is ControlCenterReleaseItem =>
          entry !== null && entry.environment === environment,
      );

    const latest = environmentReleases[0];

    return {
      key: environment,
      label: environment.charAt(0).toUpperCase() + environment.slice(1),
      status: platformHealth >= 0.9 ? "healthy" : platformHealth >= 0.6 ? "degraded" : "down",
      version: latest?.version ?? "1.0.0",
      healthScore: Math.round(platformHealth * 100),
      lastDeploymentAt: latest?.deployedAt ?? latest?.createdAt ?? null,
      deploymentCount: environmentReleases.length,
    };
  });
}

async function loadMaintenanceWindows(): Promise<ControlCenterMaintenanceWindowItem[]> {
  const [platformMode, platformMessage, platformScheduled, tenantWindows] = await Promise.all([
    prisma.configSettingValue.findFirst({
      where: { definitionKey: "platform.maintenance_mode", scope: "PLATFORM" },
    }),
    prisma.configSettingValue.findFirst({
      where: { definitionKey: "platform.maintenance_message", scope: "PLATFORM" },
    }),
    prisma.configSettingValue.findFirst({
      where: { definitionKey: "platform.maintenance_scheduled_at", scope: "PLATFORM" },
    }),
    prisma.tenantRecord.findMany({
      where: {
        OR: [{ maintenanceMode: { not: "NONE" } }, { scheduledMaintenanceAt: { not: null } }],
      },
      include: { business: { select: { businessName: true } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  const windows: ControlCenterMaintenanceWindowItem[] = [];

  const mode = platformMode?.value;
  if (typeof mode === "string" && mode !== "NONE") {
    windows.push({
      id: platformMode?.id ?? "platform-maintenance",
      mode: mode as TenantMaintenanceMode,
      businessId: null,
      businessName: null,
      scheduledAt:
        typeof platformScheduled?.value === "string" && platformScheduled.value
          ? platformScheduled.value
          : null,
      scope: "platform",
      message: typeof platformMessage?.value === "string" ? platformMessage.value : null,
      createdAt: platformMode?.updatedAt.toISOString() ?? new Date().toISOString(),
    });
  }

  for (const tenant of tenantWindows) {
    windows.push({
      id: tenant.id,
      mode: tenant.maintenanceMode,
      businessId: tenant.businessId,
      businessName: tenant.business.businessName ?? "Unknown",
      scheduledAt: tenant.scheduledMaintenanceAt?.toISOString() ?? null,
      scope: "tenant",
      message: null,
      createdAt: tenant.updatedAt.toISOString(),
    });
  }

  return windows;
}

async function loadPlatformStaff(
  operator: ControlCenterOperatorContext,
): Promise<ControlCenterPlatformStaffItem[]> {
  const businessId = await buildOperatorPlatformContext(operator).then((ctx) => ctx.business.id);
  const operatorEmails = new Set(getControlCenterOperatorEmails());

  const [identities, sessions, staffRows, operatorUsers] = await Promise.all([
    listIamIdentities(businessId),
    listIamSessions(businessId),
    prisma.staff.findMany({
      where: { businessId, isActive: true },
      include: {
        staffRoles: { include: { role: { select: { name: true, slug: true } } } },
      },
      take: 50,
      orderBy: { updatedAt: "desc" },
    }),
    operatorEmails.size > 0
      ? prisma.user.findMany({
          where: { email: { in: Array.from(operatorEmails) } },
          take: 50,
        })
      : Promise.resolve([]),
  ]);

  const sessionsByUser = new Map<string, number>();
  for (const session of sessions) {
    if (session.revokedAt || !session.userId) continue;
    sessionsByUser.set(session.userId, (sessionsByUser.get(session.userId) ?? 0) + 1);
  }

  const staffItems: ControlCenterPlatformStaffItem[] = staffRows.map((member) => {
    const primaryRole = member.staffRoles[0]?.role;

    return {
      id: member.id,
      email: member.email ?? "—",
      fullName: formatStaffName(member.firstName, member.lastName),
      role: primaryRole?.name ?? member.jobTitle ?? "Staff",
      team: member.department ?? "Platform",
      accessLevel: primaryRole?.slug ?? member.accountStatus,
      mfaEnabled: false,
      activeSessions: member.userId ? (sessionsByUser.get(member.userId) ?? 0) : 0,
      lastSeenAt: member.lastLoginAt?.toISOString() ?? member.updatedAt.toISOString(),
      isOperator: member.email ? operatorEmails.has(member.email.toLowerCase()) : false,
    };
  });

  for (const identity of identities) {
    const identityEmail = identity.email ?? identity.name;
    if (staffItems.some((entry) => entry.email === identityEmail)) {
      continue;
    }

    staffItems.push({
      id: identity.id,
      email: identity.email ?? identity.name,
      fullName: identity.name,
      role: identity.identityType,
      team: "IAM",
      accessLevel: identity.status,
      mfaEnabled: false,
      activeSessions: identity.userId ? (sessionsByUser.get(identity.userId) ?? 0) : 0,
      lastSeenAt: identity.updatedAt.toISOString(),
      isOperator: identity.email ? operatorEmails.has(identity.email.toLowerCase()) : false,
    });
  }

  for (const user of operatorUsers) {
    if (staffItems.some((entry) => entry.email === user.email)) {
      continue;
    }

    staffItems.push({
      id: user.id,
      email: user.email,
      fullName: user.fullName ?? user.email,
      role: "Control Center Operator",
      team: "Governance",
      accessLevel: "operator",
      mfaEnabled: false,
      activeSessions: sessionsByUser.get(user.id) ?? 0,
      lastSeenAt: user.updatedAt.toISOString(),
      isOperator: true,
    });
  }

  if (staffItems.every((entry) => entry.email !== operator.email)) {
    staffItems.unshift({
      id: operator.userId,
      email: operator.email,
      fullName: operator.fullName,
      role: "Control Center Operator",
      team: "Governance",
      accessLevel: "operator",
      mfaEnabled: false,
      activeSessions: sessionsByUser.get(operator.userId) ?? 0,
      lastSeenAt: new Date().toISOString(),
      isOperator: true,
    });
  }

  return staffItems.slice(0, 50);
}

async function loadPlatformAudit(
  query: ControlCenterPlatformAuditQuery = {},
): Promise<ControlCenterPlatformAuditDirectoryResult> {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? CONTROL_CENTER_PLATFORM_ADMIN_PAGE_SIZE;
  const businessId = await resolvePlatformBusinessId();

  const [configLogs, flagLogs, iamLogs, tenantLogs] = await Promise.all([
    prisma.configAuditLog.findMany({
      where: { OR: [{ businessId }, { businessId: null }] },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.featureFlagAuditLog.findMany({
      where: { OR: [{ businessId }, { businessId: null }] },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.iamSecurityAuditLog.findMany({
      where: { OR: [{ businessId }, { businessId: null }] },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.tenantPlatformAuditLog.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const combined: ControlCenterPlatformAuditItem[] = [
    ...configLogs.map((entry) => ({
      id: entry.id,
      category: inferAuditCategory(entry.eventType),
      eventType: entry.eventType,
      summary: entry.definitionKey
        ? `Configuration ${entry.eventType}: ${entry.definitionKey}`
        : entry.eventType,
      actorEmail: entry.user?.email ?? null,
      createdAt: entry.createdAt.toISOString(),
      metadata: (entry.metadata as Record<string, unknown> | null) ?? null,
    })),
    ...flagLogs.map((entry) => ({
      id: entry.id,
      category: "feature_flag",
      eventType: entry.eventType,
      summary: entry.flagKey
        ? `Feature flag ${entry.eventType}: ${entry.flagKey}`
        : entry.eventType,
      actorEmail: entry.user?.email ?? null,
      createdAt: entry.createdAt.toISOString(),
      metadata: (entry.metadata as Record<string, unknown> | null) ?? null,
    })),
    ...iamLogs.map((entry) => ({
      id: entry.id,
      category: "security",
      eventType: entry.eventType,
      summary: entry.eventType,
      actorEmail: entry.user?.email ?? null,
      createdAt: entry.createdAt.toISOString(),
      metadata: (entry.metadata as Record<string, unknown> | null) ?? null,
    })),
    ...tenantLogs.map((entry) => ({
      id: entry.id,
      category: inferAuditCategory(entry.eventType),
      eventType: entry.eventType,
      summary: entry.eventType,
      actorEmail: entry.user?.email ?? null,
      createdAt: entry.createdAt.toISOString(),
      metadata: (entry.metadata as Record<string, unknown> | null) ?? null,
    })),
  ];

  let items = combined.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  if (query.category) {
    items = items.filter((entry) => entry.category === query.category);
  }

  if (query.search?.trim()) {
    const search = query.search.trim().toLowerCase();
    items = items.filter(
      (entry) =>
        entry.summary.toLowerCase().includes(search) ||
        entry.eventType.toLowerCase().includes(search) ||
        (entry.actorEmail?.toLowerCase().includes(search) ?? false),
    );
  }

  const total = items.length;
  const paged = items.slice((page - 1) * pageSize, page * pageSize);

  return {
    items: paged,
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

async function loadPlatformAnalytics(): Promise<ControlCenterPlatformAnalytics> {
  const days = 7;
  const tenantGrowth: Array<{ day: string; count: number }> = [];
  const revenueTrend: Array<{ day: string; amountPence: number }> = [];
  const aiUsageTrend: Array<{ day: string; tokens: number }> = [];
  const apiUsageTrend: Array<{ day: string; requests: number }> = [];
  const marketplaceGrowth: Array<{ day: string; installs: number }> = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - offset);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const day = dayStart.toISOString().slice(0, 10);

    const [tenants, revenue, aiTools, aiAgents, apiRequests, installs] = await Promise.all([
      prisma.tenantRecord.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
      prisma.marketplaceRevenueRecord.aggregate({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
        _sum: { amountCents: true },
      }),
      prisma.aiToolExecution.aggregate({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
        _sum: { tokensUsed: true },
      }),
      prisma.aiAgentExecution.aggregate({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
        _sum: { tokensUsed: true },
      }),
      prisma.monitoringPerformanceLog.count({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
      }),
      prisma.marketplaceInstallation.count({
        where: { installedAt: { gte: dayStart, lt: dayEnd } },
      }),
    ]);

    tenantGrowth.push({ day, count: tenants });
    revenueTrend.push({ day, amountPence: revenue._sum.amountCents ?? 0 });
    aiUsageTrend.push({
      day,
      tokens: (aiTools._sum.tokensUsed ?? 0) + (aiAgents._sum.tokensUsed ?? 0),
    });
    apiUsageTrend.push({ day, requests: apiRequests });
    marketplaceGrowth.push({ day, installs });
  }

  return {
    tenantGrowth,
    revenueTrend,
    aiUsageTrend,
    apiUsageTrend,
    marketplaceGrowth,
    slaPerformancePct: 98,
    agentPerformance: [],
  };
}

export async function getControlCenterPlatformAdminManagementBundle(
  operator: ControlCenterOperatorContext,
  featureFlagQuery: ControlCenterFeatureFlagQuery = {},
  releaseQuery: ControlCenterReleaseQuery = {},
  auditQuery: ControlCenterPlatformAuditQuery = {},
): Promise<ControlCenterPlatformAdminManagementBundle> {
  await ensurePlatformAdminSettings();

  const permissions = buildPermissions(operator);

  const [
    widgets,
    settings,
    featureFlags,
    releases,
    environments,
    maintenanceWindows,
    staff,
    audit,
    analytics,
  ] = await Promise.all([
    loadDashboardWidgets(),
    permissions.canViewSettings ? loadPlatformSettings(operator) : Promise.resolve([]),
    permissions.canViewFeatureFlags
      ? queryControlCenterFeatureFlags(featureFlagQuery)
      : Promise.resolve({
          items: [],
          total: 0,
          page: 1,
          pageSize: CONTROL_CENTER_PLATFORM_ADMIN_PAGE_SIZE,
          totalPages: 1,
        }),
    permissions.canViewReleases
      ? queryControlCenterReleases(releaseQuery)
      : Promise.resolve({
          items: [],
          total: 0,
          page: 1,
          pageSize: CONTROL_CENTER_PLATFORM_ADMIN_PAGE_SIZE,
          totalPages: 1,
        }),
    loadEnvironments(),
    permissions.canViewMaintenance ? loadMaintenanceWindows() : Promise.resolve([]),
    permissions.canViewStaff ? loadPlatformStaff(operator) : Promise.resolve([]),
    permissions.canViewAudit
      ? loadPlatformAudit(auditQuery)
      : Promise.resolve({
          items: [],
          total: 0,
          page: 1,
          pageSize: CONTROL_CENTER_PLATFORM_ADMIN_PAGE_SIZE,
          totalPages: 1,
        }),
    permissions.canViewAnalytics
      ? loadPlatformAnalytics()
      : Promise.resolve({
          tenantGrowth: [],
          revenueTrend: [],
          aiUsageTrend: [],
          apiUsageTrend: [],
          marketplaceGrowth: [],
          slaPerformancePct: 0,
          agentPerformance: [],
        }),
  ]);

  return {
    permissions,
    widgets,
    settings,
    featureFlags,
    releases,
    environments,
    modules: listPlatformAdminModules(),
    maintenanceWindows,
    staff,
    audit,
    analytics,
    refreshedAt: new Date().toISOString(),
  };
}

export async function runControlCenterUpdatePlatformSetting(
  operator: ControlCenterOperatorContext,
  input: UpdateControlCenterPlatformSettingInput,
): Promise<void> {
  if (!buildPermissions(operator).canManageSettings) {
    throw new Error("Permission denied");
  }

  await ensurePlatformAdminSettings();
  const platform = await buildOperatorPlatformContext(operator);

  await setConfigurationValue(platform, {
    key: input.key,
    value: input.value,
    scope: input.scope ?? "PLATFORM",
    environment: input.environment ?? "PRODUCTION",
    changeReason: input.changeReason ?? "Updated from Control Center",
  });
}

export async function runControlCenterCreateFeatureFlag(
  operator: ControlCenterOperatorContext,
  input: CreateControlCenterFeatureFlagInput,
): Promise<{ id: string }> {
  if (!buildPermissions(operator).canManageFeatureFlags) {
    throw new Error("Permission denied");
  }

  const platform = await buildOperatorPlatformContext(operator);

  return createFeatureFlag(platform, {
    key: input.key,
    name: input.name,
    module: input.module,
    flagType: input.flagType,
    defaultEnabled: input.defaultEnabled,
    rolloutPercentage: input.rolloutPercentage,
    description: input.description,
    scheduledActivateAt: input.scheduledActivateAt,
    scheduledDeactivateAt: input.scheduledDeactivateAt,
  });
}

export async function runControlCenterUpdateFeatureFlag(
  operator: ControlCenterOperatorContext,
  flagId: string,
  input: UpdateControlCenterFeatureFlagInput,
): Promise<void> {
  if (!buildPermissions(operator).canManageFeatureFlags) {
    throw new Error("Permission denied");
  }

  const flag = await prisma.featureFlag.findUnique({ where: { id: flagId } });
  if (!flag) {
    throw new Error("Feature flag not found");
  }

  const platform = await buildOperatorPlatformContext(operator, flag.businessId ?? undefined);

  await updateFeatureFlag(platform, flagId, input);
}

export async function runControlCenterCreateRelease(
  operator: ControlCenterOperatorContext,
  input: CreateControlCenterReleaseInput,
): Promise<{ id: string }> {
  if (!buildPermissions(operator).canManageReleases) {
    throw new Error("Permission denied");
  }

  const businessId = await resolvePlatformBusinessId();
  const now = new Date();
  const scheduled = input.scheduledAt && input.scheduledAt > now;

  const record = await prisma.backupRecord.create({
    data: {
      businessId,
      backupKey: `release-${input.version}-${input.environment}`,
      triggerType: "MANUAL",
      scope: "CONFIGURATION",
      status: scheduled ? "PENDING" : "COMPLETED",
      metadata: serializePlatformReleaseMetadata({
        version: input.version,
        releaseNotes: input.releaseNotes,
        environment: input.environment,
        rolloutStatus: scheduled ? "SCHEDULED" : "IN_PROGRESS",
        scheduledAt: input.scheduledAt?.toISOString() ?? null,
        deployedAt: scheduled ? null : now.toISOString(),
        createdBy: operator.fullName,
      }),
    },
  });

  if (!scheduled) {
    await ensurePlatformAdminSettings();
    const platform = await buildOperatorPlatformContext(operator);
    await setConfigurationValue(platform, {
      key: "platform.current_version",
      value: input.version,
      scope: "PLATFORM",
      environment: "PRODUCTION",
      changeReason: `Release ${input.version} deployed`,
    });
  }

  return { id: record.id };
}

export async function runControlCenterRollbackRelease(
  operator: ControlCenterOperatorContext,
  releaseId: string,
): Promise<void> {
  if (!buildPermissions(operator).canManageReleases) {
    throw new Error("Permission denied");
  }

  const record = await prisma.backupRecord.findUnique({ where: { id: releaseId } });
  if (!record) {
    throw new Error("Release not found");
  }

  const metadata = parsePlatformReleaseMetadata(record.metadata);
  if (!metadata) {
    throw new Error("Invalid release record");
  }

  await prisma.backupRecord.update({
    where: { id: releaseId },
    data: {
      status: "FAILED",
      metadata: serializePlatformReleaseMetadata({
        ...metadata,
        rolloutStatus: "ROLLED_BACK",
        deployedAt: new Date().toISOString(),
      }),
    },
  });
}

export async function runControlCenterScheduleMaintenance(
  operator: ControlCenterOperatorContext,
  input: ScheduleControlCenterMaintenanceInput,
): Promise<void> {
  if (!buildPermissions(operator).canManageMaintenance) {
    throw new Error("Permission denied");
  }

  await ensurePlatformAdminSettings();
  const platform = await buildOperatorPlatformContext(operator);

  if (input.scope === "tenant" && input.businessId) {
    const tenantPlatform = await buildOperatorPlatformContext(operator, input.businessId);
    await setMaintenanceMode(tenantPlatform, input.mode, input.scheduledAt ?? null);
    return;
  }

  await setConfigurationValue(platform, {
    key: "platform.maintenance_mode",
    value: input.mode,
    scope: "PLATFORM",
    environment: "PRODUCTION",
    changeReason: "Maintenance scheduled from Control Center",
  });

  if (input.message !== undefined) {
    await setConfigurationValue(platform, {
      key: "platform.maintenance_message",
      value: input.message,
      scope: "PLATFORM",
      environment: "PRODUCTION",
    });
  }

  if (input.scheduledAt !== undefined) {
    await setConfigurationValue(platform, {
      key: "platform.maintenance_scheduled_at",
      value: input.scheduledAt?.toISOString() ?? "",
      scope: "PLATFORM",
      environment: "PRODUCTION",
    });
  }
}

export async function runControlCenterEmergencyMaintenance(
  operator: ControlCenterOperatorContext,
  message?: string,
): Promise<void> {
  await runControlCenterScheduleMaintenance(operator, {
    mode: "FULL_LOCK",
    message: message ?? "Emergency maintenance in progress",
    scope: "platform",
  });
}

export async function runControlCenterClearMaintenance(
  operator: ControlCenterOperatorContext,
): Promise<void> {
  await runControlCenterScheduleMaintenance(operator, {
    mode: "NONE",
    message: "",
    scheduledAt: null,
    scope: "platform",
  });
}
