export const LOCALIZATION_PLATFORM_ROUTES = {
  overview: "/dashboard/localization-platform",
  languages: "/dashboard/localization-platform/languages",
  translations: "/dashboard/localization-platform/translations",
  preferences: "/dashboard/localization-platform/preferences",
  formatting: "/dashboard/localization-platform/formatting",
  versions: "/dashboard/localization-platform/versions",
  registry: "/dashboard/localization-platform/registry",
  audit: "/dashboard/localization-platform/audit",
} as const;

export const LOCALIZATION_PLATFORM_NAV_ITEMS = [
  { label: "Overview", href: LOCALIZATION_PLATFORM_ROUTES.overview },
  { label: "Languages", href: LOCALIZATION_PLATFORM_ROUTES.languages },
  { label: "Translations", href: LOCALIZATION_PLATFORM_ROUTES.translations },
  { label: "Preferences", href: LOCALIZATION_PLATFORM_ROUTES.preferences },
  { label: "Formatting", href: LOCALIZATION_PLATFORM_ROUTES.formatting },
  { label: "Versions", href: LOCALIZATION_PLATFORM_ROUTES.versions },
  { label: "Registry", href: LOCALIZATION_PLATFORM_ROUTES.registry },
  { label: "Audit", href: LOCALIZATION_PLATFORM_ROUTES.audit },
] as const;

export const SUPPORTED_LANGUAGE_CODES = ["en", "ar", "ur", "fr", "es"] as const;

export const RTL_LANGUAGE_CODES = ["ar", "ur"] as const;

export const DEFAULT_FALLBACK_LANGUAGE = "en";

export const DEFAULT_TIMEZONE = "UTC";

export const DEFAULT_DATE_FORMAT = "yyyy-MM-dd";

export const DEFAULT_TIME_FORMAT = "HH:mm";

export const DEFAULT_NUMBER_FORMAT = "en-US";

export const DEFAULT_CURRENCY_CODE = "USD";

export const DEFAULT_COUNTRY_CODE = "US";
