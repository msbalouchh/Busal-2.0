import type { KpiTrend } from "@/modules/analytics/constants/analytics-status";
import type {
  AnalyticsRecord,
  Benchmark,
  CompareBranchesInput,
  Dashboard,
  KPI,
} from "@/modules/analytics/types/analytics-platform";

export function formatMoney(cents: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(cents / 100);
}

export function getAnalyticsSummary(record: AnalyticsRecord): string {
  return `${formatMoney(record.sales.totalRevenueCents)} revenue — ${record.sales.orderCount.toLocaleString()} orders`;
}

export function getDashboardLabel(dashboard: Dashboard): string {
  return `${dashboard.name} (${dashboard.dashboardType})`;
}

export function getKpiChangeLabel(kpi: KPI): string {
  const sign = kpi.changePercent >= 0 ? "+" : "";
  return `${sign}${kpi.changePercent.toFixed(1)}%`;
}

export function isKpiOnTarget(kpi: KPI): boolean {
  if (kpi.targetValue === null) {
    return true;
  }

  return kpi.currentValue >= kpi.targetValue;
}

export function getKpiTrendSeverity(
  trend: KpiTrend,
  changePercent: number,
): "ok" | "warning" | "critical" {
  if (trend === "down" && changePercent < -10) {
    return "critical";
  }

  if (trend === "down" && changePercent < -5) {
    return "warning";
  }

  return "ok";
}

export function getBenchmarkPercentileLabel(benchmark: Benchmark): string {
  return `${benchmark.percentileRank}th percentile`;
}

export function compareBranchMetrics(
  record: AnalyticsRecord,
  input: CompareBranchesInput,
): Array<{ metricKey: string; branchId: string; value: number }> {
  const results: Array<{ metricKey: string; branchId: string; value: number }> = [];

  for (const branchId of input.branchIds) {
    for (const metricKey of input.metricKeys) {
      const metric = record.metrics.find((m) => m.branchId === branchId && m.key === metricKey);

      results.push({
        metricKey,
        branchId,
        value: metric?.value ?? 0,
      });
    }
  }

  return results;
}

export function getTopKpis(record: AnalyticsRecord, limit = 5): KPI[] {
  return [...record.kpis]
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, limit);
}

export function getActiveAlertCount(record: AnalyticsRecord): number {
  return record.alerts.filter((a) => !a.isAcknowledged).length;
}
