import type { ExpenseCategory } from "@/modules/finance/constants/finance-status";

export interface TaxCalculationInput {
  taxableAmountCents: number;
  rateBps: number;
}

export function calculateTaxAmount(input: TaxCalculationInput): number {
  return Math.round((input.taxableAmountCents * input.rateBps) / 10000);
}

export function calculateInvoiceTotals(
  lineItems: Array<{ quantity: number; unitPriceCents: number }>,
  taxRateBps = 2000,
  discountCents = 0,
): { subtotalCents: number; taxCents: number; totalCents: number } {
  const subtotalCents = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0,
  );
  const taxableCents = Math.max(0, subtotalCents - discountCents);
  const taxCents = calculateTaxAmount({ taxableAmountCents: taxableCents, rateBps: taxRateBps });
  const totalCents = taxableCents + taxCents;

  return { subtotalCents, taxCents, totalCents };
}

export function formatTaxRate(rateBps: number): string {
  return `${(rateBps / 100).toFixed(1)}%`;
}

export const DEFAULT_VAT_RATE_BPS = 2000;

export function getExpenseCategoryLabel(category: ExpenseCategory): string {
  const labels: Record<ExpenseCategory, string> = {
    cogs: "COGS",
    payroll: "Payroll",
    rent: "Rent",
    utilities: "Utilities",
    marketing: "Marketing",
    supplies: "Supplies",
    maintenance: "Maintenance",
    insurance: "Insurance",
    other: "Other",
  };

  return labels[category];
}

export function convertCurrencyAmount(
  amountCents: number,
  _fromCurrency: string,
  _toCurrency: string,
  exchangeRateBps = 10000,
): number {
  return Math.round((amountCents * exchangeRateBps) / 10000);
}
