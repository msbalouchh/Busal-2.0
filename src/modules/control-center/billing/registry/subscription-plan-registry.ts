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
  mrrPence: number;
  billingCycle: "monthly" | "annual";
  features: string[];
  limits: SubscriptionPlanLimits;
  marketplaceAccess: boolean;
  archived: boolean;
}

export const DEFAULT_SUBSCRIPTION_PLAN_DEFINITIONS: SubscriptionPlanDefinition[] = [
  {
    id: "plan-free",
    slug: "free",
    name: "Free",
    description: "Starter access for evaluation tenants.",
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
    archived: false,
  },
  {
    id: "plan-starter",
    slug: "starter",
    name: "Starter",
    description: "Core operations for growing businesses.",
    mrrPence: 9900,
    billingCycle: "monthly",
    features: ["pos", "crm", "reporting"],
    limits: {
      maxUsers: 10,
      maxBranches: 2,
      maxStorageBytes: 5_368_709_120,
      maxApiCallsPerMonth: 10_000,
      maxAiTokensPerMonth: 50_000,
      maxMarketplaceLicenses: 2,
    },
    marketplaceAccess: true,
    archived: false,
  },
  {
    id: "plan-growth",
    slug: "growth",
    name: "Growth",
    description: "Advanced automation and AI for scaling teams.",
    mrrPence: 29900,
    billingCycle: "monthly",
    features: ["pos", "crm", "ai", "marketplace", "reporting", "api_gateway"],
    limits: {
      maxUsers: 50,
      maxBranches: 10,
      maxStorageBytes: 26_843_545_600,
      maxApiCallsPerMonth: 100_000,
      maxAiTokensPerMonth: 500_000,
      maxMarketplaceLicenses: 10,
    },
    marketplaceAccess: true,
    archived: false,
  },
  {
    id: "plan-enterprise",
    slug: "enterprise",
    name: "Enterprise",
    description: "Full platform access with elevated limits.",
    mrrPence: 99900,
    billingCycle: "monthly",
    features: ["pos", "crm", "ai", "marketplace", "reporting", "api_gateway"],
    limits: {
      maxUsers: 500,
      maxBranches: 100,
      maxStorageBytes: 107_374_182_400,
      maxApiCallsPerMonth: 1_000_000,
      maxAiTokensPerMonth: 5_000_000,
      maxMarketplaceLicenses: 100,
    },
    marketplaceAccess: true,
    archived: false,
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
  return includeArchived ? plans : plans.filter((plan) => !plan.archived);
}

export function getSubscriptionPlanBySlug(slug: string): SubscriptionPlanDefinition | null {
  return listSubscriptionPlans(true).find((plan) => plan.slug === slug) ?? null;
}

export function getPlanMrrPence(slug: string | null | undefined): number {
  if (!slug) {
    return 0;
  }
  return getSubscriptionPlanBySlug(slug.toLowerCase())?.mrrPence ?? 19900;
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
