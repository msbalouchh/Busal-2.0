import "server-only";

import type { LocalizationAuditEventType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  evaluatePermission,
  toPermissionEvaluationContext,
} from "@/modules/iam/engine/permission-engine";
import {
  DEFAULT_COUNTRY_CODE,
  DEFAULT_CURRENCY_CODE,
  DEFAULT_DATE_FORMAT,
  DEFAULT_FALLBACK_LANGUAGE,
  DEFAULT_NUMBER_FORMAT,
  DEFAULT_TIME_FORMAT,
  DEFAULT_TIMEZONE,
  SUPPORTED_LANGUAGE_CODES,
} from "@/modules/localization-platform/constants/routes";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatTime,
} from "@/modules/localization-platform/engine/formatting-engine";
import {
  isRtlLanguage,
  resolveEffectiveLanguage,
  resolveTextDirection,
} from "@/modules/localization-platform/engine/locale-engine";
import { resolveTranslationValue } from "@/modules/localization-platform/engine/translation-engine";
import { buildNextTranslationVersion } from "@/modules/localization-platform/engine/version-engine";
import { ensureBootstrapLocalizationPlatform } from "@/modules/localization-platform/plugins/bootstrap-localization-platform";
import {
  listTranslationKeyDefinitions,
  registerTranslationKeyDefinition,
} from "@/modules/localization-platform/registry/translation-key-registry";
import type {
  LanguagePackDefinition,
  LanguagePackLoadResult,
  LocalizationContext,
  LocalizationPlatformDashboardMetrics,
  RegisteredTranslationKeyDefinition,
  ScopeSettingInput,
  TranslateResult,
  UpsertTranslationInput,
} from "@/modules/localization-platform/types/localization-platform-types";

const LANGUAGE_SEED = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    direction: "LTR" as const,
    isFallback: true,
  },
  {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    direction: "RTL" as const,
    isFallback: false,
  },
  { code: "ur", name: "Urdu", nativeName: "اردو", direction: "RTL" as const, isFallback: false },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    direction: "LTR" as const,
    isFallback: false,
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    direction: "LTR" as const,
    isFallback: false,
  },
];

function assertPermission(platform: BusinessContext, permission: string): void {
  const context = toPermissionEvaluationContext({
    permissions: platform.permissions,
    roleSlug: platform.roleSlug ?? null,
    isOwner: platform.isOwner,
    businessId: platform.business.id,
    branchId: platform.branchId,
  });

  if (!evaluatePermission(context, permission)) {
    throw new Error(`Permission denied: ${permission} required`);
  }
}

