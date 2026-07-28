import type {
  LocalizationLanguage,
  LocalizationPlatformAuditLog,
  LocalizationScopeSetting,
  LocalizationTranslation,
  LocalizationTranslationKey,
  LocalizationTranslationVersion,
} from "@prisma/client";

import type {
  LanguageView,
  LocalizationAuditLogView,
  LocalizationPlatformDashboardMetrics,
  ScopeSettingView,
  TranslationKeyView,
  TranslationVersionView,
  TranslationView,
} from "@/modules/localization-platform/types/localization-platform-types";

export function serializeLanguage(language: LocalizationLanguage): LanguageView {
  return {
    code: language.code,
    name: language.name,
    nativeName: language.nativeName,
    direction: language.direction,
    isActive: language.isActive,
    isFallback: language.isFallback,
  };
}

export function serializeTranslationKey(key: LocalizationTranslationKey): TranslationKeyView {
  return {
    id: key.id,
    key: key.key,
    module: key.module,
    defaultValue: key.defaultValue,
    currentVersion: key.currentVersion,
    isActive: key.isActive,
  };
}

export function serializeTranslation(
  translation: LocalizationTranslation & { key?: LocalizationTranslationKey },
): TranslationView {
  return {
    id: translation.id,
    key: translation.key?.key ?? "",
    languageCode: translation.languageCode,
    value: translation.value,
    version: translation.version,
  };
}

export function serializeTranslationVersion(
  version: LocalizationTranslationVersion & { key?: LocalizationTranslationKey },
): TranslationVersionView {
  return {
    id: version.id,
    key: version.key?.key ?? "",
    languageCode: version.languageCode,
    version: version.version,
    value: version.value,
    createdAt: version.createdAt.toISOString(),
  };
}

export function serializeScopeSetting(setting: LocalizationScopeSetting): ScopeSettingView {
  return {
    id: setting.id,
    scopeType: setting.scopeType,
    scopeIdentifier: setting.scopeIdentifier,
    languageCode: setting.languageCode,
    fallbackLanguageCode: setting.fallbackLanguageCode,
    timezone: setting.timezone,
    dateFormat: setting.dateFormat,
    timeFormat: setting.timeFormat,
    numberFormat: setting.numberFormat,
    currencyCode: setting.currencyCode,
    countryCode: setting.countryCode,
  };
}

export function serializeLocalizationAuditLog(
  log: LocalizationPlatformAuditLog,
): LocalizationAuditLogView {
  return {
    id: log.id,
    eventType: log.eventType,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeLocalizationPlatformDashboard(
  metrics: LocalizationPlatformDashboardMetrics,
): LocalizationPlatformDashboardMetrics {
  return metrics;
}

export type LocalizationPlatformDashboardView = LocalizationPlatformDashboardMetrics;
