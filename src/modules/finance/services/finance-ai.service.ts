import "server-only";

import { financeService } from "@/modules/finance/services/finance.service";
import { buildFinancePlatformSnapshot } from "@/modules/finance/services/finance-platform.service";
import { getFinanceSummary } from "@/modules/finance/utils/finance-selectors";
import {
  buildTrialBalance,
  detectExpenseAnomalies,
  projectCashFlow,
  sumExpensesByCategory,
} from "@/modules/finance/utils/finance-report-utils";
import type { ExpenseCategory } from "@/modules/finance/constants/finance-status";
import type { FinanceAiContext, FinancePlatformContext } from "@/modules/finance/types/finance-platform";
import {
  resolveBusinessContextFromModule,
  runModuleAiJsonTask,
  type ModulePlatformContext,
} from "@/services/ai-engine-bridge.service";

const MODULE_NAME = "finance";

function toModulePlatform(context: FinancePlatformContext): ModulePlatformContext {
  return {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  };
}

async function runFinanceAiInference<T extends Record<string, unknown>>(
  context: FinancePlatformContext,
  task: string,
  data: Record<string, unknown>,
  instructions?: string,
): Promise<T | null> {
  const platform = await resolveBusinessContextFromModule(toModulePlatform(context));
  return runModuleAiJsonTask<T>(platform, {
    module: MODULE_NAME,
    task,
    context: data,
    instructions,
  });
}

