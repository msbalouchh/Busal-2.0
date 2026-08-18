import "server-only";

import type Stripe from "stripe";

import { getStripeClient, getStripeMode, isStripeConfigured } from "@/lib/stripe";
import {
  BUSAL_COMMERCIAL_PLAN_SLUGS,
  type SubscriptionPlanDefinition,
  getSubscriptionPlanBySlug,
} from "@/modules/control-center/billing/registry/subscription-plan-registry";
import {
  BUSAL_STRIPE_PLAN_BINDINGS,
  STRIPE_BUSAL_CATALOG_SOURCE,
  STRIPE_BUSAL_PLAN_ID_METADATA_KEY,
  STRIPE_BUSAL_PLAN_SLUG_METADATA_KEY,
  assertFixedRecurringPlan,
  getBusalStripePlanBinding,
  listFixedRecurringBusalPlans,
  resolveConfiguredStripePriceId,
  resolveConfiguredStripeProductId,
} from "@/modules/commercial-foundation/lib/stripe-catalog.config";

export interface ResolvedBusalStripePlan {
  planSlug: string;
  planId: string;
  planName: string;
  mrrPence: number;
  currency: "GBP";
  billingInterval: "month";
  customPricing: boolean;
  configuredPriceId: string | null;
  configuredProductId: string | null;
}

export interface StripeCatalogPriceMatch {
  priceId: string;
  productId: string;
  unitAmount: number;
  currency: string;
  interval: string | null;
  active: boolean;
  exactAmountMatch: boolean;
}

export interface StripeCatalogPlanAudit {
  planSlug: string;
  planName: string;
  expectedMrrPence: number;
  customPricing: boolean;
  configuredPriceId: string | null;
  configuredProductId: string | null;
  stripeProductMatches: Array<{ productId: string; name: string }>;
  stripePriceMatches: StripeCatalogPriceMatch[];
  amountMismatch: boolean;
  status: "configured" | "missing_env" | "custom" | "stripe_unavailable" | "amount_mismatch";
  notes: string[];
}

export interface StripeCatalogProvisionResult {
  mode: ReturnType<typeof getStripeMode>;
  provisioned: boolean;
  plans: Array<{
    planSlug: string;
    productId: string;
    priceId: string;
    reusedProduct: boolean;
    reusedPrice: boolean;
    priceIdEnvKey: string;
    productIdEnvKey: string;
  }>;
  warnings: string[];
}

function isCatalogProvisioningAllowed(): boolean {
  return (
    isStripeConfigured() &&
    getStripeMode() === "test" &&
    process.env.STRIPE_ALLOW_CATALOG_PROVISIONING === "true"
  );
}

export function resolveBusalStripePlan(planSlug: string): ResolvedBusalStripePlan | null {
  const plan = getSubscriptionPlanBySlug(planSlug);
  if (!plan) {
    return null;
  }

  return {
    planSlug: plan.slug,
    planId: plan.id,
    planName: plan.name,
    mrrPence: plan.mrrPence,
    currency: "GBP",
    billingInterval: "month",
    customPricing: Boolean(plan.customPricing),
    configuredPriceId: resolveConfiguredStripePriceId(plan.slug),
    configuredProductId: resolveConfiguredStripeProductId(plan.slug),
  };
}

export function listResolvedBusalStripePlans(): ResolvedBusalStripePlan[] {
  return listFixedRecurringBusalPlans().map((plan) => ({
    planSlug: plan.slug,
    planId: plan.id,
    planName: plan.name,
    mrrPence: plan.mrrPence,
    currency: "GBP" as const,
    billingInterval: "month" as const,
    customPricing: false,
    configuredPriceId: resolveConfiguredStripePriceId(plan.slug),
    configuredProductId: resolveConfiguredStripeProductId(plan.slug),
  }));
}

async function searchStripeProductsByPlanSlug(
  stripe: Stripe,
  planSlug: string,
): Promise<Stripe.Product[]> {
  try {
    const result = await stripe.products.search({
      query: `metadata['${STRIPE_BUSAL_PLAN_SLUG_METADATA_KEY}']:'${planSlug}'`,
      limit: 20,
    });
    return result.data;
  } catch {
    const listed = await stripe.products.list({ limit: 100, active: true });
    return listed.data.filter(
      (product) => product.metadata[STRIPE_BUSAL_PLAN_SLUG_METADATA_KEY] === planSlug,
    );
  }
}

async function listMonthlyGbpPricesForProduct(
  stripe: Stripe,
  productId: string,
): Promise<Stripe.Price[]> {
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  });

  return prices.data.filter(
    (price) => price.currency === "gbp" && price.recurring?.interval === "month",
  );
}

