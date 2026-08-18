import "server-only";

import { isProductionDeployment, isDevelopmentBillingFallbackAllowed } from "@/lib/production-mode";
import { isStripeConfigured } from "@/lib/stripe";
import {
  BUSAL_COMMERCIAL_PLAN_SLUGS,
  getSubscriptionPlanBySlug,
} from "@/modules/control-center/billing/registry/subscription-plan-registry";
import {
  BUSAL_STRIPE_PLAN_BINDINGS,
  resolveConfiguredStripePriceId,
} from "@/modules/commercial-foundation/lib/stripe-catalog.config";

export interface StripeBillingConfigIssue {
  key: string;
  message: string;
}

export interface StripeBillingConfigValidation {
  valid: boolean;
  issues: StripeBillingConfigIssue[];
}

const REQUIRED_PRODUCTION_ENV_KEYS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_BUSAL_CORE",
  "STRIPE_PRICE_BUSAL_GROWTH",
  "STRIPE_PRICE_BUSAL_PRO",
] as const;

export function validateProductionStripeBillingConfig(): StripeBillingConfigValidation {
  const issues: StripeBillingConfigIssue[] = [];

  for (const key of REQUIRED_PRODUCTION_ENV_KEYS) {
    if (!process.env[key]?.trim()) {
      issues.push({ key, message: `${key} is required for production billing.` });
    }
  }

  for (const binding of BUSAL_STRIPE_PLAN_BINDINGS) {
    const plan = getSubscriptionPlanBySlug(binding.planSlug);
    if (!plan || plan.customPricing || plan.mrrPence <= 0) {
      continue;
    }

    const priceId = resolveConfiguredStripePriceId(binding.planSlug);
    if (!priceId) {
      issues.push({
        key: binding.priceIdEnvKey,
        message: `Configured Stripe price is missing for ${plan.name}.`,
      });
    }
  }

  return { valid: issues.length === 0, issues };
}

export function assertProductionBillingReady(): void {
  if (!isProductionDeployment()) {
    return;
  }

  const validation = validateProductionStripeBillingConfig();
  if (!validation.valid) {
    const summary = validation.issues.map((issue) => issue.key).join(", ");
    throw new Error(`Production billing is not configured (${summary}).`);
  }

  if (!isStripeConfigured()) {
    throw new Error("Production billing requires Stripe configuration.");
  }
}

export function requireStripeBillingForActivation(): void {
  if (isProductionDeployment()) {
    assertProductionBillingReady();
    return;
  }

  if (isDevelopmentBillingFallbackAllowed()) {
    return;
  }

  if (!isStripeConfigured()) {
    throw new Error(
      "Billing is not configured. Set Stripe environment variables or enable ALLOW_DEV_BILLING_BYPASS=true for local development.",
    );
  }
}

export function canUseDevelopmentBillingFallback(): boolean {
  return isDevelopmentBillingFallbackAllowed() && !isProductionDeployment();
}

export function isEnterprisePlanSlug(planSlug: string): boolean {
  return planSlug.toLowerCase() === BUSAL_COMMERCIAL_PLAN_SLUGS.ENTERPRISE;
}

export function assertCheckoutEligiblePlanSlug(planSlug: string): void {
  const plan = getSubscriptionPlanBySlug(planSlug);
  if (!plan) {
    throw new Error("Selected plan is not configured.");
  }

  if (plan.customPricing || isEnterprisePlanSlug(plan.slug)) {
    throw new Error("Enterprise plans require custom billing. Contact Busal sales.");
  }

  if (plan.mrrPence <= 0) {
    throw new Error("Selected plan does not have a fixed recurring price.");
  }
}

export function getOfficialPlanMonthlyPricePence(planSlug: string): number {
  const plan = getSubscriptionPlanBySlug(planSlug);
  if (!plan) {
    throw new Error("Plan not found.");
  }
  return plan.mrrPence;
}