async function logLocalizationAudit(input: {
  businessId?: string | null;
  userId?: string | null;
  eventType: LocalizationAuditEventType;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.localizationPlatformAuditLog.create({
    data: {
      businessId: input.businessId ?? null,
      userId: input.userId ?? null,
      eventType: input.eventType,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

async function syncTranslationKeyToDatabase(
  businessId: string,
  definition: RegisteredTranslationKeyDefinition,
): Promise<string> {
  const record = await prisma.localizationTranslationKey.upsert({
    where: {
      businessId_key: {
        businessId,
        key: definition.key,
      },
    },
    create: {
      businessId,
      key: definition.key,
      module: definition.module,
      description: definition.description ?? "",
      defaultValue: definition.defaultValue,
      isActive: definition.isActive,
    },
    update: {
      module: definition.module,
      defaultValue: definition.defaultValue,
      isActive: definition.isActive,
    },
  });

  if (definition.translations) {
    for (const [languageCode, value] of Object.entries(definition.translations)) {
      await upsertTranslationRecord(
        businessId,
        record.id,
        languageCode,
        value,
        record.currentVersion,
      );
    }
  }

  await upsertTranslationRecord(
    businessId,
    record.id,
    "en",
    definition.defaultValue,
    record.currentVersion,
  );

  return record.id;
}

async function upsertTranslationRecord(
  businessId: string,
  keyId: string,
  languageCode: string,
  value: string,
  version: number,
): Promise<void> {
  await prisma.localizationTranslation.upsert({
    where: {
      businessId_keyId_languageCode: {
        businessId,
        keyId,
        languageCode,
      },
    },
    create: {
      businessId,
      keyId,
      languageCode,
      value,
      version,
    },
    update: {
      value,
      version,
    },
  });
}

export async function ensureLocalizationPlatformDefaults(businessId: string): Promise<void> {
  ensureBootstrapLocalizationPlatform();

  for (const language of LANGUAGE_SEED) {
    await prisma.localizationLanguage.upsert({
      where: { code: language.code },
      create: language,
      update: {
        name: language.name,
        nativeName: language.nativeName,
        direction: language.direction,
        isFallback: language.isFallback,
      },
    });
  }

  for (const definition of listTranslationKeyDefinitions()) {
    await syncTranslationKeyToDatabase(businessId, definition);
  }

  await prisma.localizationScopeSetting.upsert({
    where: {
      businessId_scopeType_scopeIdentifier: {
        businessId,
        scopeType: "BUSINESS",
        scopeIdentifier: businessId,
      },
    },
    create: {
      businessId,
      scopeType: "BUSINESS",
      scopeIdentifier: businessId,
      languageCode: DEFAULT_FALLBACK_LANGUAGE,
      fallbackLanguageCode: DEFAULT_FALLBACK_LANGUAGE,
      timezone: DEFAULT_TIMEZONE,
      dateFormat: DEFAULT_DATE_FORMAT,
      timeFormat: DEFAULT_TIME_FORMAT,
      numberFormat: DEFAULT_NUMBER_FORMAT,
      currencyCode: DEFAULT_CURRENCY_CODE,
      countryCode: DEFAULT_COUNTRY_CODE,
    },
    update: {},
  });
}

export async function registerModuleTranslationKey(
  businessId: string,
  definition: RegisteredTranslationKeyDefinition,
): Promise<void> {
  ensureBootstrapLocalizationPlatform();
  registerTranslationKeyDefinition(definition);
  await syncTranslationKeyToDatabase(businessId, definition);

  await logLocalizationAudit({
    businessId,
    eventType: "KEY_REGISTERED",
    metadata: { key: definition.key, module: definition.module },
  });
}

export async function loadLanguagePack(
  platform: BusinessContext,
  pack: LanguagePackDefinition,
): Promise<LanguagePackLoadResult> {
  assertPermission(platform, PERMISSION_CODES.LOCALIZATION_PLATFORM_MANAGE);

  const loadedKeys: string[] = [];

  for (const [key, value] of Object.entries(pack.translations)) {
    const keyRecord = await prisma.localizationTranslationKey.findFirst({
      where: { businessId: platform.business.id, key },
    });

    if (!keyRecord) {
      continue;
    }

    await upsertTranslationRecord(
      platform.business.id,
      keyRecord.id,
      pack.languageCode,
      value,
      keyRecord.currentVersion,
    );
    loadedKeys.push(key);
  }

  await logLocalizationAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "PACK_LOADED",
    metadata: { languageCode: pack.languageCode, count: loadedKeys.length },
  });

  return {
    languageCode: pack.languageCode,
    loadedCount: loadedKeys.length,
    keys: loadedKeys,
  };
}

export async function upsertTranslation(
  platform: BusinessContext,
  input: UpsertTranslationInput,
): Promise<{ id: string; version: number }> {
  assertPermission(platform, PERMISSION_CODES.LOCALIZATION_PLATFORM_MANAGE);

  const keyRecord = await prisma.localizationTranslationKey.findFirst({
    where: { businessId: platform.business.id, key: input.key },
  });

  if (!keyRecord) {
    throw new Error(`Translation key not found: ${input.key}`);
  }

  const nextVersion = buildNextTranslationVersion(keyRecord.currentVersion);

  const translation = await prisma.localizationTranslation.upsert({
    where: {
      businessId_keyId_languageCode: {
        businessId: platform.business.id,
        keyId: keyRecord.id,
        languageCode: input.languageCode,
      },
    },
    create: {
      businessId: platform.business.id,
      keyId: keyRecord.id,
      languageCode: input.languageCode,
      value: input.value,
      version: nextVersion,
    },
    update: {
      value: input.value,
      version: nextVersion,
    },
  });

  await prisma.localizationTranslationKey.update({
    where: { id: keyRecord.id },
    data: { currentVersion: nextVersion },
  });

  await prisma.localizationTranslationVersion.create({
    data: {
      businessId: platform.business.id,
      keyId: keyRecord.id,
      languageCode: input.languageCode,
      version: nextVersion,
      value: input.value,
      changeReason: input.changeReason ?? null,
    },
  });

  await logLocalizationAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "TRANSLATION_UPDATED",
    metadata: { key: input.key, languageCode: input.languageCode, version: nextVersion },
  });

  await logLocalizationAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "VERSION_PUBLISHED",
    metadata: { key: input.key, version: nextVersion },
  });

  return { id: translation.id, version: nextVersion };
}