function toPriceMatch(price: Stripe.Price, expectedMrrPence: number): StripeCatalogPriceMatch {
  return {
    priceId: price.id,
    productId: typeof price.product === "string" ? price.product : price.product.id,
    unitAmount: price.unit_amount ?? 0,
    currency: price.currency,
    interval: price.recurring?.interval ?? null,
    active: price.active,
    exactAmountMatch: price.unit_amount === expectedMrrPence,
  };
}

export async function auditStripeCatalogPlan(planSlug: string): Promise<StripeCatalogPlanAudit> {
  const plan = getSubscriptionPlanBySlug(planSlug);
  if (!plan) {
    throw new Error(`Plan not found: ${planSlug}`);
  }

  const configuredPriceId = resolveConfiguredStripePriceId(plan.slug);
  const configuredProductId = resolveConfiguredStripeProductId(plan.slug);
  const notes: string[] = [];

  if (plan.customPricing) {
    return {
      planSlug: plan.slug,
      planName: plan.name,
      expectedMrrPence: 0,
      customPricing: true,
      configuredPriceId,
      configuredProductId,
      stripeProductMatches: [],
      stripePriceMatches: [],
      amountMismatch: false,
      status: "custom",
      notes: ["Enterprise/custom pricing has no fixed Stripe recurring price."],
    };
  }

  if (!isStripeConfigured()) {
    return {
      planSlug: plan.slug,
      planName: plan.name,
      expectedMrrPence: plan.mrrPence,
      customPricing: false,
      configuredPriceId,
      configuredProductId,
      stripeProductMatches: [],
      stripePriceMatches: [],
      amountMismatch: false,
      status: "stripe_unavailable",
      notes: ["STRIPE_SECRET_KEY is not configured."],
    };
  }

  const stripe = getStripeClient();
  const stripeProductMatches = (await searchStripeProductsByPlanSlug(stripe, plan.slug)).map(
    (product) => ({ productId: product.id, name: product.name }),
  );

  const stripePriceMatches: StripeCatalogPriceMatch[] = [];
  for (const product of stripeProductMatches) {
    const prices = await listMonthlyGbpPricesForProduct(stripe, product.productId);
    stripePriceMatches.push(...prices.map((price) => toPriceMatch(price, plan.mrrPence)));
  }

  if (configuredPriceId) {
    try {
      const configuredPrice = await stripe.prices.retrieve(configuredPriceId);
      stripePriceMatches.push(toPriceMatch(configuredPrice, plan.mrrPence));
    } catch {
      notes.push(`Configured price ID ${configuredPriceId} could not be retrieved from Stripe.`);
    }
  }

  const exactMatches = stripePriceMatches.filter((price) => price.exactAmountMatch);
  const amountMismatch = stripePriceMatches.length > 0 && exactMatches.length === 0;

  if (amountMismatch) {
    notes.push(
      "Existing Stripe monthly GBP prices were found but none match the Busal registry amount. Existing prices were not modified.",
    );
  }

  let status: StripeCatalogPlanAudit["status"] = "missing_env";
  if (configuredPriceId && exactMatches.some((price) => price.priceId === configuredPriceId)) {
    status = "configured";
  } else if (exactMatches.length > 0) {
    status = "configured";
    notes.push("Matching Stripe price exists but is not yet mapped in environment variables.");
  } else if (amountMismatch) {
    status = "amount_mismatch";
  }

  if (!configuredPriceId) {
    notes.push("Set the plan price ID in the corresponding STRIPE_PRICE_* environment variable.");
  }

  return {
    planSlug: plan.slug,
    planName: plan.name,
    expectedMrrPence: plan.mrrPence,
    customPricing: false,
    configuredPriceId,
    configuredProductId,
    stripeProductMatches,
    stripePriceMatches,
    amountMismatch,
    status,
    notes,
  };
}

export async function auditBusalStripeCatalog(): Promise<StripeCatalogPlanAudit[]> {
  const slugs = [
    BUSAL_COMMERCIAL_PLAN_SLUGS.CORE,
    BUSAL_COMMERCIAL_PLAN_SLUGS.GROWTH,
    BUSAL_COMMERCIAL_PLAN_SLUGS.PRO,
    BUSAL_COMMERCIAL_PLAN_SLUGS.ENTERPRISE,
  ];

  return Promise.all(slugs.map((slug) => auditStripeCatalogPlan(slug)));
}

async function findOrCreateProduct(
  stripe: Stripe,
  plan: SubscriptionPlanDefinition,
): Promise<{ productId: string; reused: boolean }> {
  const existingProducts = await searchStripeProductsByPlanSlug(stripe, plan.slug);
  if (existingProducts.length > 0) {
    return { productId: existingProducts[0]!.id, reused: true };
  }

  const product = await stripe.products.create({
    name: plan.name,
    description: plan.description,
    metadata: {
      [STRIPE_BUSAL_PLAN_SLUG_METADATA_KEY]: plan.slug,
      [STRIPE_BUSAL_PLAN_ID_METADATA_KEY]: plan.id,
      source: STRIPE_BUSAL_CATALOG_SOURCE,
    },
  });

  return { productId: product.id, reused: false };
}

