import {
  FEATURE_LIMIT_KEYS,
  UNLIMITED_LIMIT,
  type BillingAiFeatureKey,
  type BillingModuleKey,
  type FeatureLimitKey,
} from "@/modules/billing/constants/feature-access";
import type { FeatureLimits, PlanFeatureAccess } from "@/modules/billing/types/billing-platform";

const LIMIT_KEY_TO_FIELD: Record<FeatureLimitKey, keyof FeatureLimits> = {
  [FEATURE_LIMIT_KEYS.MAX_STAFF]: "maxStaff",
  [FEATURE_LIMIT_KEYS.MAX_BRANCHES]: "maxBranches",
  [FEATURE_LIMIT_KEYS.MAX_MENU_ITEMS]: "maxMenuItems",
  [FEATURE_LIMIT_KEYS.MAX_TABLES]: "maxTables",
  [FEATURE_LIMIT_KEYS.MAX_RESERVATIONS]: "maxReservations",
  [FEATURE_LIMIT_KEYS.MAX_ORDERS]: "maxOrders",
  [FEATURE_LIMIT_KEYS.MAX_STORAGE_MB]: "maxStorageMb",
  [FEATURE_LIMIT_KEYS.MAX_AI_CREDITS]: "maxAiCredits",
  [FEATURE_LIMIT_KEYS.MAX_API_CALLS]: "maxApiCalls",
  [FEATURE_LIMIT_KEYS.MAX_INTEGRATIONS]: "maxIntegrations",
};

export function isModuleEnabled(
  featureAccess: PlanFeatureAccess,
  moduleKey: BillingModuleKey,
): boolean {
  return featureAccess.enabledModules.includes(moduleKey);
}

export function isAiFeatureEnabled(
  featureAccess: PlanFeatureAccess,
  featureKey: BillingAiFeatureKey,
): boolean {
  return featureAccess.enabledAiFeatures.includes(featureKey);
}

export function getLimitValue(featureAccess: PlanFeatureAccess, limitKey: FeatureLimitKey): number {
  const customValue = featureAccess.customLimits[limitKey];
  if (customValue !== undefined) {
    return customValue;
  }

  const field = LIMIT_KEY_TO_FIELD[limitKey];
  return featureAccess.limits[field];
}

export function isUnlimitedLimit(limit: number): boolean {
  return limit === UNLIMITED_LIMIT;
}

export function isWithinLimit(
  featureAccess: PlanFeatureAccess,
  limitKey: FeatureLimitKey,
  currentUsage: number,
): boolean {
  const limit = getLimitValue(featureAccess, limitKey);

  if (isUnlimitedLimit(limit)) {
    return true;
  }

  return currentUsage < limit;
}

export function getEnabledModuleCount(featureAccess: PlanFeatureAccess): number {
  return featureAccess.enabledModules.length;
}

export function getEnabledAiFeatureCount(featureAccess: PlanFeatureAccess): number {
  return featureAccess.enabledAiFeatures.length;
}
