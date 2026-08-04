import type { BillingCycle, PlanType } from "@/modules/billing/constants/billing-status";
import type {
  BillingInvoice,
  BillingRecord,
  SubscriptionPlan,
} from "@/modules/billing/types/billing-platform";

export function formatMoney(cents: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(cents / 100);
}

export function getBillingSummary(record: BillingRecord): string {
  return `${record.plan.name} — ${formatMoney(record.analytics.mrrCents)}/mo MRR`;
}

export function getMrrCents(record: BillingRecord): number {
  return record.analytics.mrrCents;
}

export function getArrCents(record: BillingRecord): number {
  return record.analytics.arrCents;
}

export function getPlanPriceCents(plan: SubscriptionPlan, cycle: BillingCycle): number {
  switch (cycle) {
    case "yearly":
      return plan.yearlyPriceCents;
    case "quarterly":
      return Math.round(plan.monthlyPriceCents * 3 * 0.95);
    case "monthly":
    default:
      return plan.monthlyPriceCents;
  }
}

export function getPlanLabel(plan: SubscriptionPlan): string {
  return `${plan.name} — ${formatMoney(plan.monthlyPriceCents)}/mo`;
}

export function isInvoiceOverdue(invoice: BillingInvoice, today = "2026-02-15"): boolean {
  return invoice.amountDueCents > 0 && invoice.dueDate < today;
}

export function getPublicPlans(plans: SubscriptionPlan[]): SubscriptionPlan[] {
  return plans
    .filter((plan) => plan.isPublic && plan.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function comparePlanTiers(a: PlanType, b: PlanType): number {
  const order: PlanType[] = ["free", "starter", "professional", "business", "enterprise", "custom"];
  return order.indexOf(a) - order.indexOf(b);
}

export function isUpgrade(fromPlan: SubscriptionPlan, toPlan: SubscriptionPlan): boolean {
  return comparePlanTiers(fromPlan.planType, toPlan.planType) < 0;
}

export function isDowngrade(fromPlan: SubscriptionPlan, toPlan: SubscriptionPlan): boolean {
  return comparePlanTiers(fromPlan.planType, toPlan.planType) > 0;
}
