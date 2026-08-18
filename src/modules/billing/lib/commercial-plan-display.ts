import {
  listSubscriptionPlans,
  type SubscriptionPlanDefinition,
} from "@/modules/control-center/billing/registry/subscription-plan-registry";

/** Public commercial plans from the authoritative registry (non-archived). */
export function listPublicCommercialPlans(): SubscriptionPlanDefinition[] {
  return listSubscriptionPlans(false);
}

/** Monthly price in major currency units (e.g. pounds), or null for custom pricing. */
export function getCommercialPlanMonthlyAmount(plan: SubscriptionPlanDefinition): number | null {
  if (plan.customPricing) {
    return null;
  }
  return plan.mrrPence / 100;
}

/** Customer-facing monthly price label derived from the registry. */
export function formatCommercialPlanPrice(plan: SubscriptionPlanDefinition): string {
  if (plan.customPricing) {
    return "Custom";
  }
  if (plan.mrrPence === 0) {
    return "Free";
  }
  return `£${Math.round(plan.mrrPence / 100)}/mo`;
}

/** GBP currency code for all commercial plans. */
export const BUSAL_COMMERCIAL_CURRENCY = "GBP" as const;
