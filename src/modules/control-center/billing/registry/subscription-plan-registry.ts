export interface SubscriptionPlanLimits {
  maxUsers: number;
  maxBranches: number;
  maxStorageBytes: number;
  maxApiCallsPerMonth: number;
  maxAiTokensPerMonth: number;
  maxMarketplaceLicenses: number;
}

export interface SubscriptionPlanDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Monthly recurring price in pence. Use 0 when `customPricing` is true. */
  mrrPence: number;
  billingCycle: "monthly" | "annual";
  features: string[];
  limits: SubscriptionPlanLimits;
  marketplaceAccess: boolean;
  archived: boolean;
  /** When true, price is negotiated — not listed on public surfaces. */
  customPricing?: boolean;
  sortOrder?: number;
}

/** Official Busal commercial plan slugs (authoritative). */
export const BUSAL_COMMERCIAL_PLAN_SLUGS = {
  CORE: "busal-core",
  GROWTH: "busal-growth",
  PRO: "busal-pro",
  ENTERPRISE: "busal-enterprise",
} as const;

export type BusalCommercialPlanSlug =
  (typeof BUSAL_COMMERCIAL_PLAN_SLUGS)[keyof typeof BUSAL_COMMERCIAL_PLAN_SLUGS];

const STARTER_LIMITS: SubscriptionPlanLimits = {
  maxUsers: 10,
  maxBranches: 2,
  maxStorageBytes: 5_368_709_120,
  maxApiCallsPerMonth: 10_000,
  maxAiTokensPerMonth: 50_000,
  maxMarketplaceLicenses: 2,
};

const GROWTH_LIMITS: SubscriptionPlanLimits = {
  maxUsers: 50,
  maxBranches: 10,
  maxStorageBytes: 26_843_545_600,
  maxApiCallsPerMonth: 100_000,
  maxAiTokensPerMonth: 500_000,
  maxMarketplaceLicenses: 10,
};

const ENTERPRISE_LIMITS: SubscriptionPlanLimits = {
  maxUsers: 500,
  maxBranches: 100,
  maxStorageBytes: 107_374_182_400,
  maxApiCallsPerMonth: 1_000_000,
  maxAiTokensPerMonth: 5_000_000,
  maxMarketplaceLicenses: 100,
};

/** Authoritative Busal commercial catalog + archived legacy definitions for existing tenants. */
export const DEFAULT_SUBSCRIPTION_PLAN_DEFINITIONS: SubscriptionPlanDefinition[] = [
  {
    id: "plan-busal-core",
    slug: BUSAL_COMMERCIAL_PLAN_SLUGS.CORE,
    name: "Busal Core",
    description: "Core operations for single-location and growing businesses.",
    mrrPence: 29_900,
    billingCycle: "monthly",
    features: ["pos", "crm", "reporting"],
    limits: STARTER_LIMITS,
    marketplaceAccess: true,
    archived: false,
    sortOrder: 1,
  },
  {
    id: "plan-busal-growth",
    slug: BUSAL_COMMERCIAL_PLAN_SLUGS.GROWTH,
    name: "Busal Growth",
    description: "Advanced automation and AI for scaling teams.",
    mrrPence: 39_900,
    billingCycle: "monthly",
    features: ["pos", "crm", "ai", "marketplace", "reporting", "api_gateway"],
    limits: GROWTH_LIMITS,
    marketplaceAccess: true,
    archived: false,
    sortOrder: 2,
  },
  {
    id: "plan-busal-pro",
    slug: BUSAL_COMMERCIAL_PLAN_SLUGS.PRO,
    name: "Busal Pro",
    description: "Full platform access with elevated limits for advanced operators.",
    mrrPence: 49_900,
    billingCycle: "monthly",
    features: ["pos", "crm", "ai", "marketplace", "reporting", "api_gateway"],
    limits: ENTERPRISE_LIMITS,
    marketplaceAccess: true,
    archived: false,
    sortOrder: 3,
  },
  {
    id: "plan-busal-enterprise",
    slug: BUSAL_COMMERCIAL_PLAN_SLUGS.ENTERPRISE,
    name: "Busal Enterprise",
    description: "Custom pricing, SLAs, and operator-assigned commercial terms.",
    mrrPence: 0,
    billingCycle: "monthly",
    features: ["pos", "crm", "ai", "marketplace", "reporting", "api_gateway"],
    limits: ENTERPRISE_LIMITS,
    marketplaceAccess: true,
    archived: false,
    customPricing: true,
    sortOrder: 4,
  },
  {
    id: "plan-free",
    slug: "free",
    name: "Free",
    description: "Legacy evaluation tier (archived).",
    mrrPence: 0,
    billingCycle: "monthly",
    features: ["pos", "crm"],
    limits: {
      maxUsers: 3,
      maxBranches: 1,
      maxStorageBytes: 1_073_741_824,
      maxApiCallsPerMonth: 1_000,
      maxAiTokensPerMonth: 0,
      maxMarketplaceLicenses: 0,
    },
    marketplaceAccess: false,
    archived: true,
  },
  {
    id: "plan-starter",
    slug: "starter",
    name: "Starter",
    description: "Legacy starter tier (archived).",
    mrrPence: 9900,
    billingCycle: "monthly",
    features: ["pos", "crm", "reporting"],
    limits: STARTER_LIMITS,
    marketplaceAccess: true,
    archived: true,
  },
  {
    id: "plan-growth",
    slug: "growth",
    name: "Growth",
    description: "Legacy growth tier (archived).",
    mrrPence: 29_900,
    billingCycle: "monthly",
    features: ["pos", "crm", "ai", "marketplace", "reporting", "api_gateway"],
    limits: GROWTH_LIMITS,
    marketplaceAccess: true,
    archived: true,
  },
  {
    id: "plan-enterprise",
    slug: "enterprise",
    name: "Enterprise",
    description: "Legacy enterprise tier (archived).",
    mrrPence: 99_900,
    billingCycle: "monthly",
    features: ["pos", "crm", "ai", "marketplace", "reporting", "api_gateway"],
    limits: ENTERPRISE_LIMITS,
    marketplaceAccess: true,
    archived: true,
  },
  {
    id: "plan-professional",
    slug: "professional",
    name: "Professional",
    description: "Legacy professional tier (archived).",
    mrrPence: 34_900,
    billingCycle: "monthly",
    features: ["pos", "crm", "ai", "marketplace", "reporting", "api_gateway"],
    limits: GROWTH_LIMITS,
    marketplaceAccess: true,
    archived: true,
  },
];

