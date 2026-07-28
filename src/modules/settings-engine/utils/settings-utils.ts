import type {
  ConfigAuditLog,
  ConfigSettingDefinition,
  ConfigSettingValue,
  ConfigSettingVersion,
} from "@prisma/client";

import type {
  ConfigAuditLogView,
  ConfigSettingDefinitionView,
  ConfigSettingValueView,
  ConfigSettingVersionView,
  SettingsEngineDashboardMetrics,
} from "@/modules/settings-engine/types/settings-engine-types";

export function serializeConfigSettingDefinition(
  definition:
    | ConfigSettingDefinition
    | {
        key: string;
        module: string;
        category: string;
        valueType: ConfigSettingDefinition["valueType"];
        defaultValue: unknown;
        isRequired: boolean;
        helpText?: string | null;
      },
): ConfigSettingDefinitionView {
  return {
    key: definition.key,
    module: definition.module,
    category: definition.category,
    valueType: definition.valueType,
    defaultValue: definition.defaultValue,
    isRequired: definition.isRequired,
    helpText: definition.helpText ?? null,
  };
}

export function serializeConfigSettingValue(record: ConfigSettingValue): ConfigSettingValueView {
  return {
    id: record.id,
    definitionKey: record.definitionKey,
    scope: record.scope,
    environment: record.environment,
    scopeIdentifier: record.scopeIdentifier,
    value: record.value,
    currentVersion: record.currentVersion,
    isDeleted: record.isDeleted,
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function serializeConfigSettingVersion(
  version: ConfigSettingVersion,
): ConfigSettingVersionView {
  return {
    id: version.id,
    settingValueId: version.settingValueId,
    version: version.version,
    previousValue: version.previousValue,
    changeReason: version.changeReason,
    createdAt: version.createdAt.toISOString(),
  };
}

export function serializeConfigAuditLog(log: ConfigAuditLog): ConfigAuditLogView {
  return {
    id: log.id,
    eventType: log.eventType,
    definitionKey: log.definitionKey,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeSettingsEngineDashboard(
  metrics: SettingsEngineDashboardMetrics,
): SettingsEngineDashboardMetrics {
  return metrics;
}

export type SettingsEngineDashboardView = SettingsEngineDashboardMetrics;
