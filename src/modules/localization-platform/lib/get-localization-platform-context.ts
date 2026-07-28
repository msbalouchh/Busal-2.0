import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeLanguage,
  serializeLocalizationAuditLog,
  serializeLocalizationPlatformDashboard,
  serializeScopeSetting,
  serializeTranslation,
  serializeTranslationKey,
  serializeTranslationVersion,
} from "@/modules/localization-platform/utils/localization-platform-utils";
import {
  ensureLocalizationPlatformDefaults,
  formatLocalizedValues,
  getLocalizationPlatformDashboard,
  listLocalizationLanguages,
  listLocalizationPlatformAuditLogs,
  listLocalizationScopeSettings,
  listLocalizationTranslationKeys,
  listLocalizationTranslations,
  listLocalizationTranslationVersions,
  listRegisteredTranslationKeys,
  logLocalizationDashboardAccess,
  resolveLocalizationContext,
} from "@/services/localization-platform.service";

export const getLocalizationPlatformOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.LOCALIZATION_PLATFORM_VIEW });
  await ensureLocalizationPlatformDefaults(context.business.id);
  await logLocalizationDashboardAccess(context, "overview");
  const dashboard = await getLocalizationPlatformDashboard(context.business.id);

  return {
    context,
    dashboard: serializeLocalizationPlatformDashboard(dashboard),
  };
});

export const getLocalizationPlatformLanguagesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.LOCALIZATION_PLATFORM_VIEW });
  const languages = await listLocalizationLanguages();

  return {
    context,
    languages: languages.map(serializeLanguage),
  };
});

export const getLocalizationPlatformTranslationsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.LOCALIZATION_PLATFORM_VIEW });
  const [keys, translations] = await Promise.all([
    listLocalizationTranslationKeys(context.business.id),
    listLocalizationTranslations(context.business.id),
  ]);

  return {
    context,
    keys: keys.map(serializeTranslationKey),
    translations: translations.map(serializeTranslation),
  };
});

export const getLocalizationPlatformPreferencesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.LOCALIZATION_PLATFORM_VIEW });
  const settings = await listLocalizationScopeSettings(context.business.id);

  return {
    context,
    settings: settings.map(serializeScopeSetting),
  };
});

export const getLocalizationPlatformFormattingContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.LOCALIZATION_PLATFORM_VIEW });
  const localeContext = await resolveLocalizationContext(context);
  const formatted = formatLocalizedValues(localeContext, new Date(), 1234.56);

  return {
    context,
    localeContext,
    formatted,
  };
});

export const getLocalizationPlatformVersionsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.LOCALIZATION_PLATFORM_VIEW });
  const versions = await listLocalizationTranslationVersions(context.business.id);

  return {
    context,
    versions: versions.map(serializeTranslationVersion),
  };
});

export const getLocalizationPlatformRegistryContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.LOCALIZATION_PLATFORM_VIEW });
  const registrations = await listRegisteredTranslationKeys();

  return {
    context,
    registrations,
  };
});

export const getLocalizationPlatformAuditContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.LOCALIZATION_PLATFORM_VIEW });
  const auditLogs = await listLocalizationPlatformAuditLogs(context.business.id);

  return {
    context,
    auditLogs: auditLogs.map(serializeLocalizationAuditLog),
  };
});