const pluginPlans: SubscriptionPlanDefinition[] = [];

export function registerSubscriptionPlan(plan: SubscriptionPlanDefinition): void {
  const index = pluginPlans.findIndex((entry) => entry.slug === plan.slug);
  if (index >= 0) {
    pluginPlans[index] = plan;
    return;
  }
  pluginPlans.push(plan);
}

export function listSubscriptionPlans(includeArchived = false): SubscriptionPlanDefinition[] {
  const plans = [...DEFAULT_SUBSCRIPTION_PLAN_DEFINITIONS, ...pluginPlans];
  const filtered = includeArchived ? plans : plans.filter((plan) => !plan.archived);
  return filtered.sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
}

export function getSubscriptionPlanBySlug(slug: string): SubscriptionPlanDefinition | null {
  const normalized = slug.toLowerCase();
  return listSubscriptionPlans(true).find((plan) => plan.slug === normalized) ?? null;
}

export function getSubscriptionPlanById(planId: string): SubscriptionPlanDefinition | null {
  const normalized = planId.toLowerCase();
  return (
    listSubscriptionPlans(true).find(
      (plan) => plan.id === normalized || plan.slug === normalized,
    ) ?? null
  );
}

export function getPlanMrrPence(slug: string | null | undefined): number {
  if (!slug) {
    return 0;
  }
  const plan = getSubscriptionPlanBySlug(slug.toLowerCase());
  if (!plan) {
    return 29_900;
  }
  if (plan.customPricing) {
    return 0;
  }
  return plan.mrrPence;
}

export function ensureBootstrapSubscriptionPlans(): void {
  for (const plan of DEFAULT_SUBSCRIPTION_PLAN_DEFINITIONS) {
    if (!getSubscriptionPlanBySlug(plan.slug)) {
      registerSubscriptionPlan(plan);
    }
  }
}

export function upsertSubscriptionPlan(
  input: Omit<SubscriptionPlanDefinition, "id"> & { id?: string },
): SubscriptionPlanDefinition {
  const existing = getSubscriptionPlanBySlug(input.slug);
  const plan: SubscriptionPlanDefinition = {
    id: input.id ?? existing?.id ?? `plan-${input.slug}`,
    ...input,
  };
  registerSubscriptionPlan(plan);
  return plan;
}

export function archiveSubscriptionPlan(slug: string): SubscriptionPlanDefinition | null {
  const plan = getSubscriptionPlanBySlug(slug);
  if (!plan) {
    return null;
  }
  const archived = { ...plan, archived: true };
  registerSubscriptionPlan(archived);
  return archived;
}

export function duplicateSubscriptionPlan(
  slug: string,
  newSlug: string,
): SubscriptionPlanDefinition {
  const source = getSubscriptionPlanBySlug(slug);
  if (!source) {
    throw new Error("Plan not found");
  }
  return upsertSubscriptionPlan({
    ...source,
    id: `plan-${newSlug}`,
    slug: newSlug,
    name: `${source.name} Copy`,
    archived: false,
  });
}
