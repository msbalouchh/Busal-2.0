import "server-only";

import type { ConfigAuditEventType, ConfigEnvironment, ConfigScope, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  evaluatePermission,
  toPermissionEvaluationContext,
} from "@/modules/iam/engine/permission-engine";
import { resolveConfigurationValue } from "@/modules/settings-engine/engine/config-engine";
import { normalizeEnvironment } from "@/modules/settings-engine/engine/environment-engine";
import {
  buildScopeIdentifier,
  toStoredConfigValues,
} from "@/modules/settings-engine/engine/inheritance-engine";
import { assertValidSettingValue } from "@/modules/settings-engine/engine/validation-engine";
import { buildNextVersion, canRollback } from "@/modules/settings-engine/engine/version-engine";
import { ensureBootstrapSettingsEngine } from "@/modules/settings-engine/plugins/bootstrap-settings";
import {
  getSettingDefinition,
  listSettingDefinitions,
  registerSettingDefinition,
  supportsScope,
} from "@/modules/settings-engine/registry/settings-registry";
import type {
  ConfigurationContext,
  ConfigurationExportPayload,
  ConfigurationImportInput,
  GetConfigurationOptions,
  RegisteredSettingDefinition,
  ResolvedConfiguration,
  SetConfigurationInput,
  SettingDefinitionInput,
  SettingsEngineDashboardMetrics,
} from "@/modules/settings-engine/types/settings-engine-types";

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

function buildConfigurationContext(platform: BusinessContext): ConfigurationContext {
  return {
    businessId: platform.business.id,
    branchId: platform.branchId,
    roleSlug: platform.roleSlug,
    userId: platform.user.id,
  };
}

