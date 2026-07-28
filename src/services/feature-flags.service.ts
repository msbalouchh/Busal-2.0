import "server-only";

import type { FeatureFlagAuditEventType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  evaluatePermission,
  toPermissionEvaluationContext,
} from "@/modules/iam/engine/permission-engine";
import { evaluateFeatureFlag } from "@/modules/feature-flags/engine/evaluation-engine";
import { normalizeRolloutPercentage } from "@/modules/feature-flags/engine/rollout-engine";
import {
  buildNextFlagVersion,
  canRollbackFlag,
  serializeFlagConfig,
} from "@/modules/feature-flags/engine/version-engine";
import { ensureBootstrapFeatureFlags } from "@/modules/feature-flags/plugins/bootstrap-feature-flags";
import {
  getFeatureDefinition,
  listFeatureDefinitions,
  registerFeatureDefinition,
} from "@/modules/feature-flags/registry/feature-registry";
import type {
  CreateFeatureFlagInput,
  FeatureConditionRule,
  FeatureEvaluationContext,
  FeatureEvaluationResult,
  FeatureFlagRecord,
  FeatureFlagsDashboardMetrics,
  RegisteredFeatureDefinition,
  UpdateFeatureFlagInput,
} from "@/modules/feature-flags/types/feature-flags-types";

function assertPermission(platform: BusinessContext, permission: string): void {
  const context = toPermissionEvaluationContext({
    permissions: platform.permissions,
    roleSlug: platform.roleSlug,
    isOwner: platform.isOwner,
    businessId: platform.business.id,
    branchId: platform.branchId,
  });

  if (!evaluatePermission(context, permission)) {
    throw new Error(`Permission denied: ${permission} required`);
  }
}

function buildEvaluationContext(platform: BusinessContext): FeatureEvaluationContext {
  return {
    businessId: platform.business.id,
    branchId: platform.branchId,
    roleSlug: platform.roleSlug,
    userId: platform.user.id,
    country: platform.business.country ?? null,
    environment: process.env.NODE_ENV ?? "production",
    businessAttributes: {
      businessType: platform.business.businessType,
      onboardingCompleted: platform.business.onboardingCompleted,
    },
    userAttributes: {
      email: platform.user.email,
      role: platform.roleSlug,
    },
  };
}

