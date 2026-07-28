import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import {
  ALL_PERMISSION_CODES,
  PERMISSION_CODES,
} from "../src/modules/authorization/constants/permissions";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";
import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import { evaluateConditions } from "../src/modules/feature-flags/engine/condition-engine";
import { evaluateFeatureFlag } from "../src/modules/feature-flags/engine/evaluation-engine";
import {
  isInRolloutBucket,
  normalizeRolloutPercentage,
} from "../src/modules/feature-flags/engine/rollout-engine";
import {
  isWithinScheduledWindow,
  resolveScheduledStatus,
} from "../src/modules/feature-flags/engine/scheduling-engine";
import { matchesTargetingRules } from "../src/modules/feature-flags/engine/targeting-engine";
import {
  buildNextFlagVersion,
  canRollbackFlag,
} from "../src/modules/feature-flags/engine/version-engine";
import {
  FEATURE_FLAG_TARGET_TYPES,
  FEATURE_FLAG_TYPES,
  FEATURE_FLAGS_ROUTES,
} from "../src/modules/feature-flags/constants/routes";
import {
  ensureBootstrapFeatureFlags,
  getDefaultFeatureCount,
} from "../src/modules/feature-flags/plugins/bootstrap-feature-flags";
import {
  isFeatureRegistered,
  listFeatureDefinitions,
} from "../src/modules/feature-flags/registry/feature-registry";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import {
  archiveFeatureFlag,
  cloneFeatureFlag,
  createFeatureFlag,
  ensureFeatureFlagsDefaults,
  evaluateFeatureAvailability,
  evaluateModuleFeatures,
  getFeatureFlagsDashboard,
  listFeatureFlagAuditLogs,
  registerModuleFeatureDefinition,
  rollbackFeatureFlag,
  scheduleFeatureRollout,
  updateFeatureFlag,
} from "../src/services/feature-flags.service";
import { mapProfileToAuthUser } from "../src/services/user.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function buildPlatformContext(businessId: string): Promise<BusinessContext> {
  const businessRecord = await prisma.business.findUnique({
    where: { id: businessId },
    include: { owner: true },
  });

  assert(businessRecord?.owner, "Business owner missing");

  const business = await getOwnedBusinessById(businessRecord.ownerId, businessId);
  assert(business, "Business profile missing");

  const user = mapProfileToAuthUser(
    businessRecord.owner.id,
    businessRecord.owner.email,
    businessRecord.owner,
    {},
  );
  const authorization = await resolveAuthorizationContext(user, business);

  return {
    user,
    business,
    branch: null,
    branchId: null,
    roleSlug: authorization.roleSlug,
    permissions: Array.from(authorization.permissions),
    authorization,
    staffSession: null,
    isOwner: authorization.isOwner,
    accessibleBusinesses: [
      { id: business.id, name: business.businessName ?? "Business", isOnboarded: true },
    ],
    accessibleBranches: [],
  };
}

