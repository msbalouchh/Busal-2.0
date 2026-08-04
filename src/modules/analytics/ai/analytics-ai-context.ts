import { ANALYTICS_MODULE_SOURCES } from "@/modules/analytics/constants/analytics-status";
import { DEFAULT_ANALYTICS_SCOPE } from "@/modules/analytics/constants/mock-data";
import { analyticsService } from "@/modules/analytics/services/analytics.service";
import {
  getBelowAverageBenchmarks,
  rankBenchmarks,
} from "@/modules/analytics/utils/analytics-benchmark-utils";
import {
  forecastDemand,
  forecastRevenue,
  getAverageConfidence,
} from "@/modules/analytics/utils/analytics-forecast-utils";
import {
  compareBranchMetrics,
  formatMoney,
  getAnalyticsSummary,
  getTopKpis,
} from "@/modules/analytics/utils/analytics-selectors";
import type { AnalyticsAiContext } from "@/modules/analytics/types/analytics-platform";
import type { AnalyticsModuleSource } from "@/modules/analytics/constants/analytics-status";

export function buildAnalyticsAiContext(): AnalyticsAiContext {
  const record = analyticsService.getRecord();

  return {
    ...record.aiContext,
    summary: getAnalyticsSummary(record),
    topInsights: record.insights.map((i) => i.title),
    lastGeneratedAt: new Date().toISOString(),
  };
}

export function generateReportForAi(input: {
  name: string;
  moduleSources?: AnalyticsModuleSource[];
  periodStart?: string;
  periodEnd?: string;
}): Record<string, unknown> {
  const report = analyticsService.generateReport({
    name: input.name,
    moduleSources: input.moduleSources ?? [
      ANALYTICS_MODULE_SOURCES.ORDERS,
      ANALYTICS_MODULE_SOURCES.FINANCE,
    ],
    branchIds: [DEFAULT_ANALYTICS_SCOPE.branchId],
    periodStart: input.periodStart ?? "2026-02-01",
    periodEnd: input.periodEnd ?? "2026-02-28",
  });

  return {
    reportId: report.id,
    name: report.name,
    kpiCount: report.kpiIds.length,
    chartCount: report.chartIds.length,
    status: report.status,
    mock: true,
  };
}

export function explainKpiForAi(input: { kpiKey?: string }): Record<string, unknown> {
  const record = analyticsService.getRecord();
  const kpi = input.kpiKey
    ? record.kpis.find((k) => k.key === input.kpiKey)
    : getTopKpis(record, 1)[0];

  if (!kpi) {
    return { success: false, error: "KPI not found", mock: true };
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
    mock: true,
  };
}

export function forecastRevenueForAi(input?: { periodsAhead?: number }): Record<string, unknown> {
  const record = analyticsService.getRecord();
  const historical = record.charts.find((c) => c.moduleSource === ANALYTICS_MODULE_SOURCES.FINANCE)
    ?.datasets[0]?.data ?? [152000, 168000, 145000, 172000, 198000, 245000, 228000];

  const periodsAhead = input?.periodsAhead ?? 4;
  const forecast = forecastRevenue({ historicalValues: historical, periodsAhead });

  return {
    currentRevenueCents: record.sales.totalRevenueCents,
    forecast,
    confidenceScore: getAverageConfidence(
      record.forecasts.filter((f) => f.forecastType === "revenue"),
    ),
    mock: true,
  };
}

export function forecastDemandForAi(input?: { periodsAhead?: number }): Record<string, unknown> {
  const record = analyticsService.getRecord();
  const historical = [180, 175, 190, 185, 200, 210, 195];
  const periodsAhead = input?.periodsAhead ?? 7;
  const forecast = forecastDemand({ historicalCounts: historical, periodsAhead });

  return {
    currentOrderCount: record.sales.orderCount,
    forecast,
    confidenceScore: getAverageConfidence(
      record.forecasts.filter((f) => f.forecastType === "demand"),
    ),
    mock: true,
  };
}

export function detectBusinessAnomaliesForAi(): Record<string, unknown> {
  const record = analyticsService.getRecord();
  const alerts = analyticsService.getUnacknowledgedAlerts();
  const critical = analyticsService.getCriticalAlerts();

  return {
    anomalyCount: alerts.length,
    criticalCount: critical.length,
    alerts: alerts.map((a) => ({
      id: a.id,
      title: a.title,
      severity: a.severity,
      moduleSource: a.moduleSource,
    })),
    insights: record.insights
      .filter((i) => i.severity === "warning" || i.severity === "critical")
      .map((i) => i.title),
    mock: true,
  };
}

export function recommendImprovementsForAi(): Record<string, unknown> {
  const record = analyticsService.getRecord();
  const belowAverage = getBelowAverageBenchmarks(record.benchmarks);
  const actions = [
    ...record.aiContext.recommendedActions,
    ...record.insights.flatMap((i) => i.recommendedActions),
  ];

  return {
    recommendations: [...new Set(actions)],
    belowAverageBenchmarks: belowAverage.map((b) => ({
      metric: b.label,
      percentileRank: b.percentileRank,
    })),
    mock: true,
  };
}

export function generateExecutiveSummaryForAi(): Record<string, unknown> {
  const record = analyticsService.getRecord();

  return {
    summary: record.aiContext.executiveSummary,
    revenueCents: record.sales.totalRevenueCents,
    revenueFormatted: formatMoney(record.sales.totalRevenueCents),
    orderCount: record.sales.orderCount,
    netProfitCents: record.finance.netProfitCents,
    topKpis: getTopKpis(record, 3).map((k) => ({
      label: k.label,
      changePercent: k.changePercent,
      trend: k.trend,
    })),
    mock: true,
  };
}

export function compareBranchesForAi(input?: {
  branchIds?: string[];
  metricKeys?: string[];
}): Record<string, unknown> {
  const record = analyticsService.getRecord();
  const branchIds = input?.branchIds ?? [DEFAULT_ANALYTICS_SCOPE.branchId];
  const metricKeys = input?.metricKeys ?? ["revenue_daily", "orders_daily"];

  const comparison = compareBranchMetrics(record, {
    branchIds,
    metricKeys,
    periodStart: "2026-02-01",
    periodEnd: "2026-02-28",
  });

  const benchmarks = rankBenchmarks(record.benchmarks);

  return {
    comparison,
    benchmarks: benchmarks.map((b) => ({
      label: b.label,
      percentileRank: b.percentileRank,
      performance: b.performance,
    })),
    mock: true,
  };
}