export async function translate(
  platform: BusinessContext,
  key: string,
  languageCode?: string,
): Promise<TranslateResult> {
  const context = await resolveLocalizationContext(platform);

  const keyRecord = await prisma.localizationTranslationKey.findFirst({
    where: { businessId: platform.business.id, key },
  });

  if (!keyRecord) {
    return {
      key,
      value: key,
      languageCode: languageCode ?? context.languageCode,
      usedFallback: true,
    };
  }

  const translations = await prisma.localizationTranslation.findMany({
    where: { businessId: platform.business.id, keyId: keyRecord.id },
  });

  const map: Record<string, string> = {};
  for (const entry of translations) {
    map[entry.languageCode] = entry.value;
  }

  const resolved = resolveTranslationValue({
    key,
    languageCode: languageCode ?? context.languageCode,
    fallbackLanguageCode: context.fallbackLanguageCode,
    translations: map,
    defaultValue: keyRecord.defaultValue,
  });

  return {
    key,
    value: resolved.value,
    languageCode: languageCode ?? context.languageCode,
    usedFallback: resolved.usedFallback,
  };
}

export async function resolveLocalizationContext(
  platform: BusinessContext,
): Promise<LocalizationContext> {
  const [userSetting, businessSetting, branchSetting] = await Promise.all([
    prisma.localizationScopeSetting.findFirst({
      where: {
        businessId: platform.business.id,
        scopeType: "USER",
        scopeIdentifier: platform.user.id,
      },
    }),
    prisma.localizationScopeSetting.findFirst({
      where: {
        businessId: platform.business.id,
        scopeType: "BUSINESS",
        scopeIdentifier: platform.business.id,
      },
    }),
    platform.branchId
      ? prisma.localizationScopeSetting.findFirst({
          where: {
            businessId: platform.business.id,
            scopeType: "BRANCH",
            scopeIdentifier: platform.branchId,
          },
        })
      : null,
  ]);

  const languageCode = resolveEffectiveLanguage({
    userLanguage: userSetting?.languageCode,
    businessLanguage: businessSetting?.languageCode,
    branchLanguage: branchSetting?.languageCode,
    fallbackLanguage: businessSetting?.fallbackLanguageCode ?? DEFAULT_FALLBACK_LANGUAGE,
  });

  const regionalBase = branchSetting ?? businessSetting;

  return {
    languageCode,
    fallbackLanguageCode:
      regionalBase?.fallbackLanguageCode ??
      businessSetting?.fallbackLanguageCode ??
      DEFAULT_FALLBACK_LANGUAGE,
    direction: resolveTextDirection(languageCode),
    timezone: regionalBase?.timezone ?? platform.business.timezone ?? DEFAULT_TIMEZONE,
    dateFormat: regionalBase?.dateFormat ?? DEFAULT_DATE_FORMAT,
    timeFormat: regionalBase?.timeFormat ?? DEFAULT_TIME_FORMAT,
    numberFormat: regionalBase?.numberFormat ?? DEFAULT_NUMBER_FORMAT,
    currencyCode: regionalBase?.currencyCode ?? DEFAULT_CURRENCY_CODE,
    countryCode: regionalBase?.countryCode ?? DEFAULT_COUNTRY_CODE,
  };
}

