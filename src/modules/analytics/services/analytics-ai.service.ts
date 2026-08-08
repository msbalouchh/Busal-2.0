import "server-only";

import { ANALYTICS_MODULE_SOURCES } from "@/modules/analytics/constants/analytics-status";
import { analyticsService } from "@/modules/analytics/services/analytics.service";
import { buildAnalyticsPlatformSnapshot } from "@/modules/analytics/services/analytics-platform.service";
import {
  getBelowAverageBenchmarks,
  rankBenchmarks,
} from "@/modules/analytics/utils/analytics-benchmark-utils";
import {
  compareBranchMetrics,
  formatMoney,
  getAnalyticsSummary,
  getTopKpis,
} from "@/modules/analytics/utils/analytics-selectors";
import type { AnalyticsAiContext, AnalyticsPlatformContext } from "@/modules/analytics/types/analytics-platform";
import type { AnalyticsModuleSource } from "@/modules/analytics/constants/analytics-status";
import {
  resolveBusinessContextFromModule,
  runModuleAiJsonTask,
  type ModulePlatformContext,
} from "@/services/ai-engine-bridge.service";

const MODULE_NAME = "analytics";

function toModulePlatform(context: AnalyticsPlatformContext): ModulePlatformContext {
  return {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  };
}

async function runAnalyticsAiInference<T extends Record<string, unknown>>(
  context: AnalyticsPlatformContext,
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

export async function buildAnalyticsAiContext(context: AnalyticsPlatformContext): Promise<AnalyticsAiContext> {
  const record = await analyticsService.getRecord(context);

  return {
    ...record.aiContext,
    summary: getAnalyticsSummary(record),
    topInsights: record.insights.map((insight) => insight.title),
    lastGeneratedAt: new Date().toISOString(),
  };
}

export async function generateReportForAi(
  context: AnalyticsPlatformContext,
  input: {
    name: string;
    moduleSources?: AnalyticsModuleSource[];
    periodStart?: string;
    periodEnd?: string;
  },
): Promise<Record<string, unknown>> {
  const now = new Date();
  const periodStart = input.periodStart ?? new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const periodEnd = input.periodEnd ?? new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const report = await analyticsService.generateReport(context, {
    name: input.name,
    moduleSources: input.moduleSources ?? [ANALYTICS_MODULE_SOURCES.ORDERS, ANALYTICS_MODULE_SOURCES.FINANCE],
    branchIds: [context.branchId],
    periodStart,
    periodEnd,
  });

  return {
    reportId: report.id,
    name: report.name,
    kpiCount: report.kpiIds.length,
    chartCount: report.chartIds.length,
    status: report.status,
  };
}

export async function explainKpiForAi(
  context: AnalyticsPlatformContext,
  input: { kpiKey?: string },
): Promise<Record<string, unknown>> {
  const record = await analyticsService.getRecord(context);
  const kpi = input.kpiKey
    ? record.kpis.find((item) => item.key === input.kpiKey)
    : getTopKpis(record, 1)[0];

  if (!kpi) {
    return { success: false, error: "KPI not found" };
  }

  return {
    kpiKey: kpi.key,
    label: kpi.label,
    currentValue: kpi.currentValue,
    previousValue: kpi.previousValue,
    changePercent: kpi.changePercent,
    trend: kpi.trend,
    explanation: `${kpi.label} is ${kpi.trend} ${Math.abs(kpi.changePercent).toFixed(1)}% vs previous period`,
    moduleSource: kpi.moduleSource,
  };
}

export async function forecastRevenueForAi(
  context: AnalyticsPlatformContext,
  input?: { periodsAhead?: number },
): Promise<Record<string, unknown>> {
  const record = await analyticsService.getRecord(context);
  const historical =
    record.charts.find((chart) => chart.moduleSource === ANALYTICS_MODULE_SOURCES.FINANCE)?.datasets[0]?.data ?? [];
  const periodsAhead = input?.periodsAhead ?? 4;
  const dataContext = {
    currentRevenueCents: record.sales.totalRevenueCents,
    historicalValues: historical.length > 0 ? historical : [record.sales.totalRevenueCents],
    periodsAhead,
    forecasts: record.forecasts.filter((item) => item.forecastType === "revenue"),
  };

  const aiResult = await runAnalyticsAiInference<Record<string, unknown>>(
    context,
    "forecastRevenue",
    dataContext,
    "Forecast revenue. Return JSON with currentRevenueCents, forecast array, confidenceScore, and trend.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    currentRevenueCents: record.sales.totalRevenueCents,
    periodsAhead,
    historicalValues: dataContext.historicalValues,
  };
}

export async function forecastDemandForAi(
  context: AnalyticsPlatformContext,
  input?: { periodsAhead?: number },
): Promise<Record<string, unknown>> {
  const record = await analyticsService.getRecord(context);
  const periodsAhead = input?.periodsAhead ?? 7;
  const dataContext = {
    currentOrderCount: record.sales.orderCount,
    historicalCounts: [record.sales.orderCount],
    periodsAhead,
    forecasts: record.forecasts.filter((item) => item.forecastType === "demand"),
  };

  const aiResult = await runAnalyticsAiInference<Record<string, unknown>>(
    context,
    "forecastDemand",
    dataContext,
    "Forecast demand. Return JSON with currentOrderCount, forecast array, confidenceScore, and peakPeriods.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    currentOrderCount: record.sales.orderCount,
    periodsAhead,
  };
}

export async function detectBusinessAnomaliesForAi(
  context: AnalyticsPlatformContext,
): Promise<Record<string, unknown>> {
  const record = await analyticsService.getRecord(context);
  const alerts = await analyticsService.getUnacknowledgedAlerts(context);
  const critical = await analyticsService.getCriticalAlerts(context);
  const dataContext = {
    anomalyCount: alerts.length,
    criticalCount: critical.length,
    alerts: alerts.map((alert) => ({
      id: alert.id,
      title: alert.title,
      severity: alert.severity,
      moduleSource: alert.moduleSource,
    })),
    insights: record.insights
      .filter((insight) => insight.severity === "warning" || insight.severity === "critical")
      .map((insight) => insight.title),
  };

  const aiResult = await runAnalyticsAiInference<Record<string, unknown>>(
    context,
    "detectBusinessAnomalies",
    dataContext,
    "Detect business anomalies. Return JSON with anomalyCount, criticalCount, alerts, insights, and recommendedActions.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function recommendImprovementsForAi(
  context: AnalyticsPlatformContext,
): Promise<Record<string, unknown>> {
  const record = await analyticsService.getRecord(context);
  const belowAverage = getBelowAverageBenchmarks(record.benchmarks);
  const dataContext = {
    recommendedActions: record.aiContext.recommendedActions,
    insights: record.insights.map((insight) => ({
      title: insight.title,
      recommendedActions: insight.recommendedActions,
    })),
    belowAverageBenchmarks: belowAverage.map((benchmark) => ({
      metric: benchmark.label,
      percentileRank: benchmark.percentileRank,
    })),
  };

  const aiResult = await runAnalyticsAiInference<Record<string, unknown>>(
    context,
    "recommendImprovements",
    dataContext,
    "Recommend business improvements. Return JSON with recommendations array and belowAverageBenchmarks.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    belowAverageBenchmarks: dataContext.belowAverageBenchmarks,
    existingRecommendations: record.aiContext.recommendedActions,
  };
}

export async function generateExecutiveSummaryForAi(
  context: AnalyticsPlatformContext,
): Promise<Record<string, unknown>> {
  const record = await analyticsService.getRecord(context);
  const dataContext = {
    executiveSummary: record.aiContext.executiveSummary,
    revenueCents: record.sales.totalRevenueCents,
    orderCount: record.sales.orderCount,
    netProfitCents: record.finance.netProfitCents,
    topKpis: getTopKpis(record, 3).map((kpi) => ({
      label: kpi.label,
      changePercent: kpi.changePercent,
      trend: kpi.trend,
    })),
  };

  const aiResult = await runAnalyticsAiInference<Record<string, unknown>>(
    context,
    "generateExecutiveSummary",
    dataContext,
    "Generate executive summary. Return JSON with summary, revenueCents, revenueFormatted, orderCount, netProfitCents, topKpis, and highlights.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    summary: record.aiContext.executiveSummary,
    revenueCents: record.sales.totalRevenueCents,
    revenueFormatted: formatMoney(record.sales.totalRevenueCents),
    orderCount: record.sales.orderCount,
    netProfitCents: record.finance.netProfitCents,
    topKpis: dataContext.topKpis,
  };
}

export async function compareBranchesForAi(
  context: AnalyticsPlatformContext,
  input?: { branchIds?: string[]; metricKeys?: string[] },
): Promise<Record<string, unknown>> {
  const record = await analyticsService.getRecord(context);
  const branchIds = input?.branchIds ?? [context.branchId];
  const metricKeys = input?.metricKeys ?? ["revenue_daily", "orders_daily"];
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const comparison = compareBranchMetrics(record, { branchIds, metricKeys, periodStart, periodEnd });
  const benchmarks = rankBenchmarks(record.benchmarks);

  return {
    comparison,
    benchmarks: benchmarks.map((benchmark) => ({
      label: benchmark.label,
      percentileRank: benchmark.percentileRank,
      performance: benchmark.performance,
    })),
  };
}

export async function customerInsightsForAi(context: AnalyticsPlatformContext): Promise<Record<string, unknown>> {
  const record = await analyticsService.getRecord(context);
  return {
    totalCustomers: record.customers.totalCustomers,
    newCustomers: record.customers.newCustomers,
    returningCustomers: record.customers.returningCustomers,
    retentionRateBps: record.customers.retentionRateBps,
    averageLifetimeValueCents: record.customers.averageLifetimeValueCents,
    topSegments: record.customers.topSegments,
  };
}

export async function churnPredictionForAi(context: AnalyticsPlatformContext): Promise<Record<string, unknown>> {
  const record = await analyticsService.getRecord(context);
  const dataContext = {
    totalCustomers: record.customers.totalCustomers,
    retentionRateBps: record.customers.retentionRateBps,
    newCustomers: record.customers.newCustomers,
    returningCustomers: record.customers.returningCustomers,
    averageLifetimeValueCents: record.customers.averageLifetimeValueCents,
  };

  const aiResult = await runAnalyticsAiInference<Record<string, unknown>>(
    context,
    "churnPrediction",
    dataContext,
    "Predict customer churn. Return JSON with churnRiskBps, atRiskCustomers, retentionRateBps, and recommendations.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    retentionRateBps: record.customers.retentionRateBps,
    totalCustomers: record.customers.totalCustomers,
  };
}

export async function inventoryForecastForAi(context: AnalyticsPlatformContext): Promise<Record<string, unknown>> {
  const record = await analyticsService.getRecord(context);
  const dataContext = {
    totalSkus: record.inventory.totalSkus,
    lowStockCount: record.inventory.lowStockCount,
    turnoverRateBps: record.inventory.turnoverRateBps,
    wasteValueCents: record.inventory.wasteValueCents,
  };

  const aiResult = await runAnalyticsAiInference<Record<string, unknown>>(
    context,
    "inventoryForecast",
    dataContext,
    "Forecast inventory needs. Return JSON with totalSkus, lowStockCount, turnoverRateBps, wasteValueCents, forecastConfidence, and recommendations.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function staffingRecommendationsForAi(context: AnalyticsPlatformContext): Promise<Record<string, unknown>> {
  const record = await analyticsService.getRecord(context);
  const ordersPerStaff = record.staff.totalStaff > 0 ? record.sales.orderCount / record.staff.totalStaff : 0;
  const dataContext = {
    totalStaff: record.staff.totalStaff,
    labourCostPercentBps: record.staff.labourCostPercentBps,
    ordersPerStaff: Math.round(ordersPerStaff * 10) / 10,
    orderCount: record.sales.orderCount,
  };

  const aiResult = await runAnalyticsAiInference<Record<string, unknown>>(
    context,
    "staffingRecommendations",
    dataContext,
    "Recommend staffing levels. Return JSON with totalStaff, labourCostPercentBps, ordersPerStaff, and recommendations array.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function financialForecastForAi(context: AnalyticsPlatformContext): Promise<Record<string, unknown>> {
  const record = await analyticsService.getRecord(context);
  const snapshot = await buildAnalyticsPlatformSnapshot(context);
  const dataContext = {
    revenueCents: record.finance.revenueCents,
    expenseCents: record.finance.expenseCents,
    netProfitCents: record.finance.netProfitCents,
    grossMarginBps: record.finance.grossMarginBps,
    forecastCount: snapshot.forecastCount,
  };

  const aiResult = await runAnalyticsAiInference<Record<string, unknown>>(
    context,
    "financialForecast",
    dataContext,
    "Forecast financial performance. Return JSON with revenueCents, expenseCents, netProfitCents, grossMarginBps, projectedNetProfitCents, and confidence.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function businessHealthScoreForAi(context: AnalyticsPlatformContext): Promise<Record<string, unknown>> {
  const record = await analyticsService.getRecord(context);
  const alerts = await analyticsService.getUnacknowledgedAlerts(context);
  let score = 100;
  if (record.finance.netProfitCents < 0) score -= 20;
  if (alerts.length > 0) score -= Math.min(30, alerts.length * 5);
  if (record.customers.retentionRateBps < 5000) score -= 10;
  if (record.kitchen.onTimeRateBps < 8000) score -= 10;

  return {
    healthScore: Math.max(0, score),
    grade: score >= 80 ? "healthy" : score >= 60 ? "moderate" : "at_risk",
    drivers: {
      profitability: record.finance.netProfitCents >= 0,
      alerts: alerts.length,
      retentionBps: record.customers.retentionRateBps,
      kitchenOnTimeBps: record.kitchen.onTimeRateBps,
    },
  };
}