async function main() {
  console.log("Module structure");
  const moduleFiles = [
    "src/modules/feature-flags/index.ts",
    "src/modules/feature-flags/constants/routes.ts",
    "src/modules/feature-flags/types/feature-flags-types.ts",
    "src/modules/feature-flags/registry/feature-registry.ts",
    "src/modules/feature-flags/engine/evaluation-engine.ts",
    "src/modules/feature-flags/engine/targeting-engine.ts",
    "src/modules/feature-flags/engine/condition-engine.ts",
    "src/modules/feature-flags/engine/scheduling-engine.ts",
    "src/modules/feature-flags/engine/rollout-engine.ts",
    "src/modules/feature-flags/engine/version-engine.ts",
    "src/modules/feature-flags/plugins/bootstrap-feature-flags.ts",
    "src/modules/feature-flags/utils/feature-flags-utils.ts",
    "src/modules/feature-flags/lib/get-feature-flags-context.ts",
    "src/modules/feature-flags/actions/feature-flags-actions.ts",
    "src/modules/feature-flags/components/feature-flags-dashboard.tsx",
    "src/modules/feature-flags/components/feature-flags-lists.tsx",
    "src/modules/feature-flags/components/feature-flags-nav.tsx",
    "src/services/feature-flags.service.ts",
    "src/app/dashboard/feature-flags/page.tsx",
    "src/app/dashboard/feature-flags/flags/page.tsx",
    "src/app/dashboard/feature-flags/targeting/page.tsx",
    "src/app/dashboard/feature-flags/schedules/page.tsx",
    "src/app/dashboard/feature-flags/evaluations/page.tsx",
    "src/app/dashboard/feature-flags/versions/page.tsx",
    "src/app/dashboard/feature-flags/registry/page.tsx",
    "src/app/dashboard/feature-flags/audit/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Feature flags routes");
  assert(FEATURE_FLAGS_ROUTES.overview === "/dashboard/feature-flags", "Overview route mismatch");
  assert(FEATURE_FLAGS_ROUTES.registry.includes("registry"), "Registry route missing");
  console.log("  PASS");

  console.log("Permission protected");
  const permissionsSource = readFileSync(
    join(root, "src/modules/authorization/constants/permissions.ts"),
    "utf8",
  );
  assert(permissionsSource.includes("feature_flags.view"), "feature_flags.view missing");
  assert(permissionsSource.includes("feature_flags.admin"), "feature_flags.admin missing");
  assert(
    ALL_PERMISSION_CODES.includes(PERMISSION_CODES.FEATURE_FLAGS_EVALUATE),
    "Permission code missing",
  );
  console.log("  PASS");

  console.log("Schema");
  const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schema.includes("model FeatureFlag"), "FeatureFlag missing");
  assert(schema.includes("model FeatureFlagTarget"), "FeatureFlagTarget missing");
  assert(schema.includes("model FeatureFlagVersion"), "FeatureFlagVersion missing");
  assert(schema.includes("model FeatureFlagEvaluationLog"), "FeatureFlagEvaluationLog missing");
  console.log("  PASS");

  console.log("Registry bootstrap");
  ensureBootstrapFeatureFlags();
  const features = listFeatureDefinitions();
  assert(features.length === getDefaultFeatureCount(), "Default features not registered");
  assert(isFeatureRegistered("ai.automation.enabled"), "AI automation feature missing");
  assert(isFeatureRegistered("pos.new_checkout"), "POS checkout feature missing");
  console.log("  PASS");

  console.log("Targeting engine");
  assert(
    matchesTargetingRules([{ targetType: "BUSINESS", targetValue: "biz-1", isIncluded: true }], {
      businessId: "biz-1",
    }),
    "Business targeting failed",
  );
  assert(FEATURE_FLAG_TARGET_TYPES.length === 12, "Expected 12 target types");
  console.log("  PASS");

  console.log("Condition engine");
  assert(
    evaluateConditions([{ type: "MODULE", field: "module", operator: "eq", value: "pos" }], {
      module: "pos",
    }),
    "Module condition failed",
  );
  console.log("  PASS");

  console.log("Scheduling engine");
  const now = new Date("2026-07-28T12:00:00.000Z");
  const activateAt = new Date("2026-07-28T10:00:00.000Z");
  const deactivateAt = new Date("2026-07-28T18:00:00.000Z");
  assert(isWithinScheduledWindow(now, activateAt, deactivateAt), "Scheduled window failed");
  assert(
    resolveScheduledStatus(now, activateAt, deactivateAt) === "active",
    "Schedule status failed",
  );
  console.log("  PASS");

  console.log("Rollout engine");
  assert(normalizeRolloutPercentage(150) === 100, "Rollout normalization failed");
  assert(isInRolloutBucket("test.flag", "user-1", 100), "100% rollout failed");
  console.log("  PASS");

  console.log("Evaluation engine");
  const booleanResult = evaluateFeatureFlag({
    flag: {
      id: "1",
      key: "test.boolean",
      name: "Test",
      module: "test",
      flagType: "BOOLEAN",
      status: "ACTIVE",
      defaultEnabled: true,
      rolloutPercentage: 0,
      scheduledActivateAt: null,
      scheduledDeactivateAt: null,
      conditions: [],
      metadata: null,
    },
    targets: [],
    context: { businessId: "biz-1" },
  });
  assert(booleanResult.enabled, "Boolean flag evaluation failed");

  const rolloutResult = evaluateFeatureFlag({
    flag: {
      id: "2",
      key: "test.rollout",
      name: "Rollout",
      module: "test",
      flagType: "PERCENTAGE_ROLLOUT",
      status: "ACTIVE",
      defaultEnabled: false,
      rolloutPercentage: 100,
      scheduledActivateAt: null,
      scheduledDeactivateAt: null,
      conditions: [],
      metadata: null,
    },
    targets: [],
    context: { userId: "user-1" },
  });
  assert(rolloutResult.enabled, "Rollout evaluation failed");
  assert(FEATURE_FLAG_TYPES.length === 5, "Expected 5 flag types");
  console.log("  PASS");

  console.log("Version engine");
  assert(buildNextFlagVersion(1) === 2, "Next version failed");
  assert(canRollbackFlag(2), "Rollback should be allowed");
  console.log("  PASS");

  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  assert(business, "No business found");
  const platform = await buildPlatformContext(business.id);

  await prisma.featureFlagEvaluationLog.deleteMany({
    where: { businessId: business.id, flagKey: { startsWith: "custom.verify" } },
  });
  await prisma.featureFlagAuditLog.deleteMany({
    where: { businessId: business.id, flagKey: { startsWith: "custom.verify" } },
  });
  await prisma.featureFlagVersion.deleteMany({
    where: {
      businessId: business.id,
      flag: { key: { startsWith: "custom.verify" } },
    },
  });
  await prisma.featureFlagTarget.deleteMany({
    where: {
      businessId: business.id,
      flag: { key: { startsWith: "custom.verify" } },
    },
  });
  await prisma.featureFlag.deleteMany({
    where: { businessId: business.id, key: { startsWith: "custom.verify" } },
  });

  console.log("Feature flags defaults");
  await ensureFeatureFlagsDefaults(business.id);
  const flagCount = await prisma.featureFlag.count({ where: { businessId: business.id } });
  assert(flagCount >= getDefaultFeatureCount(), "Default flags not seeded");
  console.log("  PASS");

  console.log("Create feature flag");
  const created = await createFeatureFlag(platform, {
    key: "custom.verify_flag",
    name: "Verify Feature Flag",
    module: "verify-feature-flags",
    flagType: "BOOLEAN",
    defaultEnabled: false,
    targets: [{ targetType: "BUSINESS", targetValue: business.id, isIncluded: true }],
    changeReason: "Verify feature flags platform",
  });
  assert(created.id, "Feature flag not created");
  console.log("  PASS");

  console.log("Update and enable feature flag");
  const updated = await updateFeatureFlag(platform, created.id, {
    status: "ACTIVE",
    defaultEnabled: true,
    changeReason: "Enable verify flag",
  });
  assert(updated.version === 2, "Version should increment on update");
  console.log("  PASS");

  console.log("Evaluate feature availability");
  const evaluation = await evaluateFeatureAvailability(platform, "custom.verify_flag");
  assert(evaluation.enabled, "Feature should be enabled");
  assert(evaluation.flagId, "Evaluation should reference flag");
  console.log("  PASS");

  console.log("Percentage rollout flag");
  const rolloutFlag = await createFeatureFlag(platform, {
    key: "custom.verify_rollout",
    name: "Verify Rollout",
    module: "verify-feature-flags",
    flagType: "PERCENTAGE_ROLLOUT",
    rolloutPercentage: 100,
    targets: [{ targetType: "USER", targetValue: platform.user.id, isIncluded: true }],
  });
  await updateFeatureFlag(platform, rolloutFlag.id, { status: "ACTIVE" });
  const rolloutEval = await evaluateFeatureAvailability(platform, "custom.verify_rollout");
  assert(rolloutEval.enabled, "Rollout flag should be enabled at 100%");
  console.log("  PASS");

  console.log("Conditional feature flag");
  const conditionalFlag = await createFeatureFlag(platform, {
    key: "custom.verify_conditional",
    name: "Verify Conditional",
    module: "verify-feature-flags",
    flagType: "CONDITIONAL",
    defaultEnabled: true,
    conditions: [
      { type: "MODULE", field: "module", operator: "eq", value: "verify-feature-flags" },
    ],
    targets: [{ targetType: "BUSINESS", targetValue: business.id, isIncluded: true }],
  });
  await updateFeatureFlag(platform, conditionalFlag.id, { status: "ACTIVE" });
  const conditionalEval = await evaluateFeatureAvailability(platform, "custom.verify_conditional", {
    module: "verify-feature-flags",
  });
  assert(conditionalEval.enabled, "Conditional flag should be enabled");
  console.log("  PASS");

  console.log("Schedule rollout");
  await scheduleFeatureRollout(
    platform,
    created.id,
    new Date(Date.now() + 3600000),
    new Date(Date.now() + 86400000),
  );
  const scheduledFlag = await prisma.featureFlag.findUnique({ where: { id: created.id } });
  assert(scheduledFlag?.status === "SCHEDULED", "Flag should be scheduled");
  console.log("  PASS");

  console.log("Clone feature flag");
  const cloned = await cloneFeatureFlag(platform, created.id, "custom.verify_flag_clone");
  assert(cloned.id, "Clone failed");
  console.log("  PASS");

  console.log("Rollback feature flag");
  const flagRecord = await prisma.featureFlag.findUnique({ where: { id: created.id } });
  assert(flagRecord && flagRecord.currentVersion >= 2, "Flag should have version history");
  const rolledBack = await rollbackFeatureFlag(platform, created.id, 1);
  assert(rolledBack.version > flagRecord.currentVersion, "Rollback should increment version");
  console.log("  PASS");

  console.log("Module feature evaluation");
  const moduleFeatures = await evaluateModuleFeatures(platform, "verify-feature-flags");
  assert(Object.keys(moduleFeatures).length > 0, "Module evaluation failed");
  console.log("  PASS");

  console.log("Archive feature flag");
  await archiveFeatureFlag(platform, conditionalFlag.id);
  const archived = await prisma.featureFlag.findUnique({ where: { id: conditionalFlag.id } });
  assert(archived?.status === "ARCHIVED", "Archive failed");
  console.log("  PASS");

  console.log("Feature flags dashboard");
  const dashboard = await getFeatureFlagsDashboard(business.id);
  assert(dashboard.totalFlags > 0, "Dashboard total flags missing");
  assert(dashboard.registeredFeatures === getDefaultFeatureCount(), "Registered features mismatch");
  console.log("  PASS");

  console.log("Audit logs");
  const auditLogs = await listFeatureFlagAuditLogs(business.id);
  assert(
    auditLogs.some((log) => log.eventType === "CREATED"),
    "Created audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "EVALUATED"),
    "Evaluated audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "CLONED"),
    "Cloned audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "SCHEDULED"),
    "Scheduled audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "ROLLBACK"),
    "Rollback audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "ARCHIVED"),
    "Archived audit missing",
  );
  console.log("  PASS");

  console.log("Extensibility registry");
  await registerModuleFeatureDefinition({
    key: "custom.verify_ext",
    module: "verify-module",
    name: "Verify Extension",
    flagType: "BOOLEAN",
    defaultEnabled: false,
    isActive: true,
  });
  assert(isFeatureRegistered("custom.verify_ext"), "Custom feature registration failed");
  console.log("  PASS");

  console.log("\nFeature Flag Management Platform verification passed.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
