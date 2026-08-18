import {
  BILLING_AI_FEATURE_KEYS,
  BILLING_MODULE_KEYS,
} from "@/modules/billing/constants/feature-access";
import {
  BILLING_CYCLES,
  PLAN_TYPES,
  SUBSCRIPTION_STATUSES,
  TRIAL_DURATION_DAYS,
  type SubscriptionStatus,
} from "@/modules/billing/constants/billing-status";
import type {
  FeatureLimits,
  PlanFeatureAccess,
  SubscriptionPlan,
} from "@/modules/billing/types/billing-platform";
import {
  getSubscriptionPlanById,
  getSubscriptionPlanBySlug,
  listSubscriptionPlans,
  type SubscriptionPlanDefinition,
} from "@/modules/control-center/billing/registry/subscription-plan-registry";
import { SUBSCRIPTION_PLAN_KEYS } from "@/modules/finance/feature-access/constants/subscription-plans";

function mapPlanType(slug: string): SubscriptionPlan["planType"] {
  if (slug.includes("enterprise")) {
    return PLAN_TYPES.ENTERPRISE;
  }
  if (slug.includes("pro") || slug === "professional") {
    return PLAN_TYPES.PROFESSIONAL;
  }
  if (slug.includes("growth")) {
    return PLAN_TYPES.BUSINESS;
  }
  if (slug.includes("trial") || slug === "free") {
    return PLAN_TYPES.FREE;
  }
  return PLAN_TYPES.STARTER;
}

function buildLimitsFromDefinition(definition: SubscriptionPlanDefinition): FeatureLimits {
  return {
    maxStaff: definition.limits.maxUsers,
    maxBranches: definition.limits.maxBranches,
    maxMenuItems: 500,
    maxTables: 200,
    maxReservations: 5000,
    maxOrders: 50000,
    maxStorageMb: Math.round(definition.limits.maxStorageBytes / (1024 * 1024)),
    maxAiCredits: Math.round(definition.limits.maxAiTokensPerMonth / 1000),
    maxApiCalls: definition.limits.maxApiCallsPerMonth,
    maxIntegrations: definition.limits.maxMarketplaceLicenses,
  };
}

function buildFeatureAccess(definition: SubscriptionPlanDefinition): PlanFeatureAccess {
  const modules = definition.features.map((feature) => {
    switch (feature) {
      case "pos":
        return BILLING_MODULE_KEYS.POS;
      case "crm":
        return BILLING_MODULE_KEYS.CRM;
      case "ai":
        return BILLING_MODULE_KEYS.AI_ASSISTANT;
      case "reporting":
        return BILLING_MODULE_KEYS.ANALYTICS;
      default:
        return BILLING_MODULE_KEYS.DASHBOARD;
    }
  });

  return {
    enabledModules: [...new Set(modules)],
    enabledAiFeatures: definition.features.includes("ai")
      ? [BILLING_AI_FEATURE_KEYS.CHAT, BILLING_AI_FEATURE_KEYS.ANALYTICS_INSIGHTS]
      : [BILLING_AI_FEATURE_KEYS.CHAT],
    limits: buildLimitsFromDefinition(definition),
    customLimits: {},
  };
}

export function catalogPlanToSubscriptionPlan(definition: SubscriptionPlanDefinition): SubscriptionPlan {
  const now = new Date().toISOString();
  const yearly = definition.billingCycle === "annual";

  return {
    id: definition.id,
    slug: definition.slug,
    name: definition.name,
    planType: mapPlanType(definition.slug),
    description: definition.description,
    monthlyPriceCents: yearly ? Math.round(definition.mrrPence / 12) : definition.mrrPence,
    yearlyPriceCents: yearly ? definition.mrrPence : definition.mrrPence * 12,
    currency: "GBP",
    featureAccess: buildFeatureAccess(definition),
    isPublic: !definition.archived,
    isActive: !definition.archived,
    trialDays: definition.slug === SUBSCRIPTION_PLAN_KEYS.TRIAL ? TRIAL_DURATION_DAYS : 0,
    sortOrder: definition.sortOrder ?? 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function listCatalogPlans(): SubscriptionPlan[] {
  return listSubscriptionPlans().map(catalogPlanToSubscriptionPlan);
}

export function findCatalogPlanById(planId: string): SubscriptionPlan | undefined {
  const definition = getSubscriptionPlanById(planId);
  return definition ? catalogPlanToSubscriptionPlan(definition) : undefined;
}

export function findCatalogPlanBySlug(slug: string): SubscriptionPlan | undefined {
  const definition = getSubscriptionPlanBySlug(slug);
  return definition ? catalogPlanToSubscriptionPlan(definition) : undefined;
}

export function defaultBillingCycleForPlan(slug: string): typeof BILLING_CYCLES.MONTHLY | typeof BILLING_CYCLES.YEARLY {
  const definition = getSubscriptionPlanBySlug(slug);
  return definition?.billingCycle === "annual" ? BILLING_CYCLES.YEARLY : BILLING_CYCLES.MONTHLY;
}

export function isTrialPlan(slug: string | null | undefined): boolean {
  if (!slug) {
    return false;
  }
  return slug === "free" || slug === "trial" || slug === SUBSCRIPTION_PLAN_KEYS.TRIAL;
}

export function normalizeSubscriptionStatus(status: string): SubscriptionStatus {
  const normalized = status.toLowerCase();
  const values = Object.values(SUBSCRIPTION_STATUSES) as string[];

  if (values.includes(normalized)) {
    return normalized as SubscriptionStatus;
  }

  const upperMap: Record<string, SubscriptionStatus> = {
    PENDING_ACTIVATION: SUBSCRIPTION_STATUSES.PENDING_ACTIVATION,
    ACTIVE: SUBSCRIPTION_STATUSES.ACTIVE,
    TRIAL: SUBSCRIPTION_STATUSES.TRIALING,
    TRIALING: SUBSCRIPTION_STATUSES.TRIALING,
    PAUSED: SUBSCRIPTION_STATUSES.PAUSED,
    PAST_DUE: SUBSCRIPTION_STATUSES.PAST_DUE,
    CANCELLED: SUBSCRIPTION_STATUSES.CANCELLED,
    CANCELED: SUBSCRIPTION_STATUSES.CANCELLED,
    EXPIRED: SUBSCRIPTION_STATUSES.EXPIRED,
  };

  return upperMap[status.toUpperCase()] ?? SUBSCRIPTION_STATUSES.ACTIVE;
}
