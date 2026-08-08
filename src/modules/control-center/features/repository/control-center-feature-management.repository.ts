import "server-only";

import type {
  FeatureFlagAuditEventType,
  FeatureFlagTargetType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { FEATURE_MANAGEMENT_PAGE_SIZE } from "@/modules/control-center/features/constants/control-center-feature-management";
import type {
  ControlCenterFeatureCategory,
  ControlCenterFeatureFlagAuditItem,
  ControlCenterFeatureFlagDetail,
  ControlCenterFeatureFlagSummary,
  ControlCenterFeatureFlagTargetItem,
  ControlCenterFeatureFlagVersionItem,
  ControlCenterFeatureManagementFilterOptions,
  ControlCenterFeatureManagementOverview,
  ControlCenterFeatureManagementQuery,
  ControlCenterFeatureMetadata,
  ControlCenterFeatureScope,
  CreateControlCenterFeatureFlagInput,
  UpdateControlCenterFeatureFlagInput,
} from "@/modules/control-center/features/types/control-center-feature-management-types";
import { normalizeRolloutPercentage } from "@/modules/feature-flags/engine/rollout-engine";
import {
  buildNextFlagVersion,
  serializeFlagConfig,
} from "@/modules/feature-flags/engine/version-engine";

function parseMetadata(metadata: unknown): ControlCenterFeatureMetadata {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }
  return metadata as ControlCenterFeatureMetadata;
}

function buildMetadata(
  current: unknown,
  patch: Partial<ControlCenterFeatureMetadata>,
): ControlCenterFeatureMetadata {
  return { ...parseMetadata(current), ...patch };
}

export function inferFeatureScope(
  flag: { businessId: string | null; metadata: unknown },
  targets: Array<{ targetType: string }>,
): ControlCenterFeatureScope {
  const meta = parseMetadata(flag.metadata);
  if (meta.scope) return meta.scope;
  if (targets.some((target) => target.targetType === "SUBSCRIPTION_PLAN")) return "plan";
  if (targets.some((target) => target.targetType === "TENANT")) return "tenant";
  if (targets.some((target) => target.targetType === "BUSINESS")) {
    return targets.some((target) => String(target.targetType).includes("ws"))
      ? "workspace"
      : "business";
  }
  if (flag.businessId) return "business";
  return "global";
}

export function inferFeatureCategory(metadata: unknown): ControlCenterFeatureCategory {
  return parseMetadata(metadata).category ?? "standard";
}

function serializeSummary(
  flag: Prisma.FeatureFlagGetPayload<{
    include: {
      business: { select: { businessName: true } };
      targets: true;
      _count: { select: { targets: true } };
    };
  }>,
): ControlCenterFeatureFlagSummary {
  const metadata = parseMetadata(flag.metadata);
  return {
    id: flag.id,
    key: flag.key,
    name: flag.name,
    description: flag.description,
    module: flag.module,
    flagType: flag.flagType,
    status: flag.status,
    defaultEnabled: flag.defaultEnabled,
    rolloutPercentage: flag.rolloutPercentage,
    currentVersion: flag.currentVersion,
    scope: inferFeatureScope(flag, flag.targets),
    category: inferFeatureCategory(flag.metadata),
    businessId: flag.businessId,
    businessName: flag.business?.businessName ?? null,
    targetCount: flag._count.targets,
    dependencies: metadata.dependencies ?? [],
    expiresAt: metadata.expiresAt ?? null,
    scheduledActivateAt: flag.scheduledActivateAt?.toISOString() ?? null,
    scheduledDeactivateAt: flag.scheduledDeactivateAt?.toISOString() ?? null,
    updatedAt: flag.updatedAt.toISOString(),
  };
}

