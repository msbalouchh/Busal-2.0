import "server-only";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import { getControlCenterOperatorEmails } from "@/modules/control-center/lib/resolve-control-center-authorization";
import { buildOperatorPlatformContext } from "@/modules/control-center/platform-admin/lib/build-operator-platform-context";
import { PLATFORM_SETTINGS_GROUPS } from "@/modules/control-center/settings/constants/control-center-platform-settings";
import {
  ensurePlatformSettingsDefinitions,
  loadPlatformSettingFields,
  loadPlatformSettingHistory,
  loadPlatformSettingsAudit,
  loadPlatformSettingsExportPayload,
  logPlatformSettingsSecurityAudit,
  validatePlatformSettingValue,
} from "@/modules/control-center/settings/repository/control-center-platform-settings.repository";
import type {
  ControlCenterPlatformSettingAuditItem,
  ControlCenterPlatformSettingHistoryItem,
  ControlCenterPlatformSettingsBundle,
  ControlCenterPlatformSettingsPermissions,
  ControlCenterPlatformSettingsQuery,
  ImportControlCenterPlatformSettingsInput,
  ResetControlCenterPlatformSettingInput,
  UpdateControlCenterPlatformSettingInput,
} from "@/modules/control-center/settings/types/control-center-platform-settings-types";
import { loadOperatorRegistry } from "@/modules/control-center/operators/repository/control-center-operator.repository";
import type { ControlCenterOperatorContext } from "@/modules/control-center/types/control-center-types";
import { getSettingDefinition } from "@/modules/settings-engine/registry/settings-registry";
import { setConfigurationValue } from "@/services/settings-engine.service";

async function resolveIsPlatformOwner(actor: ControlCenterOperatorContext): Promise<boolean> {
  const registry = await loadOperatorRegistry();
  const record = registry.find((entry) => entry.userId === actor.userId);
  if (record?.role === "PLATFORM_OWNER") return true;

  if (registry.some((entry) => entry.role === "PLATFORM_OWNER")) {
    return false;
  }

  return getControlCenterOperatorEmails().includes(actor.email.trim().toLowerCase());
}

function buildPermissions(
  operator: ControlCenterOperatorContext,
  isPlatformOwner: boolean,
): ControlCenterPlatformSettingsPermissions {
  const permissions = new Set(operator.permissions);
  const hasAdmin = permissions.has(PERMISSION_CODES.CONTROL_CENTER_ADMIN);
  const canView =
    hasAdmin ||
    hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_SETTINGS) ||
    hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_VIEW);

  return {
    canView,
    canEdit: isPlatformOwner,
    canReset: isPlatformOwner,
    canExport: canView,
    canImport: isPlatformOwner,
    isPlatformOwner,
  };
}

function filterSettings(
  query: ControlCenterPlatformSettingsQuery,
  bundle: ControlCenterPlatformSettingsBundle,
): ControlCenterPlatformSettingsBundle {
  const search = query.search?.trim().toLowerCase();
  const groupId = query.groupId;

  const groups = bundle.groups
    .filter((group) => !groupId || group.id === groupId)
    .map((group) => ({
      ...group,
      settings: group.settings.filter((setting) => {
        if (!search) return true;
        return (
          setting.key.toLowerCase().includes(search) ||
          setting.label.toLowerCase().includes(search) ||
          (setting.helpText?.toLowerCase().includes(search) ?? false)
        );
      }),
    }))
    .filter((group) => group.settings.length > 0 || (!search && !groupId));

  return { ...bundle, groups };
}

export async function getControlCenterPlatformSettingsBundle(
  operator: ControlCenterOperatorContext,
  query: ControlCenterPlatformSettingsQuery = {},
): Promise<ControlCenterPlatformSettingsBundle> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);

  if (!permissions.canView) {
    throw new Error("Permission denied");
  }

  await ensurePlatformSettingsDefinitions();
  const fields = await loadPlatformSettingFields();
  const auditRows = await loadPlatformSettingsAudit();

  const groups = PLATFORM_SETTINGS_GROUPS.map((group) => ({
    id: group.id,
    title: group.title,
    description: group.description,
    settings: fields.filter((field) => (group.keys as readonly string[]).includes(field.key)),
  }));

  const audit: ControlCenterPlatformSettingAuditItem[] = auditRows.map((row) => ({
    id: row.id,
    eventType: row.eventType,
    definitionKey: row.definitionKey,
    actorEmail: row.user?.email ?? null,
    metadata: row.metadata as Record<string, unknown> | null,
    createdAt: row.createdAt.toISOString(),
  }));

  const bundle: ControlCenterPlatformSettingsBundle = {
    groups,
    permissions,
    audit,
    refreshedAt: new Date().toISOString(),
  };

  return filterSettings(query, bundle);
}

