export interface TaxLineInput {
  taxName: string;
  taxRateBps: number;
  taxableAmountCents: number;
  jurisdiction: string;
}

export interface TaxCalculationResult {
  lines: Array<{
    taxName: string;
    taxRateBps: number;
    taxableAmountCents: number;
    taxAmountCents: number;
    jurisdiction: string;
  }>;
  totalTaxCents: number;
}

export function calculateTaxes(
  taxableAmountCents: number,
  taxRates: Array<{ taxName: string; taxRateBps: number; jurisdiction: string }>,
): TaxCalculationResult {
  const lines = taxRates.map((rate) => {
    const taxAmountCents = Math.round((taxableAmountCents * rate.taxRateBps) / 10000);

    return {
      taxName: rate.taxName,
      taxRateBps: rate.taxRateBps,
      taxableAmountCents,
      taxAmountCents,
      jurisdiction: rate.jurisdiction,
    };
  });

  const totalTaxCents = lines.reduce((sum, line) => sum + line.taxAmountCents, 0);

  return { lines, totalTaxCents };
}

export function calculateOrderTotal(
  subtotalCents: number,
  discountCents: number,
  taxCents: number,
  tipCents = 0,
): number {
  return Math.max(0, subtotalCents - discountCents + taxCents + tipCents);
}

export function formatTaxRate(taxRateBps: number): string {
  return `${(taxRateBps / 100).toFixed(1)}%`;
}

export const DEFAULT_VAT_RATE_BPS = 2000;

export const DEFAULT_TAX_RATES = [
  { taxName: "VAT", taxRateBps: DEFAULT_VAT_RATE_BPS, jurisdiction: "GB" },
] as const;