export async function logControlCenterFeatureAudit(input: {
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

export async function loadFeatureManagementOverview(): Promise<ControlCenterFeatureManagementOverview> {
  const flags = await prisma.featureFlag.findMany({
    select: {
      status: true,
      businessId: true,
      metadata: true,
      targets: { select: { targetType: true } },
    },
  });

  let betaFlags = 0;
  let experimentalFlags = 0;
  let emergencyFlags = 0;
  let globalFlags = 0;
  let tenantFlags = 0;
  let businessFlags = 0;

  for (const flag of flags) {
    const category = inferFeatureCategory(flag.metadata);
    const scope = inferFeatureScope(flag, flag.targets);
    if (category === "beta") betaFlags += 1;
    if (category === "experimental") experimentalFlags += 1;
    if (category === "emergency") emergencyFlags += 1;
    if (scope === "global") globalFlags += 1;
    if (scope === "tenant") tenantFlags += 1;
    if (scope === "business" || scope === "workspace") businessFlags += 1;
  }

  return {
    totalFlags: flags.length,
    activeFlags: flags.filter((flag) => flag.status === "ACTIVE").length,
    betaFlags,
    experimentalFlags,
    emergencyFlags,
    scheduledFlags: flags.filter((flag) => flag.status === "SCHEDULED").length,
    globalFlags,
    tenantFlags,
    businessFlags,
  };
}

export async function loadFeatureManagementFilterOptions(): Promise<ControlCenterFeatureManagementFilterOptions> {
  const [modules, businesses, tenantPlans] = await Promise.all([
    prisma.featureFlag.findMany({ select: { module: true }, distinct: ["module"] }),
    prisma.business.findMany({
      select: { id: true, businessName: true },
      orderBy: { businessName: "asc" },
      take: 200,
    }),
    prisma.tenantRecord.findMany({
      select: { subscriptionPlan: true },
      distinct: ["subscriptionPlan"],
    }),
  ]);

  return {
    modules: modules.map((row) => row.module).filter(Boolean).sort(),
    scopes: ["global", "plan", "tenant", "business", "workspace"],
    categories: ["standard", "beta", "experimental", "emergency"],
    statuses: ["DRAFT", "ACTIVE", "SCHEDULED", "ARCHIVED", "DEPRECATED"],
    businesses: businesses.map((business) => ({
      id: business.id,
      name: business.businessName ?? "Untitled",
    })),
    plans: tenantPlans
      .map((row) => row.subscriptionPlan)
      .filter((plan): plan is string => Boolean(plan?.trim()))
      .sort(),
  };
}

export async function queryControlCenterFeatureFlags(
  query: ControlCenterFeatureManagementQuery = {},
) {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? FEATURE_MANAGEMENT_PAGE_SIZE;
  const where: Prisma.FeatureFlagWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.module?.trim()) {
    where.module = query.module.trim();
  }

  if (query.search?.trim()) {
    where.OR = [
      { key: { contains: query.search.trim(), mode: "insensitive" } },
      { name: { contains: query.search.trim(), mode: "insensitive" } },
      { description: { contains: query.search.trim(), mode: "insensitive" } },
    ];
  }

  const flags = await prisma.featureFlag.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      business: { select: { businessName: true } },
      targets: true,
      _count: { select: { targets: true } },
    },
  });

  let items = flags.map(serializeSummary);

  if (query.scope) {
    items = items.filter((item) => item.scope === query.scope);
  }

  if (query.category) {
    items = items.filter((item) => item.category === query.category);
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

export async function getControlCenterFeatureFlagDetail(
  flagId: string,
): Promise<ControlCenterFeatureFlagDetail | null> {
  const flag = await prisma.featureFlag.findUnique({
    where: { id: flagId },
    include: {
      business: { select: { businessName: true } },
      targets: { orderBy: { priority: "desc" } },
      _count: { select: { targets: true } },
    },
  });

  if (!flag) return null;

  const [versions, audit] = await Promise.all([
    prisma.featureFlagVersion.findMany({
      where: { flagId },
      orderBy: { version: "desc" },
      take: 20,
      include: { changedBy: { select: { email: true } } },
    }),
    prisma.featureFlagAuditLog.findMany({
      where: { flagId },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { user: { select: { email: true } } },
    }),
  ]);

  const summary = serializeSummary(flag);
  const metadata = parseMetadata(flag.metadata);

  return {
    ...summary,
    conditions: flag.conditions,
    metadata,
    targets: flag.targets.map(
      (target): ControlCenterFeatureFlagTargetItem => ({
        id: target.id,
        targetType: target.targetType,
        targetValue: target.targetValue,
        isIncluded: target.isIncluded,
        priority: target.priority,
      }),
    ),
    versions: versions.map(
      (version): ControlCenterFeatureFlagVersionItem => ({
        id: version.id,
        version: version.version,
        changeReason: version.changeReason,
        changedByEmail: version.changedBy?.email ?? null,
        createdAt: version.createdAt.toISOString(),
      }),
    ),
    audit: audit.map(
      (entry): ControlCenterFeatureFlagAuditItem => ({
        id: entry.id,
        eventType: entry.eventType,
        flagKey: entry.flagKey,
        actorEmail: entry.user?.email ?? null,
        metadata: (entry.metadata as Record<string, unknown> | null) ?? null,
        createdAt: entry.createdAt.toISOString(),
      }),
    ),
  };
}

async function syncTargets(
  flagId: string,
  businessId: string | null,
  targets: CreateControlCenterFeatureFlagInput["targets"],
): Promise<void> {
  await prisma.featureFlagTarget.deleteMany({ where: { flagId } });
  if (!targets?.length) return;

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

export async function createControlCenterFeatureFlagRecord(
  userId: string,
  input: CreateControlCenterFeatureFlagInput,
): Promise<{ id: string }> {
  const scope = input.scope ?? "global";
  const businessId =
    scope === "global" ? null : input.businessId ?? null;

  const metadata = buildMetadata(null, {
    scope,
    category: input.category ?? "standard",
    dependencies: input.dependencies ?? [],
    expiresAt: input.expiresAt ?? null,
  });

  const flag = await prisma.featureFlag.create({
    data: {
      businessId,
      key: input.key.trim(),
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      module: input.module.trim(),
      flagType: input.flagType,
      status: input.defaultEnabled ? "ACTIVE" : "DRAFT",
      defaultEnabled: input.defaultEnabled ?? false,
      rolloutPercentage: normalizeRolloutPercentage(input.rolloutPercentage ?? 0),
      scheduledActivateAt: input.scheduledActivateAt ? new Date(input.scheduledActivateAt) : null,
      scheduledDeactivateAt: input.scheduledDeactivateAt
        ? new Date(input.scheduledDeactivateAt)
        : null,
      metadata: metadata as Prisma.InputJsonValue,
      changedById: userId,
      changeReason: input.changeReason ?? "Created from Control Center",
    },
  });

  await syncTargets(flag.id, businessId, input.targets);

  await logControlCenterFeatureAudit({
    businessId,
    userId,
    flagId: flag.id,
    flagKey: flag.key,
    eventType: "CREATED",
    metadata: { scope, category: input.category ?? "standard" },
  });

  return { id: flag.id };
}

export async function updateControlCenterFeatureFlagRecord(
  userId: string,
  flagId: string,
  input: UpdateControlCenterFeatureFlagInput,
): Promise<void> {
  const existing = await prisma.featureFlag.findUnique({ where: { id: flagId } });
  if (!existing) {
    throw new Error("Feature flag not found");
  }

  await prisma.featureFlagVersion.create({
    data: {
      flagId: existing.id,
      businessId: existing.businessId,
      version: existing.currentVersion,
      previousConfig: serializeFlagConfig(existing) as Prisma.InputJsonValue,
      changedById: userId,
      changeReason: input.changeReason ?? "Updated from Control Center",
    },
  });

  const metadata = buildMetadata(existing.metadata, {
    ...(input.scope ? { scope: input.scope } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.dependencies ? { dependencies: input.dependencies } : {}),
    ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
    ...(input.metadata ? input.metadata : {}),
  });

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
            ? new Date(input.scheduledActivateAt)
            : null
          : existing.scheduledActivateAt,
      scheduledDeactivateAt:
        input.scheduledDeactivateAt !== undefined
          ? input.scheduledDeactivateAt
            ? new Date(input.scheduledDeactivateAt)
            : null
          : existing.scheduledDeactivateAt,
      metadata: metadata as Prisma.InputJsonValue,
      currentVersion: buildNextFlagVersion(existing.currentVersion),
      changedById: userId,
      changeReason: input.changeReason ?? null,
    },
  });

  if (input.targets) {
    await syncTargets(flagId, existing.businessId, input.targets);
  }

  const eventType =
    input.status === "ACTIVE" || input.defaultEnabled === true
      ? "ENABLED"
      : input.status === "ARCHIVED" || input.defaultEnabled === false
        ? "DISABLED"
        : "UPDATED";

  await logControlCenterFeatureAudit({
    businessId: existing.businessId,
    userId,
    flagId: updated.id,
    flagKey: updated.key,
    eventType,
    metadata: { version: updated.currentVersion },
  });
}