async function findOrCreateMonthlyPrice(
  stripe: Stripe,
  productId: string,
  plan: SubscriptionPlanDefinition,
): Promise<{ priceId: string; reused: boolean }> {
  const prices = await listMonthlyGbpPricesForProduct(stripe, productId);
  const exactMatch = prices.find((price) => price.unit_amount === plan.mrrPence);
  if (exactMatch) {
    return { priceId: exactMatch.id, reused: true };
  }

  if (prices.length > 0) {
    throw new Error(
      `Product ${productId} already has monthly GBP Stripe prices with different amounts. Existing prices are immutable; create a new Stripe product or update environment mapping manually.`,
    );
  }

  const price = await stripe.prices.create({
    product: productId,
    currency: "gbp",
    unit_amount: plan.mrrPence,
    recurring: { interval: "month" },
    metadata: {
      [STRIPE_BUSAL_PLAN_SLUG_METADATA_KEY]: plan.slug,
      [STRIPE_BUSAL_PLAN_ID_METADATA_KEY]: plan.id,
      source: STRIPE_BUSAL_CATALOG_SOURCE,
    },
  });

  return { priceId: price.id, reused: false };
}

/**
 * Ensures Stripe TEST catalog objects exist for fixed Busal plans.
 * Requires STRIPE_ALLOW_CATALOG_PROVISIONING=true and a sk_test_ secret key.
 * Does not modify existing tenants, webhooks, or checkout behavior.
 */
export async function ensureBusalStripeCatalog(): Promise<StripeCatalogProvisionResult> {
  const mode = getStripeMode();
  const warnings: string[] = [];

  if (!isCatalogProvisioningAllowed()) {
    return {
      mode,
      provisioned: false,
      plans: [],
      warnings: [
        "Catalog provisioning skipped.",
        "Requires STRIPE_SECRET_KEY (sk_test_*), and STRIPE_ALLOW_CATALOG_PROVISIONING=true.",
        "Live-mode automatic provisioning is intentionally disabled.",
      ],
    };
  }

  const stripe = getStripeClient();
  const plans: StripeCatalogProvisionResult["plans"] = [];

  for (const binding of BUSAL_STRIPE_PLAN_BINDINGS) {
    const plan = assertFixedRecurringPlan(binding.planSlug);
    const configuredPriceId = resolveConfiguredStripePriceId(plan.slug);
    const configuredProductId = resolveConfiguredStripeProductId(plan.slug);

    if (configuredPriceId) {
      try {
        const configuredPrice = await stripe.prices.retrieve(configuredPriceId);
        if (configuredPrice.unit_amount !== plan.mrrPence) {
          warnings.push(
            `${binding.priceIdEnvKey} points to ${configuredPriceId} (£${((configuredPrice.unit_amount ?? 0) / 100).toFixed(2)}) which does not match registry £${(plan.mrrPence / 100).toFixed(2)}. Existing price was not modified.`,
          );
        }
        plans.push({
          planSlug: plan.slug,
          productId:
            configuredProductId ??
            (typeof configuredPrice.product === "string"
              ? configuredPrice.product
              : configuredPrice.product.id),
          priceId: configuredPriceId,
          reusedProduct: true,
          reusedPrice: true,
          priceIdEnvKey: binding.priceIdEnvKey,
          productIdEnvKey: binding.productIdEnvKey,
        });
        continue;
      } catch {
        warnings.push(`${binding.priceIdEnvKey} is set but could not be retrieved; attempting discovery.`);
      }
    }

    const { productId, reused: reusedProduct } = await findOrCreateProduct(stripe, plan);
    const { priceId, reused: reusedPrice } = await findOrCreateMonthlyPrice(stripe, productId, plan);

    plans.push({
      planSlug: plan.slug,
      productId,
      priceId,
      reusedProduct,
      reusedPrice,
      priceIdEnvKey: binding.priceIdEnvKey,
      productIdEnvKey: binding.productIdEnvKey,
    });
  }

  return {
    mode,
    provisioned: true,
    plans,
    warnings,
  };
}

export function getBusalStripePlanBindingForSlug(planSlug: string) {
  return getBusalStripePlanBinding(planSlug);
}

export const stripeCatalogService = {
  resolveBusalStripePlan,
  listResolvedBusalStripePlans,
  auditStripeCatalogPlan,
  auditBusalStripeCatalog,
  ensureBusalStripeCatalog,
  getBusalStripePlanBindingForSlug,
};