async function logFeatureFlagAudit(input: {
  businessId?: string | null;
  userId?: string | null;
  flagId?: string | null;
  flagKey?: string | null;
  eventType: FeatureFlagAuditEventType;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.featureFlagAuditLog.create({
    data: {
      businessId: input.businessId ?? null,
      userId: input.userId ?? null,
      flagId: input.flagId ?? null,
      flagKey: input.flagKey ?? null,
      eventType: input.eventType,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

function mapFlagRecord(flag: {
  id: string;
  key: string;
  name: string;
  module: string;
  flagType: FeatureFlagRecord["flagType"];
  status: FeatureFlagRecord["status"];
  defaultEnabled: boolean;
  rolloutPercentage: number;
  scheduledActivateAt: Date | null;
  scheduledDeactivateAt: Date | null;
  conditions: unknown;
  metadata: unknown;
}): FeatureFlagRecord {
  return {
    id: flag.id,
    key: flag.key,
    name: flag.name,
    module: flag.module,
    flagType: flag.flagType,
    status: flag.status,
    defaultEnabled: flag.defaultEnabled,
    rolloutPercentage: flag.rolloutPercentage,
    scheduledActivateAt: flag.scheduledActivateAt,
    scheduledDeactivateAt: flag.scheduledDeactivateAt,
    conditions: (flag.conditions as FeatureConditionRule[]) ?? [],
    metadata: (flag.metadata as Record<string, unknown> | null) ?? null,
  };
}

async function syncTargets(
  flagId: string,
  businessId: string,
  targets: CreateFeatureFlagInput["targets"],
): Promise<void> {
  if (!targets?.length) {
    return;
  }

  await prisma.featureFlagTarget.deleteMany({ where: { flagId } });

  for (const target of targets) {
    await prisma.featureFlagTarget.create({
      data: {
        flagId,
        businessId,
        targetType: target.targetType,
        targetValue: target.targetValue,
        isIncluded: target.isIncluded ?? true,
        priority: target.priority ?? 0,
      },
    });
  }
}

async function saveFlagVersion(input: {
  flagId: string;
  businessId: string;
  userId: string;
  version: number;
  previousConfig: Record<string, unknown>;
  changeReason?: string | null;
}): Promise<void> {
  await prisma.featureFlagVersion.create({
    data: {
      flagId: input.flagId,
      businessId: input.businessId,
      version: input.version,
      previousConfig: input.previousConfig as Prisma.InputJsonValue,
      changedById: input.userId,
      changeReason: input.changeReason ?? null,
    },
  });
}

export async function ensureFeatureFlagsDefaults(businessId: string): Promise<void> {
  ensureBootstrapFeatureFlags();

  for (const definition of listFeatureDefinitions()) {
    const existing = await prisma.featureFlag.findFirst({
      where: { businessId, key: definition.key },
    });

    if (existing) {
      continue;
    }

    await prisma.featureFlag.create({
      data: {
        businessId,
        key: definition.key,
        name: definition.name,
        description: definition.description ?? "",
        module: definition.module,
        flagType: definition.flagType,
        status: definition.defaultEnabled ? "ACTIVE" : "DRAFT",
        defaultEnabled: definition.defaultEnabled,
      },
    });
  }
}

export async function registerModuleFeatureDefinition(
  definition: RegisteredFeatureDefinition,
): Promise<void> {
  ensureBootstrapFeatureFlags();
  registerFeatureDefinition(definition);
}

export async function createFeatureFlag(
  platform: BusinessContext,
  input: CreateFeatureFlagInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.FEATURE_FLAGS_MANAGE);

  const flag = await prisma.featureFlag.create({
    data: {
      businessId: platform.business.id,
      key: input.key,
      name: input.name,
      description: input.description ?? "",
      module: input.module,
      flagType: input.flagType,
      status: "DRAFT",
      defaultEnabled: input.defaultEnabled ?? false,
      rolloutPercentage: normalizeRolloutPercentage(input.rolloutPercentage ?? 0),
      scheduledActivateAt: input.scheduledActivateAt ?? null,
      scheduledDeactivateAt: input.scheduledDeactivateAt ?? null,
      conditions: (input.conditions ?? []) as unknown as Prisma.InputJsonValue,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
      changedById: platform.user.id,
      changeReason: input.changeReason ?? null,
    },
  });

  await syncTargets(flag.id, platform.business.id, input.targets);

  await logFeatureFlagAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    flagId: flag.id,
    flagKey: flag.key,
    eventType: "CREATED",
  });

  return { id: flag.id };
}

export async function updateFeatureFlag(
  platform: BusinessContext,
  flagId: string,
  input: UpdateFeatureFlagInput,
): Promise<{ id: string; version: number }> {
  assertPermission(platform, PERMISSION_CODES.FEATURE_FLAGS_MANAGE);

  const existing = await prisma.featureFlag.findFirst({
    where: { id: flagId, businessId: platform.business.id },
  });

  if (!existing) {
    throw new Error("Feature flag not found");
  }

  await saveFlagVersion({
    flagId: existing.id,
    businessId: platform.business.id,
    userId: platform.user.id,
    version: existing.currentVersion,
    previousConfig: serializeFlagConfig(existing),
    changeReason: input.changeReason,
  });

  const nextVersion = buildNextFlagVersion(existing.currentVersion);
  const updated = await prisma.featureFlag.update({
    where: { id: flagId },
    data: {
      name: input.name ?? existing.name,
      description: input.description ?? existing.description,
      flagType: input.flagType ?? existing.flagType,
      status: input.status ?? existing.status,
      defaultEnabled: input.defaultEnabled ?? existing.defaultEnabled,
      rolloutPercentage:
        input.rolloutPercentage !== undefined
          ? normalizeRolloutPercentage(input.rolloutPercentage)
          : existing.rolloutPercentage,
      scheduledActivateAt:
        input.scheduledActivateAt !== undefined
          ? input.scheduledActivateAt
          : existing.scheduledActivateAt,
      scheduledDeactivateAt:
        input.scheduledDeactivateAt !== undefined
          ? input.scheduledDeactivateAt
          : existing.scheduledDeactivateAt,
      conditions: input.conditions
        ? (input.conditions as unknown as Prisma.InputJsonValue)
        : (existing.conditions as Prisma.InputJsonValue),
      metadata: input.metadata
        ? (input.metadata as Prisma.InputJsonValue)
        : (existing.metadata as Prisma.InputJsonValue | undefined),
      currentVersion: nextVersion,
      changedById: platform.user.id,
      changeReason: input.changeReason ?? null,
    },
  });

  if (input.targets) {
    await syncTargets(flagId, platform.business.id, input.targets);
  }

  const eventType =
    input.status === "ACTIVE" || input.defaultEnabled === true ? "ENABLED" : "UPDATED";

  await logFeatureFlagAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    flagId: updated.id,
    flagKey: updated.key,
    eventType,
    metadata: { version: nextVersion },
  });

  return { id: updated.id, version: updated.currentVersion };
}

