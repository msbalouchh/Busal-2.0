import { DEFAULT_FINANCE_SCOPE } from "@/modules/finance/constants/mock-data";
import { financeService } from "@/modules/finance/services/finance.service";
import { getFinanceSummary } from "@/modules/finance/utils/finance-selectors";
import {
  buildTrialBalance,
  detectExpenseAnomalies,
  projectCashFlow,
  sumExpensesByCategory,
} from "@/modules/finance/utils/finance-report-utils";
import type { ExpenseCategory } from "@/modules/finance/constants/finance-status";
import type { FinanceAiContext } from "@/modules/finance/types/finance-platform";

export function buildFinanceAiContext(): FinanceAiContext {
  const record = financeService.getRecord();

  return {
    ...record.aiContext,
    summary: getFinanceSummary(record),
    insights: [
      ...record.aiContext.insights,
      `Gross margin: ${(record.analytics.grossMarginBps / 100).toFixed(1)}%`,
      `Cash on hand: £${(record.analytics.cashOnHandCents / 100).toFixed(2)}`,
    ],
    lastGeneratedAt: new Date().toISOString(),
  };
}

export function createInvoiceForAi(input: {
  customerName: string;
  dueDate: string;
  lineItems: Array<{ description: string; quantity: number; unitPriceCents: number }>;
}): Record<string, unknown> {
  const invoice = financeService.createInvoice({
    branchId: DEFAULT_FINANCE_SCOPE.branchId,
    customerName: input.customerName,
    dueDate: input.dueDate,
    lineItems: input.lineItems,
  });

  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    totalCents: invoice.totalCents,
    status: invoice.status,
  };
}

export function recordExpenseForAi(input: {
  category: ExpenseCategory;
  vendorName: string;
  description: string;
  amountCents: number;
}): Record<string, unknown> {
  const record = financeService.recordExpense({
    branchId: DEFAULT_FINANCE_SCOPE.branchId,
    category: input.category,
    vendorName: input.vendorName,
    description: input.description,
    amountCents: input.amountCents,
    expenseDate: new Date().toISOString().slice(0, 10),
    accountId: "acct-cogs",
  });

  const latestExpense = record.expenses[record.expenses.length - 1];

  return {
    expenseId: latestExpense?.id,
    totalCents: latestExpense?.totalCents,
    category: input.category,
  };
}

export function recordPaymentForAi(input: {
  amountCents: number;
  invoiceId?: string;
  reference?: string;
}): Record<string, unknown> {
  const record = financeService.recordPayment({
    branchId: DEFAULT_FINANCE_SCOPE.branchId,
    amountCents: input.amountCents,
    invoiceId: input.invoiceId,
    paymentMethod: "bank_transfer",
    reference: input.reference,
    recordedByUserId: DEFAULT_FINANCE_SCOPE.userId,
  });

  const latestPayment = record.payments[record.payments.length - 1];

  return {
    paymentId: latestPayment?.id,
    amountCents: latestPayment?.amountCents,
    invoiceId: input.invoiceId ?? null,
  };
}

export function forecastCashFlow(daysAhead = 30): Record<string, unknown> {
  const record = financeService.getRecord();
  const projection = projectCashFlow(record, daysAhead);

  return {
    periodId: record.period.id,
    currentCashCents: record.cashFlow.closingCashCents,
    projectedClosingCents: projection.projectedClosingCents,
    dailyNetCents: projection.dailyNetCents,
    daysAhead,
    operatingTrend: record.cashFlow.operatingCents > 0 ? "positive" : "negative",
  };
}

export function detectFinancialAnomalies(): Record<string, unknown> {
  const record = financeService.getRecord();
  const expenseAnomalies = detectExpenseAnomalies(record);
  const overdue = financeService.getOverdueInvoices();

  return {
    anomalyScore: record.analytics.anomalyScore,
    expenseAnomalies,
    overdueInvoices: overdue.map((inv) => ({
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName,
      amountDueCents: inv.amountDueCents,
      dueDate: inv.dueDate,
    })),
    refundCount: record.refunds.length,
    recommendations:
      expenseAnomalies.length > 0 || overdue.length > 0
        ? ["Review flagged expenses", "Follow up on overdue invoices"]
        : ["No significant anomalies detected"],
  };
}

export function generateFinancialReports(): Record<string, unknown> {
  const record = financeService.getRecord();

  return {
    periodId: record.period.id,
    periodName: record.period.name,
    profitAndLoss: record.profitAndLoss,
    balanceSheet: record.balanceSheet,
    cashFlow: record.cashFlow,
    trialBalance: buildTrialBalance(record),
    expensesByCategory: sumExpensesByCategory(record),
    generatedAt: new Date().toISOString(),
  };
}

export function predictRevenue(): Record<string, unknown> {
  const record = financeService.getRecord();

  const dailyAvg = Math.round(record.analytics.revenueCents / 15);
  const monthForecast = dailyAvg * 28;

  return {
    periodId: record.period.id,
    currentRevenueCents: record.analytics.revenueCents,
    dailyAverageCents: dailyAvg,
    monthForecastCents: monthForecast,
    aiForecastCents: record.aiContext.revenueForecastCents,
    grossMarginBps: record.analytics.grossMarginBps,
    confidence: 0.82,
  };
}

export function recommendCostSavings(): Record<string, unknown> {
  const record = financeService.getRecord();
  const byCategory = sumExpensesByCategory(record);
  const recommendations: Array<{ category: string; savingCents: number; action: string }> = [];

  if ((byCategory.utilities ?? 0) > 50000) {
    recommendations.push({
      category: "utilities",
      savingCents: 15000,
      action: "Review energy contracts and equipment efficiency",
    });
  }

  if ((byCategory.cogs ?? 0) > 1000000) {
    recommendations.push({
      category: "cogs",
      savingCents: 45000,
      action: "Negotiate supplier pricing and reduce waste",
    });
  }

  if ((byCategory.marketing ?? 0) > 100000) {
    recommendations.push({
      category: "marketing",
      savingCents: 20000,
      action: "Optimise ad spend based on ROI analytics",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      category: "general",
      savingCents: record.aiContext.costSavingOpportunitiesCents,
      action: "Maintain current cost controls",
    });
  }

  const totalSavingCents = recommendations.reduce((sum, r) => sum + r.savingCents, 0);

  return {
    periodId: record.period.id,
    totalPotentialSavingCents: totalSavingCents,
    recommendations,
    currentExpenseCents: record.analytics.expenseCents,
  };
}