async function logConfigAudit(input: {
  businessId?: string | null;
  userId?: string | null;
  eventType: ConfigAuditEventType;
  definitionKey?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.configAuditLog.create({
    data: {
      businessId: input.businessId ?? null,
      userId: input.userId ?? null,
      eventType: input.eventType,
      definitionKey: input.definitionKey ?? null,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

async function syncDefinitionToDatabase(definition: RegisteredSettingDefinition): Promise<void> {
  await prisma.configSettingDefinition.upsert({
    where: { key: definition.key },
    create: {
      key: definition.key,
      module: definition.module,
      category: definition.category,
      valueType: definition.valueType,
      defaultValue: definition.defaultValue as Prisma.InputJsonValue,
      isRequired: definition.isRequired ?? false,
      validationRules: definition.validationRules
        ? (definition.validationRules as Prisma.InputJsonValue)
        : undefined,
      allowedValues: definition.allowedValues
        ? (definition.allowedValues as Prisma.InputJsonValue)
        : undefined,
      minValue: definition.minValue ?? null,
      maxValue: definition.maxValue ?? null,
      regexPattern: definition.regexPattern ?? null,
      helpText: definition.helpText ?? null,
      supportedScopes: (definition.supportedScopes ?? []) as Prisma.InputJsonValue,
      isActive: definition.isActive,
    },
    update: {
      module: definition.module,
      category: definition.category,
      valueType: definition.valueType,
      defaultValue: definition.defaultValue as Prisma.InputJsonValue,
      isRequired: definition.isRequired ?? false,
      validationRules: definition.validationRules
        ? (definition.validationRules as Prisma.InputJsonValue)
        : undefined,
      allowedValues: definition.allowedValues
        ? (definition.allowedValues as Prisma.InputJsonValue)
        : undefined,
      minValue: definition.minValue ?? null,
      maxValue: definition.maxValue ?? null,
      regexPattern: definition.regexPattern ?? null,
      helpText: definition.helpText ?? null,
      supportedScopes: (definition.supportedScopes ?? []) as Prisma.InputJsonValue,
      isActive: definition.isActive,
    },
  });
}

async function loadStoredValues(businessId: string) {
  const records = await prisma.configSettingValue.findMany({
    where: {
      OR: [{ businessId }, { businessId: null }],
      isDeleted: false,
    },
  });

  return toStoredConfigValues(records);
}

function resolveScopeIdentifier(input: SetConfigurationInput, platform: BusinessContext): string {
  if (input.scopeIdentifier) {
    return input.scopeIdentifier;
  }

  const context: ConfigurationContext = {
    businessId: platform.business.id,
    branchId: input.branchId ?? platform.branchId,
    department: input.department,
    roleSlug: input.roleSlug ?? platform.roleSlug,
    userId: platform.user.id,
    moduleKey: input.moduleKey,
  };

  const scopeIdentifier = buildScopeIdentifier(input.scope, context);
  if (!scopeIdentifier) {
    throw new Error(`Unable to resolve scope identifier for ${input.scope}`);
  }

  return scopeIdentifier;
}

export async function ensureSettingsEngineDefaults(businessId: string): Promise<void> {
  ensureBootstrapSettingsEngine();

  for (const definition of listSettingDefinitions()) {
    await syncDefinitionToDatabase(definition);
  }

  const existingBusinessValue = await prisma.configSettingValue.findFirst({
    where: {
      businessId,
      definitionKey: "general.business_name",
      scope: "BUSINESS",
    },
  });

  if (!existingBusinessValue) {
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (business?.businessName) {
      await prisma.configSettingValue.create({
        data: {
          definitionKey: "general.business_name",
          scope: "BUSINESS",
          environment: "PRODUCTION",
          scopeIdentifier: `business:${businessId}`,
          businessId,
          value: business.businessName,
        },
      });
    }
  }
}

export async function registerModuleSettingDefinition(
  definition: SettingDefinitionInput,
): Promise<void> {
  ensureBootstrapSettingsEngine();
  registerSettingDefinition({ ...definition, isActive: true });
  await syncDefinitionToDatabase({ ...definition, isActive: true });
}

export async function getConfiguration(
  platform: BusinessContext,
  key: string,
  options?: GetConfigurationOptions,
): Promise<ResolvedConfiguration | null> {
  assertPermission(platform, PERMISSION_CODES.SETTINGS_VIEW);
  ensureBootstrapSettingsEngine();

  const storedValues = await loadStoredValues(platform.business.id);
  const context = { ...buildConfigurationContext(platform), ...options?.context };

  return resolveConfigurationValue({
    key,
    storedValues,
    context,
    environment: options?.environment,
  });
}

export async function getConfigurationByCategory(
  platform: BusinessContext,
  category: string,
  options?: GetConfigurationOptions,
): Promise<ResolvedConfiguration[]> {
  assertPermission(platform, PERMISSION_CODES.SETTINGS_VIEW);
  ensureBootstrapSettingsEngine();

  const storedValues = await loadStoredValues(platform.business.id);
  const context = { ...buildConfigurationContext(platform), ...options?.context };
  const environment = normalizeEnvironment(options?.environment);
  const definitions = listSettingDefinitions().filter(
    (definition) => definition.category === category,
  );

  return definitions
    .map((definition) =>
      resolveConfigurationValue({
        key: definition.key,
        storedValues,
        context,
        environment,
      })!,
    )
    .filter(Boolean);
}

export async function getModuleConfiguration(
  platform: BusinessContext,
  module: string,
  options?: GetConfigurationOptions,
): Promise<Record<string, unknown>> {
  assertPermission(platform, PERMISSION_CODES.SETTINGS_VIEW);
  ensureBootstrapSettingsEngine();

  const storedValues = await loadStoredValues(platform.business.id);
  const context = { ...buildConfigurationContext(platform), ...options?.context };
  const environment = normalizeEnvironment(options?.environment);
  const definitions = listSettingDefinitions().filter((definition) => definition.module === module);

  const resolved = definitions
    .map((definition) =>
      resolveConfigurationValue({
        key: definition.key,
        storedValues,
        context,
        environment,
      }),
    )
    .filter((entry): entry is ResolvedConfiguration => entry !== null);

  return Object.fromEntries(resolved.map((entry) => [entry.key, entry.value]));
}

export async function setConfigurationValue(
  platform: BusinessContext,
  input: SetConfigurationInput,
): Promise<{ id: string; version: number }> {
  assertPermission(platform, PERMISSION_CODES.SETTINGS_EDIT);

  const definition = getSettingDefinition(input.key);
  if (!definition) {
    throw new Error(`Unknown configuration key: ${input.key}`);
  }

  if (!supportsScope(definition, input.scope)) {
    throw new Error(`Scope ${input.scope} is not supported for ${input.key}`);
  }

  assertValidSettingValue(definition, input.value);

  const environment = normalizeEnvironment(input.environment);
  const scopeIdentifier = resolveScopeIdentifier(input, platform);

  const existing = await prisma.configSettingValue.findUnique({
    where: {
      definitionKey_scope_environment_scopeIdentifier: {
        definitionKey: input.key,
        scope: input.scope,
        environment,
        scopeIdentifier,
      },
    },
  });

  if (existing) {
    const nextVersion = buildNextVersion(existing.currentVersion);

    await prisma.configSettingVersion.create({
      data: {
        settingValueId: existing.id,
        businessId: platform.business.id,
        version: existing.currentVersion,
        previousValue: existing.value as Prisma.InputJsonValue,
        changedById: platform.user.id,
        changeReason: input.changeReason ?? null,
      },
    });

    const updated = await prisma.configSettingValue.update({
      where: { id: existing.id },
      data: {
        value: input.value as Prisma.InputJsonValue,
        currentVersion: nextVersion,
        changedById: platform.user.id,
        changeReason: input.changeReason ?? null,
        isDeleted: false,
        branchId: input.branchId ?? platform.branchId,
        department: input.department ?? null,
        roleSlug: input.roleSlug ?? platform.roleSlug,
        moduleKey: input.moduleKey ?? null,
      },
    });

    await logConfigAudit({
      businessId: platform.business.id,
      userId: platform.user.id,
      eventType: "UPDATED",
      definitionKey: input.key,
      metadata: { scope: input.scope, environment, version: nextVersion },
    });

    return { id: updated.id, version: updated.currentVersion };
  }

  const created = await prisma.configSettingValue.create({
    data: {
      definitionKey: input.key,
      scope: input.scope,
      environment,
      scopeIdentifier,
      businessId: input.scope === "PLATFORM" ? null : platform.business.id,
      branchId: input.branchId ?? platform.branchId,
      department: input.department ?? null,
      roleSlug: input.roleSlug ?? platform.roleSlug,
      userId: input.scope === "USER" ? platform.user.id : null,
      moduleKey: input.moduleKey ?? null,
      value: input.value as Prisma.InputJsonValue,
      changedById: platform.user.id,
      changeReason: input.changeReason ?? null,
    },
  });

  await logConfigAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "CREATED",
    definitionKey: input.key,
    metadata: { scope: input.scope, environment },
  });

  return { id: created.id, version: created.currentVersion };
}

export async function deleteConfigurationValue(
  platform: BusinessContext,
  valueId: string,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.SETTINGS_MANAGE);

  const existing = await prisma.configSettingValue.findFirst({
    where: { id: valueId, businessId: platform.business.id },
  });

  if (!existing) {
    throw new Error("Configuration value not found");
  }

  await prisma.configSettingValue.update({
    where: { id: valueId },
    data: { isDeleted: true, changedById: platform.user.id },
  });

  await logConfigAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "DELETED",
    definitionKey: existing.definitionKey,
    metadata: { valueId },
  });
}