export async function updateControlCenterPlatformSetting(
  operator: ControlCenterOperatorContext,
  input: UpdateControlCenterPlatformSettingInput,
): Promise<void> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);

  if (!permissions.canEdit) {
    throw new Error("Permission denied: only Platform Owner may modify settings");
  }

  const validationError = validatePlatformSettingValue(input.key, input.value);
  if (validationError) {
    throw new Error(validationError);
  }

  await ensurePlatformSettingsDefinitions();
  const platform = await buildOperatorPlatformContext(operator);

  await setConfigurationValue(platform, {
    key: input.key,
    value: input.value,
    scope: "PLATFORM",
    environment: "PRODUCTION",
    scopeIdentifier: "platform",
    changeReason: input.changeReason ?? "Updated from Control Center Platform Settings",
  });

  await logPlatformSettingsSecurityAudit({
    actorUserId: operator.userId,
    eventType: "PERMISSION_CHANGED",
    metadata: {
      action: "platform_setting_updated",
      key: input.key,
      changeReason: input.changeReason ?? null,
    },
  });
}

export async function resetControlCenterPlatformSetting(
  operator: ControlCenterOperatorContext,
  input: ResetControlCenterPlatformSettingInput,
): Promise<void> {
  const definition = getSettingDefinition(input.key);
  if (!definition) {
    throw new Error("Unknown setting key");
  }

  await updateControlCenterPlatformSetting(operator, {
    key: input.key,
    value: definition.defaultValue,
    changeReason: input.changeReason ?? "Reset to default",
  });

  await logPlatformSettingsSecurityAudit({
    actorUserId: operator.userId,
    eventType: "PERMISSION_CHANGED",
    metadata: {
      action: "platform_setting_reset",
      key: input.key,
    },
  });
}

export async function getControlCenterPlatformSettingHistory(
  operator: ControlCenterOperatorContext,
  key: string,
): Promise<ControlCenterPlatformSettingHistoryItem[]> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);

  if (!permissions.canView) {
    throw new Error("Permission denied");
  }

  const rows = await loadPlatformSettingHistory(key);

  return rows.map((row) => ({
    id: row.id,
    version: row.version,
    previousValue: row.previousValue,
    changedByEmail: row.changedBy?.email ?? null,
    changeReason: row.changeReason,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function exportControlCenterPlatformSettings(
  operator: ControlCenterOperatorContext,
): Promise<string> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);

  if (!permissions.canExport) {
    throw new Error("Permission denied");
  }

  const payload = await loadPlatformSettingsExportPayload();

  await logPlatformSettingsSecurityAudit({
    actorUserId: operator.userId,
    eventType: "PERMISSION_CHANGED",
    metadata: {
      action: "platform_settings_exported",
      count: payload.settings.length,
    },
  });

  return JSON.stringify(payload, null, 2);
}

export async function importControlCenterPlatformSettings(
  operator: ControlCenterOperatorContext,
  input: ImportControlCenterPlatformSettingsInput,
): Promise<{ imported: number }> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);

  if (!permissions.canImport) {
    throw new Error("Permission denied: only Platform Owner may import settings");
  }

  let imported = 0;

  for (const setting of input.settings) {
    await updateControlCenterPlatformSetting(operator, {
      key: setting.key,
      value: setting.value,
      changeReason: input.changeReason ?? "Imported platform configuration",
    });
    imported += 1;
  }

  await logPlatformSettingsSecurityAudit({
    actorUserId: operator.userId,
    eventType: "PERMISSION_CHANGED",
    metadata: {
      action: "platform_settings_imported",
      count: imported,
    },
  });

  return { imported };
}