export async function cloneFeatureFlag(
  platform: BusinessContext,
  flagId: string,
  newKey: string,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.FEATURE_FLAGS_MANAGE);

  const existing = await prisma.featureFlag.findFirst({
    where: { id: flagId, businessId: platform.business.id },
    include: { targets: true },
  });

  if (!existing) {
    throw new Error("Feature flag not found");
  }

  const cloned = await createFeatureFlag(platform, {
    key: newKey,
    name: `${existing.name} (Clone)`,
    description: existing.description,
    module: existing.module,
    flagType: existing.flagType,
    defaultEnabled: existing.defaultEnabled,
    rolloutPercentage: existing.rolloutPercentage,
    scheduledActivateAt: existing.scheduledActivateAt,
    scheduledDeactivateAt: existing.scheduledDeactivateAt,
    conditions: existing.conditions as unknown as CreateFeatureFlagInput["conditions"],
    metadata: existing.metadata as Record<string, unknown> | undefined,
    targets: existing.targets.map((target) => ({
      targetType: target.targetType,
      targetValue: target.targetValue,
      isIncluded: target.isIncluded,
      priority: target.priority,
    })),
    changeReason: `Cloned from ${existing.key}`,
  });

  await logFeatureFlagAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    flagId: cloned.id,
    flagKey: newKey,
    eventType: "CLONED",
    metadata: { sourceFlagId: flagId },
  });

  return cloned;
}

export async function archiveFeatureFlag(platform: BusinessContext, flagId: string): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.FEATURE_FLAGS_MANAGE);
  await updateFeatureFlag(platform, flagId, {
    status: "ARCHIVED",
    changeReason: "Archived by administrator",
  });

  await logFeatureFlagAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    flagId,
    eventType: "ARCHIVED",
  });
}

export async function scheduleFeatureRollout(
  platform: BusinessContext,
  flagId: string,
  activateAt: Date,
  deactivateAt?: Date | null,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.FEATURE_FLAGS_MANAGE);

  const result = await updateFeatureFlag(platform, flagId, {
    status: "SCHEDULED",
    scheduledActivateAt: activateAt,
    scheduledDeactivateAt: deactivateAt ?? null,
    changeReason: "Scheduled rollout",
  });

  await logFeatureFlagAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    flagId,
    eventType: "SCHEDULED",
    metadata: { activateAt: activateAt.toISOString(), deactivateAt: deactivateAt?.toISOString() },
  });

  return { id: result.id };
}

export async function rollbackFeatureFlag(
  platform: BusinessContext,
  flagId: string,
  targetVersion: number,
): Promise<{ id: string; version: number }> {
  assertPermission(platform, PERMISSION_CODES.FEATURE_FLAGS_MANAGE);

  const existing = await prisma.featureFlag.findFirst({
    where: { id: flagId, businessId: platform.business.id },
  });

  if (!existing) {
    throw new Error("Feature flag not found");
  }

  if (!canRollbackFlag(existing.currentVersion)) {
    throw new Error("No previous version available for rollback");
  }

  const versionRecord = await prisma.featureFlagVersion.findUnique({
    where: { flagId_version: { flagId, version: targetVersion } },
  });

  if (!versionRecord) {
    throw new Error(`Version ${targetVersion} not found`);
  }

  const config = versionRecord.previousConfig as Record<string, unknown>;
  const nextVersion = buildNextFlagVersion(existing.currentVersion);

  await saveFlagVersion({
    flagId,
    businessId: platform.business.id,
    userId: platform.user.id,
    version: existing.currentVersion,
    previousConfig: serializeFlagConfig(existing),
    changeReason: `Rollback to version ${targetVersion}`,
  });

  const updated = await prisma.featureFlag.update({
    where: { id: flagId },
    data: {
      name: String(config.name ?? existing.name),
      description: String(config.description ?? existing.description),
      flagType: (config.flagType as typeof existing.flagType) ?? existing.flagType,
      status: (config.status as typeof existing.status) ?? existing.status,
      defaultEnabled: Boolean(config.defaultEnabled ?? existing.defaultEnabled),
      rolloutPercentage: Number(config.rolloutPercentage ?? existing.rolloutPercentage),
      scheduledActivateAt: config.scheduledActivateAt
        ? new Date(String(config.scheduledActivateAt))
        : null,
      scheduledDeactivateAt: config.scheduledDeactivateAt
        ? new Date(String(config.scheduledDeactivateAt))
        : null,
      conditions: (config.conditions ?? existing.conditions) as Prisma.InputJsonValue,
      metadata: (config.metadata ?? existing.metadata) as Prisma.InputJsonValue | undefined,
      currentVersion: nextVersion,
      changedById: platform.user.id,
      changeReason: `Rollback to version ${targetVersion}`,
    },
  });

  await logFeatureFlagAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    flagId,
    flagKey: updated.key,
    eventType: "ROLLBACK",
    metadata: { targetVersion, version: nextVersion },
  });

  return { id: updated.id, version: updated.currentVersion };
}

