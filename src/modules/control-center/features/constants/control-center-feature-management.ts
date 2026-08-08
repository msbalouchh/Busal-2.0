import { CONTROL_CENTER_ROUTES } from "@/modules/control-center/constants/routes";

export const CONTROL_CENTER_FEATURE_MANAGEMENT_ROUTES = {
  hub: CONTROL_CENTER_ROUTES.features,
} as const;

export const FEATURE_MANAGEMENT_PAGE_SIZE = 15;

export const FEATURE_SCOPES = [
  "global",
  "plan",
  "tenant",
  "business",
  "workspace",
] as const;

export const FEATURE_CATEGORIES = [
  "standard",
  "beta",
  "experimental",
  "emergency",
] as const;

export const FEATURE_STATUS_OPTIONS = [
  "DRAFT",
  "ACTIVE",
  "SCHEDULED",
  "ARCHIVED",
  "DEPRECATED",
] as const;

export const FEATURE_FLAG_TYPE_OPTIONS = [
  "BOOLEAN",
  "PERCENTAGE_ROLLOUT",
  "SCHEDULED_ACTIVATION",
  "SCHEDULED_DEACTIVATION",
  "CONDITIONAL",
] as const;

export const FEATURE_TARGET_TYPE_OPTIONS = [
  "PLATFORM",
  "TENANT",
  "BUSINESS",
  "SUBSCRIPTION_PLAN",
  "ENVIRONMENT",
] as const;
