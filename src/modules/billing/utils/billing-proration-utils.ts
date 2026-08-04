import type { BillingCycle } from "@/modules/billing/constants/billing-status";

export interface ProrationInput {
  currentPriceCents: number;
  newPriceCents: number;
  periodStart: string;
  periodEnd: string;
  changeDate: string;
  billingCycle: BillingCycle;
}

export interface ProrationResult {
  creditCents: number;
  chargeCents: number;
  netCents: number;
  daysRemaining: number;
  totalDays: number;
}

function daysBetween(start: string, end: string): number {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  return Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)));
}

/** Calculate proration for mid-cycle plan changes (architecture only). */
export function calculateProration(input: ProrationInput): ProrationResult {
  const totalDays = daysBetween(input.periodStart, input.periodEnd);
  const daysRemaining = daysBetween(input.changeDate, input.periodEnd);

  const unusedFraction = daysRemaining / totalDays;
  const creditCents = Math.round(input.currentPriceCents * unusedFraction);
  const chargeCents = Math.round(input.newPriceCents * unusedFraction);
  const netCents = chargeCents - creditCents;

  return {
    creditCents,
    chargeCents,
    netCents,
    daysRemaining,
    totalDays,
  };
}

export function getCycleMultiplier(cycle: BillingCycle): number {
  switch (cycle) {
    case "yearly":
      return 12;
    case "quarterly":
      return 3;
    case "custom":
      return 1;
    case "monthly":
    default:
      return 1;
  }
}
