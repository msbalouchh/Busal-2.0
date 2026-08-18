import "server-only";

import {
  BUSAL_COMMERCIAL_PLAN_SLUGS,
  type BusalCommercialPlanSlug,
  getSubscriptionPlanBySlug,
  listSubscriptionPlans,
} from "@/modules/control-center/billing/registry/subscription-plan-registry";

/** Metadata key used to associate Stripe catalog objects with Busal plan slugs. */
export const STRIPE_BUSAL_PLAN_SLUG_METADATA_KEY = "busal_plan_slug";

/** Metadata key used to associate Stripe catalog objects with Busal plan ids. */
export const STRIPE_BUSAL_PLAN_ID_METADATA_KEY = "busal_plan_id";

/** Metadata marker for objects created by Busal OS catalog provisioning. */
export const STRIPE_BUSAL_CATALOG_SOURCE = "busal-os";

export interface BusalStripePlanBinding {
  planSlug: BusalCommercialPlanSlug;
  priceIdEnvKey: string;
  productIdEnvKey: string;
}

/** Environment variable bindings for fixed recurring Busal commercial plans. Enterprise is excluded. */
export const BUSAL_STRIPE_PLAN_BINDINGS: BusalStripePlanBinding[] = [
  {
    planSlug: BUSAL_COMMERCIAL_PLAN_SLUGS.CORE,
    priceIdEnvKey: "STRIPE_PRICE_BUSAL_CORE",
    productIdEnvKey: "STRIPE_PRODUCT_BUSAL_CORE",
  },
  {
    planSlug: BUSAL_COMMERCIAL_PLAN_SLUGS.GROWTH,
    priceIdEnvKey: "STRIPE_PRICE_BUSAL_GROWTH",
    productIdEnvKey: "STRIPE_PRODUCT_BUSAL_GROWTH",
  },
  {
    planSlug: BUSAL_COMMERCIAL_PLAN_SLUGS.PRO,
    priceIdEnvKey: "STRIPE_PRICE_BUSAL_PRO",
    productIdEnvKey: "STRIPE_PRODUCT_BUSAL_PRO",
  },
];

export function listFixedRecurringBusalPlans() {
  return listSubscriptionPlans(false).filter((plan) => !plan.customPricing && plan.mrrPence > 0);
}

export function getBusalStripePlanBinding(planSlug: string): BusalStripePlanBinding | null {
  const normalized = planSlug.toLowerCase();
  return BUSAL_STRIPE_PLAN_BINDINGS.find((binding) => binding.planSlug === normalized) ?? null;
}

export function resolveConfiguredStripePriceId(planSlug: string): string | null {
  const binding = getBusalStripePlanBinding(planSlug);
  if (!binding) {
    return null;
  }
  return process.env[binding.priceIdEnvKey]?.trim() || null;
}

export function resolveConfiguredStripeProductId(planSlug: string): string | null {
  const binding = getBusalStripePlanBinding(planSlug);
  if (!binding) {
    return null;
  }
  return process.env[binding.productIdEnvKey]?.trim() || null;
}

export function assertFixedRecurringPlan(planSlug: BusalCommercialPlanSlug) {
  const plan = getSubscriptionPlanBySlug(planSlug);
  if (!plan) {
    throw new Error(`Busal plan not found: ${planSlug}`);
  }
  if (plan.customPricing) {
    throw new Error(`Plan ${planSlug} uses custom pricing and has no fixed Stripe price`);
  }
  if (plan.mrrPence <= 0) {
    throw new Error(`Plan ${planSlug} has no fixed recurring amount`);
  }
  if (plan.billingCycle !== "monthly") {
    throw new Error(`Plan ${planSlug} is not configured for monthly recurring billing`);
  }
  return plan;
}