export async function setUserLanguagePreference(
  platform: BusinessContext,
  languageCode: string,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.LOCALIZATION_PLATFORM_MANAGE);

  await prisma.localizationScopeSetting.upsert({
    where: {
      businessId_scopeType_scopeIdentifier: {
        businessId: platform.business.id,
        scopeType: "USER",
        scopeIdentifier: platform.user.id,
      },
    },
    create: {
      businessId: platform.business.id,
      scopeType: "USER",
      scopeIdentifier: platform.user.id,
      languageCode,
      fallbackLanguageCode: DEFAULT_FALLBACK_LANGUAGE,
    },
    update: { languageCode },
  });

  await logLocalizationAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "PREFERENCE_UPDATED",
    metadata: { scopeType: "USER", languageCode },
  });
}

export async function setBusinessLanguage(
  platform: BusinessContext,
  languageCode: string,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.LOCALIZATION_PLATFORM_MANAGE);

  await prisma.localizationScopeSetting.upsert({
    where: {
      businessId_scopeType_scopeIdentifier: {
        businessId: platform.business.id,
        scopeType: "BUSINESS",
        scopeIdentifier: platform.business.id,
      },
    },
    create: {
      businessId: platform.business.id,
      scopeType: "BUSINESS",
      scopeIdentifier: platform.business.id,
      languageCode,
      fallbackLanguageCode: DEFAULT_FALLBACK_LANGUAGE,
    },
    update: { languageCode },
  });

  await logLocalizationAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "PREFERENCE_UPDATED",
    metadata: { scopeType: "BUSINESS", languageCode },
  });
}

export async function setBranchLanguageOverride(
  platform: BusinessContext,
  branchId: string,
  languageCode: string,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.LOCALIZATION_PLATFORM_MANAGE);

  await prisma.localizationScopeSetting.upsert({
    where: {
      businessId_scopeType_scopeIdentifier: {
        businessId: platform.business.id,
        scopeType: "BRANCH",
        scopeIdentifier: branchId,
      },
    },
    create: {
      businessId: platform.business.id,
      scopeType: "BRANCH",
      scopeIdentifier: branchId,
      languageCode,
      fallbackLanguageCode: DEFAULT_FALLBACK_LANGUAGE,
    },
    update: { languageCode },
  });

  await logLocalizationAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "PREFERENCE_UPDATED",
    metadata: { scopeType: "BRANCH", branchId, languageCode },
  });
}

export async function upsertScopeSetting(
  platform: BusinessContext,
  input: ScopeSettingInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.LOCALIZATION_PLATFORM_MANAGE);

  const setting = await prisma.localizationScopeSetting.upsert({
    where: {
      businessId_scopeType_scopeIdentifier: {
        businessId: platform.business.id,
        scopeType: input.scopeType,
        scopeIdentifier: input.scopeIdentifier,
      },
    },
    create: {
      businessId: platform.business.id,
      scopeType: input.scopeType,
      scopeIdentifier: input.scopeIdentifier,
      languageCode: input.languageCode ?? DEFAULT_FALLBACK_LANGUAGE,
      fallbackLanguageCode: input.fallbackLanguageCode ?? DEFAULT_FALLBACK_LANGUAGE,
      timezone: input.timezone ?? DEFAULT_TIMEZONE,
      dateFormat: input.dateFormat ?? DEFAULT_DATE_FORMAT,
      timeFormat: input.timeFormat ?? DEFAULT_TIME_FORMAT,
      numberFormat: input.numberFormat ?? DEFAULT_NUMBER_FORMAT,
      currencyCode: input.currencyCode ?? DEFAULT_CURRENCY_CODE,
      countryCode: input.countryCode ?? DEFAULT_COUNTRY_CODE,
    },
    update: {
      languageCode: input.languageCode,
      fallbackLanguageCode: input.fallbackLanguageCode,
      timezone: input.timezone,
      dateFormat: input.dateFormat,
      timeFormat: input.timeFormat,
      numberFormat: input.numberFormat,
      currencyCode: input.currencyCode,
      countryCode: input.countryCode,
    },
  });

  return { id: setting.id };
}