export async function evaluateFeatureAvailability(
  platform: BusinessContext,
  key: string,
  contextOverride?: Partial<FeatureEvaluationContext>,
): Promise<FeatureEvaluationResult> {
  assertPermission(platform, PERMISSION_CODES.FEATURE_FLAGS_EVALUATE);

  const flag = await prisma.featureFlag.findFirst({
    where: { businessId: platform.business.id, key },
    include: { targets: true },
  });

  const definition = getFeatureDefinition(key);
  const context = { ...buildEvaluationContext(platform), ...contextOverride };

  if (!flag) {
    return {
      key,
      enabled: definition?.defaultEnabled ?? false,
      reason: definition ? "Using registry default" : "Feature flag not found",
      flagType: definition?.flagType ?? "BOOLEAN",
    };
  }

  const result = evaluateFeatureFlag({
    flag: mapFlagRecord(flag),
    targets: flag.targets,
    context,
  });

  await prisma.featureFlagEvaluationLog.create({
    data: {
      flagId: flag.id,
      businessId: platform.business.id,
      userId: platform.user.id,
      flagKey: key,
      enabled: result.enabled,
      context: context as Prisma.InputJsonValue,
    },
  });

  await logFeatureFlagAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    flagId: flag.id,
    flagKey: key,
    eventType: "EVALUATED",
    metadata: { enabled: result.enabled, reason: result.reason },
  });

  return result;
}

export async function evaluateModuleFeatures(
  platform: BusinessContext,
  module: string,
  contextOverride?: Partial<FeatureEvaluationContext>,
): Promise<Record<string, boolean>> {
  assertPermission(platform, PERMISSION_CODES.FEATURE_FLAGS_EVALUATE);

  const flags = await prisma.featureFlag.findMany({
    where: { businessId: platform.business.id, module },
    include: { targets: true },
  });

  const context = { ...buildEvaluationContext(platform), ...contextOverride };
  const results: Record<string, boolean> = {};

  for (const flag of flags) {
    const result = evaluateFeatureFlag({
      flag: mapFlagRecord(flag),
      targets: flag.targets,
      context,
    });
    results[flag.key] = result.enabled;
  }

  return results;
}

export async function getFeatureFlagsDashboard(
  businessId: string,
): Promise<FeatureFlagsDashboardMetrics> {
  ensureBootstrapFeatureFlags();

  const [
    totalFlags,
    activeFlags,
    scheduledFlags,
    archivedFlags,
    totalEvaluations,
    recentEvaluations,
    targetingRules,
  ] = await Promise.all([
    prisma.featureFlag.count({ where: { businessId } }),
    prisma.featureFlag.count({ where: { businessId, status: "ACTIVE" } }),
    prisma.featureFlag.count({ where: { businessId, status: "SCHEDULED" } }),
    prisma.featureFlag.count({ where: { businessId, status: "ARCHIVED" } }),
    prisma.featureFlagEvaluationLog.count({ where: { businessId } }),
    prisma.featureFlagEvaluationLog.count({
      where: {
        businessId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.featureFlagTarget.count({ where: { businessId } }),
  ]);

  return {
    totalFlags,
    activeFlags,
    scheduledFlags,
    archivedFlags,
    totalEvaluations,
    recentEvaluations,
    registeredFeatures: listFeatureDefinitions().length,
    targetingRules,
  };
}

export async function listFeatureFlags(businessId: string) {
  return prisma.featureFlag.findMany({
    where: { businessId },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

export async function listFeatureFlagTargets(businessId: string) {
  return prisma.featureFlagTarget.findMany({
    where: { businessId },
    orderBy: { priority: "desc" },
    take: 100,
  });
}

export async function listFeatureFlagVersions(businessId: string) {
  return prisma.featureFlagVersion.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listFeatureFlagEvaluations(businessId: string) {
  return prisma.featureFlagEvaluationLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listFeatureFlagAuditLogs(businessId: string) {
  return prisma.featureFlagAuditLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listRegisteredFeatureDefinitions() {
  ensureBootstrapFeatureFlags();
  return listFeatureDefinitions();
}

export async function deleteFeatureFlag(platform: BusinessContext, flagId: string): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.FEATURE_FLAGS_ADMIN);

  const existing = await prisma.featureFlag.findFirst({
    where: { id: flagId, businessId: platform.business.id },
  });

  if (!existing) {
    throw new Error("Feature flag not found");
  }

  await prisma.featureFlag.delete({ where: { id: flagId } });

  await logFeatureFlagAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    flagKey: existing.key,
    eventType: "DELETED",
  });
}