export async function buildFinanceAiContext(context: FinancePlatformContext): Promise<FinanceAiContext> {
  const record = await financeService.getRecord(context);

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

export async function createInvoiceForAi(
  context: FinancePlatformContext,
  input: {
    customerName: string;
    dueDate: string;
    lineItems: Array<{ description: string; quantity: number; unitPriceCents: number }>;
  },
): Promise<Record<string, unknown>> {
  const invoice = await financeService.createInvoice(context, {
    branchId: context.branchId,
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

export async function recordExpenseForAi(
  context: FinancePlatformContext,
  input: {
    category: ExpenseCategory;
    vendorName: string;
    description: string;
    amountCents: number;
  },
): Promise<Record<string, unknown>> {
  const record = await financeService.recordExpense(context, {
    branchId: context.branchId,
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

export async function recordPaymentForAi(
  context: FinancePlatformContext,
  input: { amountCents: number; invoiceId?: string; reference?: string },
): Promise<Record<string, unknown>> {
  const record = await financeService.recordPayment(context, {
    branchId: context.branchId,
    amountCents: input.amountCents,
    invoiceId: input.invoiceId,
    paymentMethod: "bank_transfer",
    reference: input.reference,
    recordedByUserId: context.userId,
  });

  const latestPayment = record.payments[record.payments.length - 1];

  return {
    paymentId: latestPayment?.id,
    amountCents: latestPayment?.amountCents,
    invoiceId: input.invoiceId ?? null,
  };
}

export async function forecastCashFlow(
  context: FinancePlatformContext,
  daysAhead = 30,
): Promise<Record<string, unknown>> {
  const record = await financeService.getRecord(context);
  const projection = projectCashFlow(record, daysAhead);
  const dataContext = {
    periodId: record.period.id,
    currentCashCents: record.cashFlow.closingCashCents,
    projectedClosingCents: projection.projectedClosingCents,
    dailyNetCents: projection.dailyNetCents,
    daysAhead,
    cashFlow: record.cashFlow,
    analytics: record.analytics,
  };

  const aiResult = await runFinanceAiInference<Record<string, unknown>>(
    context,
    "forecastCashFlow",
    dataContext,
    "Forecast cash flow. Return JSON with periodId, currentCashCents, projectedClosingCents, dailyNetCents, daysAhead, operatingTrend, confidence, and recommendations.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    periodId: record.period.id,
    currentCashCents: record.cashFlow.closingCashCents,
    projectedClosingCents: projection.projectedClosingCents,
    dailyNetCents: projection.dailyNetCents,
    daysAhead,
    operatingTrend: record.cashFlow.operatingCents > 0 ? "positive" : "negative",
  };
}

export async function detectFinancialAnomalies(
  context: FinancePlatformContext,
): Promise<Record<string, unknown>> {
  const record = await financeService.getRecord(context);
  const expenseAnomalies = detectExpenseAnomalies(record);
  const overdue = await financeService.getOverdueInvoices(context);
  const dataContext = {
    anomalyScore: record.analytics.anomalyScore,
    expenseAnomalies,
    overdueInvoices: overdue.map((invoice) => ({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      amountDueCents: invoice.amountDueCents,
      dueDate: invoice.dueDate,
    })),
    refundCount: record.refunds.length,
  };

  const aiResult = await runFinanceAiInference<Record<string, unknown>>(
    context,
    "detectFinancialAnomalies",
    dataContext,
    "Detect financial anomalies. Return JSON with anomalyScore, expenseAnomalies, overdueInvoices, refundCount, and recommendations.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function generateFinancialReports(
  context: FinancePlatformContext,
): Promise<Record<string, unknown>> {
  const record = await financeService.getRecord(context);
  const dataContext = {
    periodId: record.period.id,
    periodName: record.period.name,
    profitAndLoss: record.profitAndLoss,
    balanceSheet: record.balanceSheet,
    cashFlow: record.cashFlow,
    trialBalance: buildTrialBalance(record),
    expensesByCategory: sumExpensesByCategory(record),
  };

  const aiResult = await runFinanceAiInference<Record<string, unknown>>(
    context,
    "generateFinancialReports",
    dataContext,
    "Generate financial report summary with key highlights. Return JSON including periodId, periodName, profitAndLoss, balanceSheet, cashFlow, trialBalance, expensesByCategory, generatedAt, and summary.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    ...dataContext,
    generatedAt: new Date().toISOString(),
  };
}

export async function predictRevenue(context: FinancePlatformContext): Promise<Record<string, unknown>> {
  const record = await financeService.getRecord(context);
  const dataContext = {
    periodId: record.period.id,
    currentRevenueCents: record.analytics.revenueCents,
    aiForecastCents: record.aiContext.revenueForecastCents,
    grossMarginBps: record.analytics.grossMarginBps,
    profitAndLoss: record.profitAndLoss,
    analytics: record.analytics,
  };

  const aiResult = await runFinanceAiInference<Record<string, unknown>>(
    context,
    "predictRevenue",
    dataContext,
    "Predict revenue. Return JSON with periodId, currentRevenueCents, dailyAverageCents, monthForecastCents, aiForecastCents, grossMarginBps, confidence, and forecast rationale.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    periodId: record.period.id,
    currentRevenueCents: record.analytics.revenueCents,
    aiForecastCents: record.aiContext.revenueForecastCents,
    grossMarginBps: record.analytics.grossMarginBps,
  };
}

export async function recommendCostSavings(
  context: FinancePlatformContext,
): Promise<Record<string, unknown>> {
  const record = await financeService.getRecord(context);
  const byCategory = sumExpensesByCategory(record);
  const dataContext = {
    periodId: record.period.id,
    byCategory,
    currentExpenseCents: record.analytics.expenseCents,
    costSavingOpportunitiesCents: record.aiContext.costSavingOpportunitiesCents,
    expenses: record.expenses.slice(0, 50),
  };

  const aiResult = await runFinanceAiInference<Record<string, unknown>>(
    context,
    "recommendCostSavings",
    dataContext,
    "Recommend cost savings. Return JSON with periodId, totalPotentialSavingCents, recommendations array (category, savingCents, action), and currentExpenseCents.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    periodId: record.period.id,
    currentExpenseCents: record.analytics.expenseCents,
    byCategory,
    costSavingOpportunitiesCents: record.aiContext.costSavingOpportunitiesCents,
  };
}

export async function analyzeExpenses(context: FinancePlatformContext): Promise<Record<string, unknown>> {
  const record = await financeService.getRecord(context);
  const byCategory = sumExpensesByCategory(record);
  const anomalies = detectExpenseAnomalies(record);
  const dataContext = {
    periodId: record.period.id,
    totalExpenseCents: record.analytics.expenseCents,
    byCategory,
    anomalyCount: anomalies.length,
    anomalies,
  };

  const aiResult = await runFinanceAiInference<Record<string, unknown>>(
    context,
    "analyzeExpenses",
    dataContext,
    "Analyze expenses. Return JSON with periodId, totalExpenseCents, byCategory, anomalyCount, topCategories, and insights.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    periodId: record.period.id,
    totalExpenseCents: record.analytics.expenseCents,
    byCategory,
    anomalyCount: anomalies.length,
    topCategories: Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amountCents]) => ({ category, amountCents })),
  };
}

export async function analyzeProfitability(
  context: FinancePlatformContext,
): Promise<Record<string, unknown>> {
  const record = await financeService.getRecord(context);
  const dataContext = {
    periodId: record.period.id,
    profitAndLoss: record.profitAndLoss,
    grossMarginBps: record.analytics.grossMarginBps,
    netMarginBps: record.analytics.netMarginBps,
    netProfitCents: record.analytics.netProfitCents,
  };

  const aiResult = await runFinanceAiInference<Record<string, unknown>>(
    context,
    "analyzeProfitability",
    dataContext,
    "Analyze profitability. Return JSON with periodId, profitAndLoss, grossMarginBps, netMarginBps, netProfitCents, trend, and insights.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    ...dataContext,
    trend: record.analytics.netProfitCents >= 0 ? "profitable" : "loss-making",
  };
}

export async function recommendBudget(context: FinancePlatformContext): Promise<Record<string, unknown>> {
  const record = await financeService.getRecord(context);
  const byCategory = sumExpensesByCategory(record);
  const dataContext = {
    periodId: record.period.id,
    existingBudgetCount: record.budgets.length,
    byCategory,
    budgets: record.budgets,
  };

  const aiResult = await runFinanceAiInference<Record<string, unknown>>(
    context,
    "recommendBudget",
    dataContext,
    "Recommend budgets by category. Return JSON with periodId, existingBudgetCount, and recommendations array (category, currentSpentCents, recommendedBudgetCents, varianceBufferCents).",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    periodId: record.period.id,
    existingBudgetCount: record.budgets.length,
    byCategory,
  };
}

export async function detectFinancialRisk(context: FinancePlatformContext): Promise<Record<string, unknown>> {
  const [record, overdue, snapshot] = await Promise.all([
    financeService.getRecord(context),
    financeService.getOverdueInvoices(context),
    buildFinancePlatformSnapshot(context),
  ]);

  const dataContext = {
    periodId: record.period.id,
    overdueInvoiceCount: snapshot.overdueInvoiceCount,
    accountsReceivableCents: snapshot.accountsReceivableCents,
    accountsPayableCents: snapshot.accountsPayableCents,
    anomalyScore: record.analytics.anomalyScore,
    cashOnHandCents: record.analytics.cashOnHandCents,
    expenseCents: record.analytics.expenseCents,
    grossMarginBps: record.analytics.grossMarginBps,
    overdueCount: overdue.length,
  };

  const aiResult = await runFinanceAiInference<Record<string, unknown>>(
    context,
    "detectFinancialRisk",
    dataContext,
    "Detect financial risk. Return JSON with periodId, riskScore, risks array, overdueInvoiceCount, accountsReceivableCents, accountsPayableCents, and recommendations.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}
