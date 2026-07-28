export const SETTINGS_ENGINE_ROUTES = {
  overview: "/dashboard/settings",
  definitions: "/dashboard/settings/definitions",
  values: "/dashboard/settings/values",
  scopes: "/dashboard/settings/scopes",
  environments: "/dashboard/settings/environments",
  versions: "/dashboard/settings/versions",
  registry: "/dashboard/settings/registry",
  audit: "/dashboard/settings/audit",
} as const;

export const SETTINGS_ENGINE_NAV_ITEMS = [
  { label: "Overview", href: SETTINGS_ENGINE_ROUTES.overview },
  { label: "Definitions", href: SETTINGS_ENGINE_ROUTES.definitions },
  { label: "Values", href: SETTINGS_ENGINE_ROUTES.values },
  { label: "Scopes", href: SETTINGS_ENGINE_ROUTES.scopes },
  { label: "Environments", href: SETTINGS_ENGINE_ROUTES.environments },
  { label: "Versions", href: SETTINGS_ENGINE_ROUTES.versions },
  { label: "Registry", href: SETTINGS_ENGINE_ROUTES.registry },
  { label: "Audit", href: SETTINGS_ENGINE_ROUTES.audit },
] as const;

export const CONFIG_SCOPES = [
  "PLATFORM",
  "TENANT",
  "BUSINESS",
  "BRANCH",
  "DEPARTMENT",
  "ROLE",
  "USER",
  "MODULE",
] as const;

export const CONFIG_VALUE_TYPES = [
  "STRING",
  "NUMBER",
  "BOOLEAN",
  "DATE",
  "TIME",
  "JSON",
  "ENUM",
  "ARRAY",
  "SECRET",
] as const;

export const CONFIG_ENVIRONMENTS = ["DEVELOPMENT", "STAGING", "PRODUCTION"] as const;

export const CONFIG_CATEGORIES = [
  "general",
  "business",
  "branding",
  "localization",
  "currency",
  "timezone",
  "tax",
  "notifications",
  "communication",
  "security",
  "ai",
  "marketplace",
  "pos",
  "restaurant",
  "crm",
  "inventory",
  "reporting",
  "integrations",
] as const;

export const SCOPE_PRIORITY: Record<(typeof CONFIG_SCOPES)[number], number> = {
  PLATFORM: 0,
  TENANT: 1,
  BUSINESS: 2,
  BRANCH: 3,
  DEPARTMENT: 4,
  ROLE: 5,
  USER: 6,
  MODULE: 7,
};