export async function rollbackConfigurationValue(
  platform: BusinessContext,
  valueId: string,
  targetVersion: number,
): Promise<{ id: string; version: number }> {
  assertPermission(platform, PERMISSION_CODES.SETTINGS_MANAGE);

  const existing = await prisma.configSettingValue.findFirst({
    where: { id: valueId, businessId: platform.business.id },
  });

  if (!existing) {
    throw new Error("Configuration value not found");
  }

  if (!canRollback(existing.currentVersion)) {
    throw new Error("No previous version available for rollback");
  }

  const versionRecord = await prisma.configSettingVersion.findUnique({
    where: {
      settingValueId_version: {
        settingValueId: valueId,
        version: targetVersion,
      },
    },
  });

  if (!versionRecord) {
    throw new Error(`Version ${targetVersion} not found`);
  }

  const nextVersion = buildNextVersion(existing.currentVersion);

  await prisma.configSettingVersion.create({
    data: {
      settingValueId: existing.id,
      businessId: platform.business.id,
      version: existing.currentVersion,
      previousValue: existing.value as Prisma.InputJsonValue,
      changedById: platform.user.id,
      changeReason: `Rollback to version ${targetVersion}`,
    },
  });

  const updated = await prisma.configSettingValue.update({
    where: { id: valueId },
    data: {
      value: versionRecord.previousValue as Prisma.InputJsonValue,
      currentVersion: nextVersion,
      changedById: platform.user.id,
      changeReason: `Rollback to version ${targetVersion}`,
      isDeleted: false,
    },
  });

  await logConfigAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "RESTORED",
    definitionKey: existing.definitionKey,
    metadata: { valueId, targetVersion, version: nextVersion },
  });

  return { id: updated.id, version: updated.currentVersion };
}

