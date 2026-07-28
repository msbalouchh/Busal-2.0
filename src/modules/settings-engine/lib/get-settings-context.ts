import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeConfigAuditLog,
  serializeConfigSettingDefinition,
  serializeConfigSettingValue,
  serializeConfigSettingVersion,
  serializeSettingsEngineDashboard,
} from "@/modules/settings-engine/utils/settings-utils";
import {
  ensureSettingsEngineDefaults,
  getSettingsEngineDashboard,
  listConfigAuditLogs,
  listConfigSettingDefinitions,
  listConfigSettingValues,
  listConfigSettingVersions,
  listRegisteredSettingDefinitions,
} from "@/services/settings-engine.service";

export const getSettingsEngineOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SETTINGS_VIEW });
  await ensureSettingsEngineDefaults(context.business.id);
  const dashboard = await getSettingsEngineDashboard(context.business.id);

  return {
    context,
    dashboard: serializeSettingsEngineDashboard(dashboard),
  };
});

export const getSettingsEngineDefinitionsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SETTINGS_VIEW });
  const definitions = await listConfigSettingDefinitions();

  return {
    context,
    definitions: definitions.map(serializeConfigSettingDefinition),
  };
});

export const getSettingsEngineValuesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SETTINGS_VIEW });
  const values = await listConfigSettingValues(context.business.id);

  return {
    context,
    values: values.map(serializeConfigSettingValue),
  };
});

export const getSettingsEngineVersionsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SETTINGS_VIEW });
  const versions = await listConfigSettingVersions(context.business.id);

  return {
    context,
    versions: versions.map(serializeConfigSettingVersion),
  };
});

export const getSettingsEngineAuditContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SETTINGS_VIEW });
  const auditLogs = await listConfigAuditLogs(context.business.id);

  return {
    context,
    auditLogs: auditLogs.map(serializeConfigAuditLog),
  };
});

export const getSettingsEngineRegistryContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SETTINGS_VIEW });
  const registrations = await listRegisteredSettingDefinitions();

  return {
    context,
    registrations,
  };
});

export const getSettingsEngineScopesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SETTINGS_VIEW });
  const values = await listConfigSettingValues(context.business.id);

  return {
    context,
    values: values.map(serializeConfigSettingValue),
  };
});

export const getSettingsEngineEnvironmentsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.SETTINGS_VIEW });
  const values = await listConfigSettingValues(context.business.id);

  return {
    context,
    values: values.map(serializeConfigSettingValue),
  };
});
