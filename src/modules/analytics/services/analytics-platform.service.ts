import "server-only";

import { buildAnalyticsPlatformContext as buildContext } from "@/modules/analytics/lib/analytics-platform-context";
import type { AnalyticsTenantScope } from "@/modules/analytics/lib/analytics-scope";
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
  businessId: string;
  branchId: string;
  userId?: string;
  baseCurrency?: string;
}

export { buildContext as buildAnalyticsPlatformContext };

export async function buildAnalyticsPlatformSnapshot(
  context: AnalyticsPlatformContext,
): Promise<AnalyticsPlatformSnapshot> {
  const scope: AnalyticsTenantScope = {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
    baseCurrency: context.baseCurrency,
  };

  const record = await analyticsRepository.getRecord(scope);
  const criticalAlerts = record.alerts.filter(
    (alert) => alert.severity === "critical" && !alert.isAcknowledged,
  );

  return {
    context,
    record,
    revenueCents: record.sales.totalRevenueCents,
    orderCount: record.sales.orderCount,
    kpiCount: record.kpis.length,
    alertCount: record.alerts.filter((alert) => !alert.isAcknowledged).length,
    criticalAlertCount: criticalAlerts.length,
    insightCount: record.insights.length,
    forecastCount: record.forecasts.length,
    dashboardCount: record.dashboards.length,
    reportCount: record.reports.length,
  };
}

export async function getAnalyticsPlatformSummary(context: AnalyticsPlatformContext): Promise<string> {
  const snapshot = await buildAnalyticsPlatformSnapshot(context);
  return getAnalyticsSummary(snapshot.record);
}