export async function exportConfiguration(
  platform: BusinessContext,
  environment?: ConfigEnvironment,
): Promise<ConfigurationExportPayload> {
  assertPermission(platform, PERMISSION_CODES.SETTINGS_MANAGE);

  const env = normalizeEnvironment(environment);
  const values = await prisma.configSettingValue.findMany({
    where: { businessId: platform.business.id, environment: env, isDeleted: false },
  });

  const payload: ConfigurationExportPayload = {
    exportedAt: new Date().toISOString(),
    businessId: platform.business.id,
    environment: env,
    settings: values.map((value) => ({
      key: value.definitionKey,
      scope: value.scope,
      environment: value.environment,
      scopeIdentifier: value.scopeIdentifier,
      value: value.value,
    })),
  };

  await logConfigAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "EXPORTED",
    metadata: { count: payload.settings.length, environment: env },
  });

  return payload;
}

export async function importConfiguration(
  platform: BusinessContext,
  input: ConfigurationImportInput,
): Promise<{ imported: number }> {
  assertPermission(platform, PERMISSION_CODES.SETTINGS_MANAGE);

  let imported = 0;
  const environment = normalizeEnvironment(input.environment);

  for (const setting of input.settings) {
    await setConfigurationValue(platform, {
      key: setting.key,
      value: setting.value,
      scope: setting.scope,
      environment,
      scopeIdentifier: setting.scopeIdentifier,
      changeReason: input.changeReason ?? "Imported configuration",
    });
    imported += 1;
  }

  await logConfigAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "IMPORTED",
    metadata: { count: imported, environment },
  });

  return { imported };
}

export async function getSettingsEngineDashboard(
  businessId: string,
): Promise<SettingsEngineDashboardMetrics> {
  ensureBootstrapSettingsEngine();

  const [
    totalDefinitions,
    activeDefinitions,
    totalValues,
    scopedOverrides,
    versionCount,
    auditEvents,
  ] = await Promise.all([
    prisma.configSettingDefinition.count(),
    prisma.configSettingDefinition.count({ where: { isActive: true } }),
    prisma.configSettingValue.count({ where: { businessId, isDeleted: false } }),
    prisma.configSettingValue.count({
      where: { businessId, isDeleted: false, scope: { not: "BUSINESS" } },
    }),
    prisma.configSettingVersion.count({ where: { businessId } }),
    prisma.configAuditLog.count({ where: { businessId } }),
  ]);

  const categories = new Set(listSettingDefinitions().map((definition) => definition.category));

  return {
    totalDefinitions,
    activeDefinitions,
    totalValues,
    scopedOverrides,
    versionCount,
    auditEvents,
    categories: categories.size,
    environments: 3,
  };
}

export async function listConfigSettingDefinitions() {
  ensureBootstrapSettingsEngine();
  return prisma.configSettingDefinition.findMany({ orderBy: { key: "asc" } });
}

export async function listConfigSettingValues(businessId: string) {
  return prisma.configSettingValue.findMany({
    where: { businessId },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

export async function listConfigSettingVersions(businessId: string) {
  return prisma.configSettingVersion.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listConfigAuditLogs(businessId: string) {
  return prisma.configAuditLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listRegisteredSettingDefinitions() {
  ensureBootstrapSettingsEngine();
  return listSettingDefinitions();
}

export async function resolveScopePreview(
  platform: BusinessContext,
  key: string,
  scopes: ConfigScope[],
  environment?: ConfigEnvironment,
): Promise<Array<{ scope: ConfigScope; value: unknown }>> {
  assertPermission(platform, PERMISSION_CODES.SETTINGS_VIEW);

  const storedValues = await loadStoredValues(platform.business.id);
  const context = buildConfigurationContext(platform);
  const env = normalizeEnvironment(environment);

  return scopes.map((scope) => {
    const scopeIdentifier = buildScopeIdentifier(scope, context);
    const match = storedValues.find(
      (entry) =>
        entry.key === key &&
        entry.scope === scope &&
        entry.scopeIdentifier === scopeIdentifier &&
        entry.environment === env,
    );

    const definition = getSettingDefinition(key);
    return {
      scope,
      value: match?.value ?? definition?.defaultValue ?? null,
    };
  });
}
