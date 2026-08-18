import {
  ALL_PLATFORM_MODULE_KEYS,
  PLATFORM_MODULE_KEYS,
  type PlatformModuleKey,
} from "@/modules/finance/feature-access/constants/feature-registry";

/** Supported subscription plan slugs. */
export const SUBSCRIPTION_PLAN_KEYS = {
  FREE_TRIAL: "free_trial",
  TRIAL: "trial",
  BUSAL_CORE: "busal-core",
  BUSAL_GROWTH: "busal-growth",
  BUSAL_PRO: "busal-pro",
  BUSAL_ENTERPRISE: "busal-enterprise",
  STARTER: "starter",
  GROWTH: "growth",
  PROFESSIONAL: "professional",
  ENTERPRISE: "enterprise",
  CUSTOM_ENTERPRISE: "custom_enterprise",
} as const;

export type SubscriptionPlanKey = (typeof SUBSCRIPTION_PLAN_KEYS)[keyof typeof SUBSCRIPTION_PLAN_KEYS];

export const SUBSCRIPTION_PLAN_LABELS: Record<SubscriptionPlanKey, string> = {
  free_trial: "Free Trial",
  trial: "Free Trial",
  "busal-core": "Busal Core",
  "busal-growth": "Busal Growth",
  "busal-pro": "Busal Pro",
  "busal-enterprise": "Busal Enterprise",
  starter: "Starter",
  growth: "Growth",
  professional: "Professional",
  enterprise: "Enterprise",
  custom_enterprise: "Custom Enterprise",
};

const STARTER_MODULES: PlatformModuleKey[] = [
  PLATFORM_MODULE_KEYS.CRM,
  PLATFORM_MODULE_KEYS.MENU,
  PLATFORM_MODULE_KEYS.TABLES,
  PLATFORM_MODULE_KEYS.RESERVATIONS,
  PLATFORM_MODULE_KEYS.ORDERS,
  PLATFORM_MODULE_KEYS.QR_MENU,
  PLATFORM_MODULE_KEYS.NOTIFICATIONS,
];

const GROWTH_MODULES: PlatformModuleKey[] = [
  ...STARTER_MODULES,
  PLATFORM_MODULE_KEYS.KITCHEN,
  PLATFORM_MODULE_KEYS.POS,
  PLATFORM_MODULE_KEYS.STAFF,
  PLATFORM_MODULE_KEYS.DELIVERY,
];

const PROFESSIONAL_MODULES: PlatformModuleKey[] = [
  ...GROWTH_MODULES,
  PLATFORM_MODULE_KEYS.INVENTORY,
  PLATFORM_MODULE_KEYS.FINANCE,
  PLATFORM_MODULE_KEYS.ANALYTICS,
  PLATFORM_MODULE_KEYS.LOYALTY,
  PLATFORM_MODULE_KEYS.MARKETING,
  PLATFORM_MODULE_KEYS.AI,
];

const TRIAL_MODULES: PlatformModuleKey[] = [
  PLATFORM_MODULE_KEYS.CRM,
  PLATFORM_MODULE_KEYS.MENU,
  PLATFORM_MODULE_KEYS.RESERVATIONS,
  PLATFORM_MODULE_KEYS.ORDERS,
  PLATFORM_MODULE_KEYS.NOTIFICATIONS,
];

/** Default module entitlements per plan (billing can reuse). */
export const PLAN_MODULE_ENTITLEMENTS: Record<SubscriptionPlanKey, PlatformModuleKey[]> = {
  free_trial: TRIAL_MODULES,
  trial: TRIAL_MODULES,
  "busal-core": STARTER_MODULES,
  "busal-growth": GROWTH_MODULES,
  "busal-pro": PROFESSIONAL_MODULES,
  "busal-enterprise": ALL_PLATFORM_MODULE_KEYS,
  starter: STARTER_MODULES,
  growth: GROWTH_MODULES,
  professional: PROFESSIONAL_MODULES,
  enterprise: ALL_PLATFORM_MODULE_KEYS,
  custom_enterprise: [],
};

export const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["ACTIVE", "TRIAL", "TRIALING"]);
