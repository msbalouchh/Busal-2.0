/** Integer-only payment calculations. All amounts are pence. */

export function assertIntegerPence(value: number, label: string): number {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer pence amount`);
  }

  return value;
}

export function applyDiscountPence(subtotalPence: number, discountPence: number): number {
  assertIntegerPence(subtotalPence, "Subtotal");
  assertIntegerPence(discountPence, "Discount");

  return Math.max(0, subtotalPence - discountPence);
}

/** taxRateBps uses basis points. 2000 = 20.00% */
export function calculateTaxPence(taxableAmountPence: number, taxRateBps: number): number {
  assertIntegerPence(taxableAmountPence, "Taxable amount");
  assertIntegerPence(taxRateBps, "Tax rate");

  return Math.floor((taxableAmountPence * taxRateBps) / 10000);
}

export function calculateOrderTotalPence(
  subtotalPence: number,
  discountPence: number,
  taxPence: number,
): number {
  return applyDiscountPence(subtotalPence, discountPence) + assertIntegerPence(taxPence, "Tax");
}

export function calculateRemainingBalancePence(
  orderTotalPence: number,
  amountPaidPence: number,
): number {
  assertIntegerPence(orderTotalPence, "Order total");
  assertIntegerPence(amountPaidPence, "Amount paid");

  return Math.max(0, orderTotalPence - amountPaidPence);
}

export function calculateSplitPaymentPence(
  remainingBalancePence: number,
  paymentPence: number,
): number {
  assertIntegerPence(remainingBalancePence, "Remaining balance");
  assertIntegerPence(paymentPence, "Payment");

  return Math.min(paymentPence, remainingBalancePence);
}

export function calculateRefundPence(amountPaidPence: number, refundPence: number): number {
  assertIntegerPence(amountPaidPence, "Amount paid");
  assertIntegerPence(refundPence, "Refund");

  return Math.max(0, Math.min(refundPence, amountPaidPence));
}

export function calculateRefundedBalancePence(
  amountPaidPence: number,
  refundPence: number,
): number {
  return amountPaidPence - calculateRefundPence(amountPaidPence, refundPence);
}
