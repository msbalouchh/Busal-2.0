import type { QuoteBillingCycle, QuoteLineType } from "@prisma/client";

export interface QuoteLineItemPricingInput {
  lineType: QuoteLineType;
  quantity: number;
  unitPricePence: number;
  lineDiscountPence?: number;
  taxRateBps?: number;
  billingCycle?: QuoteBillingCycle;
}

export interface ComputedQuoteLineItem extends QuoteLineItemPricingInput {
  lineNetPence: number;
  lineTaxPence: number;
  lineTotalPence: number;
}

export interface QuotePricingInput {
  lineItems: QuoteLineItemPricingInput[];
  quoteDiscountPence?: number;
  defaultTaxRateBps?: number;
}

export interface QuotePricingResult {
  lineItems: ComputedQuoteLineItem[];
  subtotalPence: number;
  discountPence: number;
  taxPence: number;
  recurringTotalPence: number;
  oneTimeTotalPence: number;
  totalPence: number;
  taxRateBps: number;
}

function assertIntegerPence(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer pence value`);
  }
}

export function calculateQuotePricing(input: QuotePricingInput): QuotePricingResult {
  const defaultTaxRateBps = input.defaultTaxRateBps ?? 2000;
  const quoteDiscountPence = input.quoteDiscountPence ?? 0;

  assertIntegerPence(quoteDiscountPence, "Quote discount");

  const computedLines: ComputedQuoteLineItem[] = input.lineItems.map((line) => {
    const lineDiscountPence = line.lineDiscountPence ?? 0;
    const taxRateBps = line.taxRateBps ?? defaultTaxRateBps;

    assertIntegerPence(line.unitPricePence, "Unit price");
    assertIntegerPence(lineDiscountPence, "Line discount");

    if (line.quantity <= 0) {
      throw new Error("Quantity must be greater than zero");
    }

    const lineNetPence = line.quantity * line.unitPricePence - lineDiscountPence;
    if (lineNetPence < 0) {
      throw new Error("Line net amount cannot be negative");
    }

    const lineTaxPence = Math.round((lineNetPence * taxRateBps) / 10000);

    return {
      ...line,
      lineDiscountPence,
      taxRateBps,
      billingCycle: line.billingCycle ?? "ONE_TIME",
      lineNetPence,
      lineTaxPence,
      lineTotalPence: lineNetPence + lineTaxPence,
    };
  });

  const subtotalPence = computedLines.reduce((sum, line) => sum + line.lineNetPence, 0);
  if (quoteDiscountPence > subtotalPence) {
    throw new Error("Quote discount cannot exceed subtotal");
  }

  const taxPence = computedLines.reduce((sum, line) => sum + line.lineTaxPence, 0);
  const oneTimeTotalPence = computedLines
    .filter((line) => (line.billingCycle ?? "ONE_TIME") === "ONE_TIME")
    .reduce((sum, line) => sum + line.lineNetPence, 0);
  const recurringTotalPence = computedLines
    .filter((line) => line.billingCycle === "MONTHLY" || line.billingCycle === "ANNUAL")
    .reduce((sum, line) => sum + line.lineNetPence, 0);
  const totalPence = subtotalPence - quoteDiscountPence + taxPence;

  return {
    lineItems: computedLines,
    subtotalPence,
    discountPence: quoteDiscountPence,
    taxPence,
    recurringTotalPence,
    oneTimeTotalPence,
    totalPence,
    taxRateBps: defaultTaxRateBps,
  };
}
