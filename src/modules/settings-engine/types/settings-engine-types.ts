import type { ConfigEnvironment, ConfigScope, ConfigValueType } from "@prisma/client";

export interface SettingDefinitionInput {
  key: string;
  module: string;
  category: string;
  valueType: ConfigValueType;
  defaultValue: unknown;
  isRequired?: boolean;
  validationRules?: Record<string, unknown>;
  allowedValues?: unknown[];
  minValue?: number;
  maxValue?: number;
  regexPattern?: string;
  helpText?: string;
  supportedScopes?: ConfigScope[];
}

export interface RegisteredSettingDefinition extends SettingDefinitionInput {
  isActive: boolean;
}

export interface ConfigurationContext {
  businessId?: string | null;
  branchId?: string | null;
  department?: string | null;
  roleSlug?: string | null;
  userId?: string | null;
  moduleKey?: string | null;
}

export interface GetConfigurationOptions {
  environment?: ConfigEnvironment;
  context?: ConfigurationContext;
}

export interface ResolvedConfiguration {
  key: string;
  value: unknown;
  scope: ConfigScope;
  environment: ConfigEnvironment;
  source: "default" | "override";
  definition: RegisteredSettingDefinition;
}

export interface SetConfigurationInput {
  key: string;
  value: unknown;
  scope: ConfigScope;
  environment?: ConfigEnvironment;
  scopeIdentifier?: string;
  branchId?: string | null;
  department?: string | null;
  roleSlug?: string | null;
  moduleKey?: string | null;
  changeReason?: string;
}

export interface ConfigurationExportPayload {
  exportedAt: string;
  businessId: string;
  environment: ConfigEnvironment;
  settings: Array<{
    key: string;
    scope: ConfigScope;
    environment: ConfigEnvironment;
    scopeIdentifier: string;
    value: unknown;
  }>;
}

export interface ConfigurationImportInput {
  environment?: ConfigEnvironment;
  settings: Array<{
    key: string;
    scope: ConfigScope;
    scopeIdentifier: string;
    value: unknown;
  }>;
  changeReason?: string;
}

export interface SettingsEngineDashboardMetrics {
  totalDefinitions: number;
  activeDefinitions: number;
  totalValues: number;
  scopedOverrides: number;
  versionCount: number;
  auditEvents: number;
  categories: number;
  environments: number;
}

export interface ConfigSettingDefinitionView {
  key: string;
  module: string;
  category: string;
  valueType: ConfigValueType;
  defaultValue: unknown;
  isRequired: boolean;
  helpText: string | null;
}

export interface ConfigSettingValueView {
  id: string;
  definitionKey: string;
  scope: ConfigScope;
  environment: ConfigEnvironment;
  scopeIdentifier: string;
  value: unknown;
  currentVersion: number;
  isDeleted: boolean;
  updatedAt: string;
}

export interface ConfigSettingVersionView {
  id: string;
  settingValueId: string;
  version: number;
  previousValue: unknown;
  changeReason: string | null;
  createdAt: string;
}

export interface ConfigAuditLogView {
  id: string;
  eventType: string;
  definitionKey: string | null;
  createdAt: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
