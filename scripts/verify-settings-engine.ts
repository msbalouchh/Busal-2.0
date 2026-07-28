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
import {
  buildScopeIdentifier,
  getApplicableScopeIdentifiers,
} from "../src/modules/settings-engine/engine/inheritance-engine";
import { normalizeEnvironment } from "../src/modules/settings-engine/engine/environment-engine";
import {
  assertValidSettingValue,
  validateSettingValue,
} from "../src/modules/settings-engine/engine/validation-engine";
import {
  buildNextVersion,
  canRollback,
} from "../src/modules/settings-engine/engine/version-engine";
import {
  CONFIG_CATEGORIES,
  CONFIG_SCOPES,
  SETTINGS_ENGINE_ROUTES,
} from "../src/modules/settings-engine/constants/routes";
import {
  ensureBootstrapSettingsEngine,
  getDefaultCategoryCount,
  getDefaultSettingCount,
} from "../src/modules/settings-engine/plugins/bootstrap-settings";
import {
  isSettingRegistered,
  listSettingDefinitions,
} from "../src/modules/settings-engine/registry/settings-registry";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import {
  deleteConfigurationValue,
  ensureSettingsEngineDefaults,
  exportConfiguration,
  getConfiguration,
  getConfigurationByCategory,
  getModuleConfiguration,
  getSettingsEngineDashboard,
  importConfiguration,
  listConfigAuditLogs,
  registerModuleSettingDefinition,
  rollbackConfigurationValue,
  setConfigurationValue,
} from "../src/services/settings-engine.service";
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
    "src/modules/settings-engine/index.ts",
    "src/modules/settings-engine/constants/routes.ts",
    "src/modules/settings-engine/types/settings-engine-types.ts",
    "src/modules/settings-engine/registry/settings-registry.ts",
    "src/modules/settings-engine/engine/config-engine.ts",
    "src/modules/settings-engine/engine/inheritance-engine.ts",
    "src/modules/settings-engine/engine/validation-engine.ts",
    "src/modules/settings-engine/engine/version-engine.ts",
    "src/modules/settings-engine/engine/environment-engine.ts",
    "src/modules/settings-engine/plugins/bootstrap-settings.ts",
    "src/modules/settings-engine/utils/settings-utils.ts",
    "src/modules/settings-engine/lib/get-settings-context.ts",
    "src/modules/settings-engine/actions/settings-actions.ts",
    "src/modules/settings-engine/components/settings-engine-dashboard.tsx",
    "src/modules/settings-engine/components/settings-engine-lists.tsx",
    "src/modules/settings-engine/components/settings-engine-nav.tsx",
    "src/services/settings-engine.service.ts",
    "src/app/dashboard/settings/page.tsx",
    "src/app/dashboard/settings/definitions/page.tsx",
    "src/app/dashboard/settings/values/page.tsx",
    "src/app/dashboard/settings/scopes/page.tsx",
    "src/app/dashboard/settings/environments/page.tsx",
    "src/app/dashboard/settings/versions/page.tsx",
    "src/app/dashboard/settings/registry/page.tsx",
    "src/app/dashboard/settings/audit/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Settings engine routes");
  assert(SETTINGS_ENGINE_ROUTES.overview === "/dashboard/settings", "Overview route mismatch");
  assert(SETTINGS_ENGINE_ROUTES.registry.includes("registry"), "Registry route missing");
  console.log("  PASS");

  console.log("Permission protected");
  const permissionsSource = readFileSync(
    join(root, "src/modules/authorization/constants/permissions.ts"),
    "utf8",
  );
  assert(permissionsSource.includes("settings.view"), "settings.view missing");
  assert(permissionsSource.includes("settings.admin"), "settings.admin missing");
  assert(ALL_PERMISSION_CODES.includes(PERMISSION_CODES.SETTINGS_EDIT), "Permission code missing");
  console.log("  PASS");

  console.log("Schema");
  const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schema.includes("model ConfigSettingDefinition"), "ConfigSettingDefinition missing");
  assert(schema.includes("model ConfigSettingValue"), "ConfigSettingValue missing");
  assert(schema.includes("model ConfigSettingVersion"), "ConfigSettingVersion missing");
  assert(schema.includes("model ConfigAuditLog"), "ConfigAuditLog missing");
  console.log("  PASS");

  console.log("Registry bootstrap");
  ensureBootstrapSettingsEngine();
  const definitions = listSettingDefinitions();
  assert(definitions.length === getDefaultSettingCount(), "Default settings not registered");
  assert(isSettingRegistered("localization.timezone"), "Timezone setting missing");
  assert(isSettingRegistered("integrations.webhook_secret"), "Secret setting missing");
  assert(getDefaultCategoryCount() === CONFIG_CATEGORIES.length, "Category count mismatch");
  console.log("  PASS");

  console.log("Validation engine");
  const timezoneDefinition = definitions.find((entry) => entry.key === "localization.timezone");
  assert(timezoneDefinition, "Timezone definition missing");
  const valid = validateSettingValue(timezoneDefinition, "UTC");
  assert(valid.valid, "Valid timezone should pass");
  const invalid = validateSettingValue(timezoneDefinition, "INVALID_TZ");
  assert(!invalid.valid, "Invalid enum should fail");
  assertValidSettingValue(timezoneDefinition, "Europe/London");
  console.log("  PASS");

  console.log("Inheritance engine");
  const scopeIds = getApplicableScopeIdentifiers({
    businessId: "biz-1",
    branchId: "branch-1",
    userId: "user-1",
    roleSlug: "manager",
  });
  assert(scopeIds.length >= 5, "Applicable scopes missing");
  assert(
    buildScopeIdentifier("BUSINESS", { businessId: "biz-1" }) === "business:biz-1",
    "Business scope identifier failed",
  );
  console.log("  PASS");

  console.log("Environment engine");
  assert(normalizeEnvironment(undefined) === "PRODUCTION", "Default environment failed");
  assert(normalizeEnvironment("STAGING") === "STAGING", "Staging environment failed");
  console.log("  PASS");

  console.log("Version engine");
  assert(buildNextVersion(1) === 2, "Next version failed");
  assert(canRollback(2), "Rollback should be allowed");
  assert(!canRollback(1), "Rollback should be blocked at v1");
  console.log("  PASS");

  console.log("Config scopes");
  assert(CONFIG_SCOPES.length === 8, "Expected 8 configuration scopes");
  console.log("  PASS");

  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  assert(business, "No business found");
  const platform = await buildPlatformContext(business.id);

  await prisma.configSettingVersion.deleteMany({
    where: {
      businessId: business.id,
      settingValue: {
        definitionKey: { in: ["custom.verify_config", "custom.verify_setting_ext"] },
      },
    },
  });
  await prisma.configSettingValue.deleteMany({
    where: {
      businessId: business.id,
      definitionKey: { in: ["custom.verify_config", "custom.verify_setting_ext"] },
    },
  });

  console.log("Settings engine defaults");
  await ensureSettingsEngineDefaults(business.id);
  const definitionCount = await prisma.configSettingDefinition.count();
  assert(definitionCount >= getDefaultSettingCount(), "Definitions not synced to database");
  console.log("  PASS");

  console.log("Set configuration value");
  await registerModuleSettingDefinition({
    key: "custom.verify_config",
    module: "verify-settings-engine",
    category: "general",
    valueType: "STRING",
    defaultValue: "default",
    supportedScopes: ["BUSINESS"],
  });

  const created = await setConfigurationValue(platform, {
    key: "custom.verify_config",
    value: "verify-value-1",
    scope: "BUSINESS",
    changeReason: "Verify settings engine",
  });
  assert(created.version === 1, "Initial version should be 1");
  console.log("  PASS");

  console.log("Update configuration with versioning");
  const updated = await setConfigurationValue(platform, {
    key: "custom.verify_config",
    value: "verify-value-2",
    scope: "BUSINESS",
    changeReason: "Update verify settings engine",
  });
  assert(updated.version === 2, "Updated version should be 2");
  console.log("  PASS");

  console.log("Branch override inheritance");
  await setConfigurationValue(platform, {
    key: "pos.receipt_footer",
    value: "Branch footer message",
    scope: "BUSINESS",
    changeReason: "Business default footer",
  });

  const branch = await prisma.branch.findFirst({ where: { businessId: business.id } });
  if (branch) {
    await setConfigurationValue(platform, {
      key: "pos.receipt_footer",
      value: "Branch-specific footer",
      scope: "BRANCH",
      branchId: branch.id,
      changeReason: "Branch override",
    });

    const branchResolved = await getConfiguration(platform, "pos.receipt_footer", {
      context: { branchId: branch.id },
    });
    assert(branchResolved?.value === "Branch-specific footer", "Branch override failed");
  }
  console.log("  PASS");

  console.log("Environment override");
  await setConfigurationValue(platform, {
    key: "general.feature_flags",
    value: { betaDashboard: true },
    scope: "BUSINESS",
    environment: "DEVELOPMENT",
    changeReason: "Development feature flags",
  });

  const devConfig = await getConfiguration(platform, "general.feature_flags", {
    environment: "DEVELOPMENT",
  });
  assert(
    (devConfig?.value as { betaDashboard?: boolean })?.betaDashboard === true,
    "Development override failed",
  );
  console.log("  PASS");

  console.log("Unified configuration API");
  await setConfigurationValue(platform, {
    key: "localization.timezone",
    value: "UTC",
    scope: "BUSINESS",
    changeReason: "Verify unified API timezone",
  });
  const timezone = await getConfiguration(platform, "localization.timezone");
  assert(timezone?.value === "UTC", "Resolved configuration failed");

  const localizationSettings = await getConfigurationByCategory(platform, "localization");
  assert(localizationSettings.length > 0, "Category configuration failed");

  const moduleConfig = await getModuleConfiguration(platform, "pos");
  assert(moduleConfig["pos.receipt_footer"], "Module configuration failed");
  console.log("  PASS");

  console.log("Rollback configuration");
  const valueRecord = await prisma.configSettingValue.findFirst({
    where: {
      businessId: business.id,
      definitionKey: "custom.verify_config",
      scope: "BUSINESS",
    },
  });
  assert(valueRecord, "Configuration value missing");
  assert(valueRecord.currentVersion >= 2, "Verify config should have multiple versions");
  const rolledBack = await rollbackConfigurationValue(platform, valueRecord.id, 1);
  assert(
    rolledBack.version === valueRecord.currentVersion + 1,
    "Rollback version should increment",
  );
  console.log("  PASS");

  console.log("Export and import configuration");
  const exported = await exportConfiguration(platform, "PRODUCTION");
  assert(exported.settings.length > 0, "Export returned no settings");

  await importConfiguration(platform, {
    environment: "STAGING",
    settings: [
      {
        key: "currency.default",
        scope: "BUSINESS",
        scopeIdentifier: `business:${business.id}`,
        value: "EUR",
      },
    ],
    changeReason: "Verify import",
  });

  const stagingCurrency = await getConfiguration(platform, "currency.default", {
    environment: "STAGING",
  });
  assert(stagingCurrency?.value === "EUR", "Imported staging configuration failed");
  console.log("  PASS");

  console.log("Delete configuration value");
  const tempValue = await setConfigurationValue(platform, {
    key: "reporting.default_period",
    value: "7d",
    scope: "BUSINESS",
    changeReason: "Temporary value for delete verify",
  });
  await deleteConfigurationValue(platform, tempValue.id);
  const deletedRecord = await prisma.configSettingValue.findUnique({ where: { id: tempValue.id } });
  assert(deletedRecord?.isDeleted, "Soft delete failed");
  console.log("  PASS");

  console.log("Settings engine dashboard");
  const dashboard = await getSettingsEngineDashboard(business.id);
  assert(dashboard.totalDefinitions > 0, "Dashboard definitions missing");
  assert(dashboard.totalValues > 0, "Dashboard values missing");
  assert(dashboard.categories > 0, "Dashboard categories missing");
  console.log("  PASS");

  console.log("Audit logs");
  const auditLogs = await listConfigAuditLogs(business.id);
  assert(
    auditLogs.some((log) => log.eventType === "CREATED"),
    "Created audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "UPDATED"),
    "Updated audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "EXPORTED"),
    "Exported audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "IMPORTED"),
    "Imported audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "RESTORED"),
    "Restored audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "DELETED"),
    "Deleted audit missing",
  );
  console.log("  PASS");

  console.log("Extensibility registry");
  await registerModuleSettingDefinition({
    key: "custom.verify_setting_ext",
    module: "verify-module",
    category: "custom-category",
    valueType: "BOOLEAN",
    defaultValue: false,
    helpText: "Custom verify setting",
    supportedScopes: ["BUSINESS"],
  });
  assert(isSettingRegistered("custom.verify_setting_ext"), "Custom setting registration failed");
  console.log("  PASS");

  console.log("\nSettings & Configuration Engine verification passed.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
