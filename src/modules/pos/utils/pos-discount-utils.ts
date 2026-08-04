import type { PosDiscountType } from "@/modules/pos/constants/pos-status";

export interface DiscountCalculationInput {
  subtotalCents: number;
  discountType: PosDiscountType;
  valueBps?: number;
  amountCents?: number;
  maxDiscountBps?: number;
}

export interface DiscountCalculationResult {
  discountCents: number;
  effectiveRateBps: number;
  cappedByMax: boolean;
}

export function calculateDiscount(input: DiscountCalculationInput): DiscountCalculationResult {
  let discountCents = 0;

  if (input.amountCents !== undefined) {
    discountCents = input.amountCents;
  } else if (input.valueBps !== undefined) {
    discountCents = Math.round((input.subtotalCents * input.valueBps) / 10000);
  }

  discountCents = Math.min(discountCents, input.subtotalCents);

  let cappedByMax = false;

  if (input.maxDiscountBps !== undefined) {
    const maxCents = Math.round((input.subtotalCents * input.maxDiscountBps) / 10000);

    if (discountCents > maxCents) {
      discountCents = maxCents;
      cappedByMax = true;
    }
  }

  const effectiveRateBps =
    input.subtotalCents > 0 ? Math.round((discountCents / input.subtotalCents) * 10000) : 0;

  return { discountCents, effectiveRateBps, cappedByMax };
}

export function applyStackedDiscounts(
  subtotalCents: number,
  discounts: Array<{ amountCents: number }>,
): number {
  const totalDiscount = discounts.reduce((sum, d) => sum + d.amountCents, 0);
  return Math.min(totalDiscount, subtotalCents);
}

export function formatDiscountLabel(discountType: PosDiscountType, value: number): string {
  switch (discountType) {
    case "percentage":
      return `${(value / 100).toFixed(0)}% off`;
    case "fixed":
      return `£${(value / 100).toFixed(2)} off`;
    case "promo_code":
      return `Promo: ${value}`;
    case "loyalty":
      return "Loyalty reward";
    case "employee":
      return "Staff discount";
    case "bogo":
      return "Buy one get one";
    default:
      return "Discount";
  }
}