export async function emergencyDisableControlCenterFeatureFlag(
  userId: string,
  flagId: string,
  changeReason?: string,
): Promise<void> {
  const existing = await prisma.featureFlag.findUnique({ where: { id: flagId } });
  if (!existing) {
    throw new Error("Feature flag not found");
  }

  const metadata = buildMetadata(existing.metadata, {
    category: "emergency",
    emergencyDisabled: true,
  });

  await updateControlCenterFeatureFlagRecord(userId, flagId, {
    status: "ARCHIVED",
    defaultEnabled: false,
    category: "emergency",
    metadata,
    changeReason: changeReason ?? "Emergency kill switch activated",
  });
}

export async function assignControlCenterFeatureTargets(
  userId: string,
  flagId: string,
  targetType: FeatureFlagTargetType,
  targetValues: string[],
  changeReason?: string,
): Promise<void> {
  const existing = await prisma.featureFlag.findUnique({ where: { id: flagId } });
  if (!existing) {
    throw new Error("Feature flag not found");
  }

  const targets = targetValues.map((targetValue, index) => ({
    targetType,
    targetValue,
    isIncluded: true,
    priority: targetValues.length - index,
  }));

  await updateControlCenterFeatureFlagRecord(userId, flagId, {
    targets,
    changeReason: changeReason ?? `Assigned ${targetType} targets`,
  });
}

