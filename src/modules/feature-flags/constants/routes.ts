export const FEATURE_FLAGS_ROUTES = {
  overview: "/dashboard/feature-flags",
  flags: "/dashboard/feature-flags/flags",
  targeting: "/dashboard/feature-flags/targeting",
  schedules: "/dashboard/feature-flags/schedules",
  evaluations: "/dashboard/feature-flags/evaluations",
  versions: "/dashboard/feature-flags/versions",
  registry: "/dashboard/feature-flags/registry",
  audit: "/dashboard/feature-flags/audit",
} as const;

export const FEATURE_FLAGS_NAV_ITEMS = [
  { label: "Overview", href: FEATURE_FLAGS_ROUTES.overview },
  { label: "Flags", href: FEATURE_FLAGS_ROUTES.flags },
  { label: "Targeting", href: FEATURE_FLAGS_ROUTES.targeting },
  { label: "Schedules", href: FEATURE_FLAGS_ROUTES.schedules },
  { label: "Evaluations", href: FEATURE_FLAGS_ROUTES.evaluations },
  { label: "Versions", href: FEATURE_FLAGS_ROUTES.versions },
  { label: "Registry", href: FEATURE_FLAGS_ROUTES.registry },
  { label: "Audit", href: FEATURE_FLAGS_ROUTES.audit },
] as const;

export const FEATURE_FLAG_TYPES = [
  "BOOLEAN",
  "PERCENTAGE_ROLLOUT",
  "SCHEDULED_ACTIVATION",
  "SCHEDULED_DEACTIVATION",
  "CONDITIONAL",
] as const;

export const FEATURE_FLAG_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "SCHEDULED",
  "ARCHIVED",
  "DEPRECATED",
] as const;

export const FEATURE_FLAG_TARGET_TYPES = [
  "PLATFORM",
  "TENANT",
  "BUSINESS",
  "BRANCH",
  "DEPARTMENT",
  "ROLE",
  "USER",
  "SUBSCRIPTION_PLAN",
  "MARKETPLACE_LICENSE",
  "COUNTRY",
  "REGION",
  "ENVIRONMENT",
] as const;

export const FEATURE_FLAG_CONDITION_TYPES = [
  "DATE",
  "TIME",
  "USER_ATTRIBUTE",
  "BUSINESS_ATTRIBUTE",
  "CUSTOM_METADATA",
  "MODULE",
  "VERSION",
] as const;
