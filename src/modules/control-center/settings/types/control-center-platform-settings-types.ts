import type { ConfigEnvironment, ConfigScope, ConfigValueType } from "@prisma/client";

export interface ControlCenterPlatformSettingsPermissions {
  canView: boolean;
  canEdit: boolean;
  canReset: boolean;
  canExport: boolean;
  canImport: boolean;
  isPlatformOwner: boolean;
}

export interface ControlCenterPlatformSettingField {
  key: string;
  label: string;
  groupId: string;
  category: string;
  valueType: ConfigValueType;
  scope: ConfigScope;
  environment: ConfigEnvironment;
  value: unknown;
  defaultValue: unknown;
  helpText: string | null;
  allowedValues: unknown[] | null;
  minValue: number | null;
  maxValue: number | null;
  regexPattern: string | null;
  isRequired: boolean;
  currentVersion: number;
  updatedAt: string | null;
  validationError: string | null;
}

export interface ControlCenterPlatformSettingsGroup {
  id: string;
  title: string;
  description: string;
  settings: ControlCenterPlatformSettingField[];
}

export interface ControlCenterPlatformSettingHistoryItem {
  id: string;
  version: number;
  previousValue: unknown;
  changedByEmail: string | null;
  changeReason: string | null;
  createdAt: string;
}

export interface ControlCenterPlatformSettingAuditItem {
  id: string;
  eventType: string;
  definitionKey: string | null;
  actorEmail: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ControlCenterPlatformSettingsBundle {
  groups: ControlCenterPlatformSettingsGroup[];
  permissions: ControlCenterPlatformSettingsPermissions;
  audit: ControlCenterPlatformSettingAuditItem[];
  refreshedAt: string;
}

export interface UpdateControlCenterPlatformSettingInput {
  key: string;
  value: unknown;
  changeReason?: string;
}

export interface ResetControlCenterPlatformSettingInput {
  key: string;
  changeReason?: string;
}

export interface ImportControlCenterPlatformSettingsInput {
  settings: Array<{ key: string; value: unknown }>;
  changeReason?: string;
}

export interface ControlCenterPlatformSettingsQuery {
  search?: string;
  groupId?: string | null;
}