export async function exportControlCenterFeatureFlagsPayload() {
  const flags = await prisma.featureFlag.findMany({
    include: { targets: true },
    orderBy: { key: "asc" },
  });

  return flags.map((flag) => ({
    key: flag.key,
    name: flag.name,
    description: flag.description,
    module: flag.module,
    flagType: flag.flagType,
    status: flag.status,
    defaultEnabled: flag.defaultEnabled,
    rolloutPercentage: flag.rolloutPercentage,
    businessId: flag.businessId,
    metadata: flag.metadata,
    conditions: flag.conditions,
    scheduledActivateAt: flag.scheduledActivateAt?.toISOString() ?? null,
    scheduledDeactivateAt: flag.scheduledDeactivateAt?.toISOString() ?? null,
    targets: flag.targets.map((target) => ({
      targetType: target.targetType,
      targetValue: target.targetValue,
      isIncluded: target.isIncluded,
      priority: target.priority,
    })),
  }));
}

export async function importControlCenterFeatureFlags(
  userId: string,
  records: Array<Record<string, unknown>>,
  changeReason?: string,
): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;

  for (const record of records) {
    const key = String(record.key ?? "").trim();
    if (!key) continue;

    const existing = await prisma.featureFlag.findFirst({
      where: { key, businessId: (record.businessId as string | null) ?? null },
    });

    const input = {
      key,
      name: String(record.name ?? key),
      description: String(record.description ?? ""),
      module: String(record.module ?? "platform"),
      flagType: (record.flagType as CreateControlCenterFeatureFlagInput["flagType"]) ?? "BOOLEAN",
      defaultEnabled: Boolean(record.defaultEnabled ?? false),
      rolloutPercentage: Number(record.rolloutPercentage ?? 0),
      businessId: (record.businessId as string | null) ?? null,
      metadata: (record.metadata as Record<string, unknown>) ?? {},
      targets: (record.targets as CreateControlCenterFeatureFlagInput["targets"]) ?? [],
      changeReason: changeReason ?? "Imported from Control Center",
    };

    if (existing) {
      await updateControlCenterFeatureFlagRecord(userId, existing.id, {
        name: input.name,
        description: input.description,
        flagType: input.flagType,
        defaultEnabled: input.defaultEnabled,
        rolloutPercentage: input.rolloutPercentage,
        targets: input.targets,
        changeReason: input.changeReason,
      });
      updated += 1;
    } else {
      await createControlCenterFeatureFlagRecord(userId, {
        ...input,
        scope: ((input.metadata as ControlCenterFeatureMetadata).scope as ControlCenterFeatureScope) ?? "global",
        category:
          ((input.metadata as ControlCenterFeatureMetadata).category as ControlCenterFeatureCategory) ??
          "standard",
      });
      created += 1;
    }
  }

  await logControlCenterFeatureAudit({
    userId,
    eventType: "UPDATED",
    metadata: { import: true, created, updated },
  });

  return { created, updated };
}
