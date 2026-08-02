import { CONTROL_CENTER_ROUTES } from "@/modules/control-center/constants/routes";

export const CONTROL_CENTER_PLATFORM_ADMIN_ROUTES = {
  overview: CONTROL_CENTER_ROUTES.settings,
  settings: CONTROL_CENTER_ROUTES.settings,
  featureFlags: CONTROL_CENTER_ROUTES.featureFlags,
  releases: CONTROL_CENTER_ROUTES.releases,
  maintenance: CONTROL_CENTER_ROUTES.maintenance,
  staff: CONTROL_CENTER_ROUTES.staff,
  audit: CONTROL_CENTER_ROUTES.audit,
  analytics: CONTROL_CENTER_ROUTES.analytics,
} as const;

export const CONTROL_CENTER_PLATFORM_ADMIN_PAGE_SIZE = 25;

export const PLATFORM_SETTING_GROUPS = [
  {
    id: "general",
    title: "General",
    keys: ["general.business_name", "localization.locale", "localization.timezone"],
  },
  {
    id: "regional",
    title: "Regional",
    keys: ["currency.default"],
  },
  {
    id: "notifications",
    title: "Notifications",
    keys: ["notifications.email_enabled"],
  },
  {
    id: "security",
    title: "Security Defaults",
    keys: ["security.mfa_required"],
  },
  {
    id: "ai",
    title: "AI Defaults",
    keys: ["ai.default_model"],
  },
  {
    id: "platform",
    title: "Platform",
    keys: [
      "platform.maintenance_mode",
      "platform.maintenance_message",
      "platform.maintenance_scheduled_at",
      "platform.current_version",
    ],
  },
] as const;

export const FEATURE_FLAG_STATUS_OPTIONS = [
  "DRAFT",
  "ACTIVE",
  "SCHEDULED",
  "ARCHIVED",
  "DEPRECATED",
] as const;

export const RELEASE_ROLLOUT_STATUS_OPTIONS = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "ROLLED_BACK",
  "FAILED",
] as const;

export const PLATFORM_ENVIRONMENTS = ["development", "staging", "production"] as const;

export const PLATFORM_MAINTENANCE_MODES = ["NONE", "READ_ONLY", "FULL_LOCK", "SCHEDULED"] as const;

export const AUDIT_EVENT_CATEGORIES = [
  "configuration",
  "feature_flag",
  "release",
  "security",
  "maintenance",
  "system",
] as const;

export const PLATFORM_RELEASE_RECORD_TYPE = "platform_release";
