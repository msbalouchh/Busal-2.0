import { DEFAULT_ANALYTICS_SCOPE } from "@/modules/analytics/constants/mock-data";
import { analyticsRepository } from "@/modules/analytics/repository/analytics-repository";
import type {
  AnalyticsPlatformContext,
  AnalyticsRecord,
} from "@/modules/analytics/types/analytics-platform";
import { getAnalyticsSummary } from "@/modules/analytics/utils/analytics-selectors";

export interface AnalyticsPlatformSnapshot {
  context: AnalyticsPlatformContext;
  record: AnalyticsRecord;
  revenueCents: number;
  orderCount: number;
  kpiCount: number;
  alertCount: number;
  criticalAlertCount: number;
  insightCount: number;
  forecastCount: number;
  dashboardCount: number;
  reportCount: number;
}

export interface AnalyticsPlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId?: string;
  branchId?: string;
  userId?: string;
  baseCurrency?: string;
}

export function buildAnalyticsPlatformContext(
  input: AnalyticsPlatformInput = {},
): AnalyticsPlatformContext {
  return {
    tenantId: input.tenantId ?? DEFAULT_ANALYTICS_SCOPE.tenantId,
    workspaceId: input.workspaceId ?? DEFAULT_ANALYTICS_SCOPE.workspaceId,
    businessId: input.businessId ?? DEFAULT_ANALYTICS_SCOPE.businessId,
    branchId: input.branchId ?? DEFAULT_ANALYTICS_SCOPE.branchId,
    userId: input.userId ?? DEFAULT_ANALYTICS_SCOPE.userId,
    baseCurrency: input.baseCurrency ?? DEFAULT_ANALYTICS_SCOPE.baseCurrency,
  };
}

export function buildAnalyticsPlatformSnapshot(
  input: AnalyticsPlatformInput = {},
): AnalyticsPlatformSnapshot {
  const context = buildAnalyticsPlatformContext(input);
  const record = analyticsRepository.getRecord();
  const criticalAlerts = analyticsRepository.getCriticalAlerts();

  return {
    context,
    record,
    revenueCents: record.sales.totalRevenueCents,
    orderCount: record.sales.orderCount,
    kpiCount: record.kpis.length,
    alertCount: record.alerts.filter((a) => !a.isAcknowledged).length,
    criticalAlertCount: criticalAlerts.length,
    insightCount: record.insights.length,
    forecastCount: record.forecasts.length,
    dashboardCount: record.dashboards.length,
    reportCount: record.reports.length,
  };
}

export function getDefaultAnalyticsSnapshot(): AnalyticsPlatformSnapshot {
  return buildAnalyticsPlatformSnapshot();
}

export function getAnalyticsPlatformSummary(input: AnalyticsPlatformInput = {}): string {
  const snapshot = buildAnalyticsPlatformSnapshot(input);
  return getAnalyticsSummary(snapshot.record);
}
