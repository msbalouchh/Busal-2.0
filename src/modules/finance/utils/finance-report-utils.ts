import type { FinanceRecord } from "@/modules/finance/types/finance-platform";

export function calculateGrossMarginBps(revenueCents: number, cogsCents: number): number {
  if (revenueCents <= 0) {
    return 0;
  }

  return Math.round(((revenueCents - cogsCents) / revenueCents) * 10000);
}

export function calculateNetMarginBps(revenueCents: number, netProfitCents: number): number {
  if (revenueCents <= 0) {
    return 0;
  }

  return Math.round((netProfitCents / revenueCents) * 10000);
}

export function sumExpensesByCategory(record: FinanceRecord): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const expense of record.expenses) {
    totals[expense.category] = (totals[expense.category] ?? 0) + expense.totalCents;
  }

  return totals;
}

export function projectCashFlow(
  record: FinanceRecord,
  daysAhead = 30,
): { projectedClosingCents: number; dailyNetCents: number } {
  const dailyRevenue = Math.round(record.analytics.revenueCents / 15);
  const dailyExpenses = Math.round(record.analytics.expenseCents / 15);
  const dailyNetCents = dailyRevenue - dailyExpenses;
  const projectedClosingCents = record.cashFlow.closingCashCents + dailyNetCents * daysAhead;

  return { projectedClosingCents, dailyNetCents };
}

export function detectExpenseAnomalies(record: FinanceRecord): Array<{
  expenseId: string;
  description: string;
  amountCents: number;
  deviationBps: number;
}> {
  if (record.expenses.length === 0) {
    return [];
  }

  const avg = record.expenses.reduce((sum, e) => sum + e.totalCents, 0) / record.expenses.length;

  return record.expenses
    .filter((exp) => exp.totalCents > avg * 2)
    .map((exp) => ({
      expenseId: exp.id,
      description: exp.description,
      amountCents: exp.totalCents,
      deviationBps: avg > 0 ? Math.round(((exp.totalCents - avg) / avg) * 10000) : 0,
    }));
}

export function calculateTaxLiability(record: FinanceRecord): number {
  return record.taxes.reduce((sum, tax) => sum + (tax.isPaid ? 0 : tax.taxAmountCents), 0);
}

export function buildTrialBalance(record: FinanceRecord): Array<{
  accountCode: string;
  accountName: string;
  debitCents: number;
  creditCents: number;
}> {
  return record.ledgers.map((ledger) => {
    const account = record.chartOfAccounts.find((a) => a.id === ledger.accountId);
    return {
      accountCode: account?.code ?? "",
      accountName: account?.name ?? "Unknown",
      debitCents: ledger.debitTotalCents,
      creditCents: ledger.creditTotalCents,
    };
  });
}