export function formatLocalizedValues(
  context: LocalizationContext,
  sampleDate: Date,
  amount: number,
) {
  return {
    date: formatDate(sampleDate, context.numberFormat, context.dateFormat),
    time: formatTime(sampleDate, context.numberFormat, context.timeFormat),
    number: formatNumber(amount, context.numberFormat),
    currency: formatCurrency(amount, context.numberFormat, context.currencyCode),
    direction: context.direction,
    isRtl: isRtlLanguage(context.languageCode),
  };
}

export async function logLocalizationDashboardAccess(
  platform: BusinessContext,
  dashboard: string,
): Promise<void> {
  await logLocalizationAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "DASHBOARD_ACCESS",
    metadata: { dashboard },
  });
}

export async function getLocalizationPlatformDashboard(
  businessId: string,
): Promise<LocalizationPlatformDashboardMetrics> {
  ensureBootstrapLocalizationPlatform();

  const [languages, keys, translations, versions, scopeSettings] = await Promise.all([
    prisma.localizationLanguage.findMany(),
    prisma.localizationTranslationKey.findMany({ where: { businessId } }),
    prisma.localizationTranslation.findMany({ where: { businessId } }),
    prisma.localizationTranslationVersion.findMany({ where: { businessId } }),
    prisma.localizationScopeSetting.findMany({ where: { businessId } }),
  ]);

  return {
    totalLanguages: languages.length,
    activeLanguages: languages.filter((lang) => lang.isActive).length,
    totalTranslationKeys: keys.length,
    totalTranslations: translations.length,
    totalVersions: versions.length,
    registeredKeys: listTranslationKeyDefinitions().length,
    userPreferences: scopeSettings.filter((s) => s.scopeType === "USER").length,
    businessSettings: scopeSettings.filter((s) => s.scopeType === "BUSINESS").length,
    branchOverrides: scopeSettings.filter((s) => s.scopeType === "BRANCH").length,
  };
}

export async function listLocalizationLanguages() {
  return prisma.localizationLanguage.findMany({ orderBy: { code: "asc" } });
}

export async function listLocalizationTranslationKeys(businessId: string) {
  return prisma.localizationTranslationKey.findMany({
    where: { businessId },
    orderBy: { key: "asc" },
  });
}

export async function listLocalizationTranslations(businessId: string) {
  return prisma.localizationTranslation.findMany({
    where: { businessId },
    include: { key: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

export async function listLocalizationTranslationVersions(businessId: string) {
  return prisma.localizationTranslationVersion.findMany({
    where: { businessId },
    include: { key: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listLocalizationScopeSettings(businessId: string) {
  return prisma.localizationScopeSetting.findMany({ where: { businessId } });
}

export async function listLocalizationPlatformAuditLogs(businessId: string) {
  return prisma.localizationPlatformAuditLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listRegisteredTranslationKeys() {
  ensureBootstrapLocalizationPlatform();
  return listTranslationKeyDefinitions();
}

export async function getLocalizationApiPayload(businessId: string, languageCode: string) {
  const keys = await prisma.localizationTranslationKey.findMany({ where: { businessId } });
  const translations = await prisma.localizationTranslation.findMany({
    where: { businessId, languageCode },
    include: { key: true },
  });

  const payload: Record<string, string> = {};
  for (const key of keys) {
    payload[key.key] = key.defaultValue;
  }
  for (const translation of translations) {
    if (translation.key) {
      payload[translation.key.key] = translation.value;
    }
  }

  return {
    languageCode,
    translations: payload,
    supportedLanguages: SUPPORTED_LANGUAGE_CODES,
  };
}

export { isRtlLanguage, resolveTextDirection };
