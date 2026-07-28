import type {
  LocalizationAuditEventType,
  LocalizationScopeType,
  LocalizationTextDirection,
} from "@prisma/client";

export interface RegisteredTranslationKeyDefinition {
  key: string;
  module: string;
  description?: string;
  defaultValue: string;
  translations?: Record<string, string>;
  isActive: boolean;
}

export interface LanguagePackDefinition {
  languageCode: string;
  translations: Record<string, string>;
}

export interface LocalizationContext {
  languageCode: string;
  fallbackLanguageCode: string;
  direction: LocalizationTextDirection;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  currencyCode: string;
  countryCode: string;
}

export interface UpsertTranslationInput {
  key: string;
  languageCode: string;
  value: string;
  changeReason?: string;
}

export interface ScopeSettingInput {
  scopeType: LocalizationScopeType;
  scopeIdentifier: string;
  languageCode?: string;
  fallbackLanguageCode?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  numberFormat?: string;
  currencyCode?: string;
  countryCode?: string;
}

export interface LocalizationPlatformDashboardMetrics {
  totalLanguages: number;
  activeLanguages: number;
  totalTranslationKeys: number;
  totalTranslations: number;
  totalVersions: number;
  registeredKeys: number;
  userPreferences: number;
  businessSettings: number;
  branchOverrides: number;
}

export interface LanguageView {
  code: string;
  name: string;
  nativeName: string;
  direction: LocalizationTextDirection;
  isActive: boolean;
  isFallback: boolean;
}

export interface TranslationKeyView {
  id: string;
  key: string;
  module: string;
  defaultValue: string;
  currentVersion: number;
  isActive: boolean;
}

export interface TranslationView {
  id: string;
  key: string;
  languageCode: string;
  value: string;
  version: number;
}

export interface TranslationVersionView {
  id: string;
  key: string;
  languageCode: string;
  version: number;
  value: string;
  createdAt: string;
}

export interface ScopeSettingView {
  id: string;
  scopeType: LocalizationScopeType;
  scopeIdentifier: string;
  languageCode: string;
  fallbackLanguageCode: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  currencyCode: string;
  countryCode: string;
}

export interface LocalizationAuditLogView {
  id: string;
  eventType: LocalizationAuditEventType;
  createdAt: string;
}

export interface TranslateResult {
  key: string;
  value: string;
  languageCode: string;
  usedFallback: boolean;
}

export interface LanguagePackLoadResult {
  languageCode: string;
  loadedCount: number;
  keys: string[];
}
