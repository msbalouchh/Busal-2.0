export {
  DASHBOARD_TYPES,
  WIDGET_TYPES,
  CHART_TYPES,
  REPORT_STATUSES,
  SCHEDULE_FREQUENCIES,
  ALERT_SEVERITIES,
  KPI_TRENDS,
  ANALYTICS_MODULE_SOURCES,
  ANALYTICS_AI_TOOL_IDS,
  ANALYTICS_PERMISSIONS,
  DASHBOARD_TYPE_LABELS,
  ALERT_SEVERITY_LABELS,
  KPI_TREND_LABELS,
  type DashboardType,
  type WidgetType,
  type ChartType,
  type ReportStatus,
  type ScheduleFrequency,
  type AlertSeverity,
  type KpiTrend,
  type AnalyticsModuleSource,
  type AnalyticsAiToolId,
  type AnalyticsPermission,
} from "@/modules/analytics/constants/analytics-status";

export {
  ANALYTICS_INTEGRATION_POINTS,
  type AnalyticsIntegrationPoint,
} from "@/modules/analytics/constants/integration-points";

export {
  ANALYTICS_PLATFORM_ROUTES,
  ANALYTICS_PLATFORM_NAV_ITEMS,
} from "@/modules/analytics/constants/platform-routes";

export {
  DEFAULT_ANALYTICS_SCOPE,
  MOCK_EXECUTIVE_DASHBOARD,
  MOCK_OPERATIONS_DASHBOARD,
  MOCK_ANALYTICS_RECORD,
} from "@/modules/analytics/constants/mock-data";

export type * from "@/modules/analytics/types/analytics-platform";

export * from "@/modules/analytics/utils/analytics-selectors";
export * from "@/modules/analytics/utils/analytics-forecast-utils";
export * from "@/modules/analytics/utils/analytics-benchmark-utils";

export {
  AnalyticsRepository,
  analyticsRepository,
} from "@/modules/analytics/repository/analytics-repository";

export { AnalyticsService, analyticsService } from "@/modules/analytics/services/analytics.service";

export {
  buildAnalyticsPlatformContext,
  buildAnalyticsPlatformSnapshot,
  getDefaultAnalyticsSnapshot,
  getAnalyticsPlatformSummary,
  type AnalyticsPlatformSnapshot,
  type AnalyticsPlatformInput,
} from "@/modules/analytics/services/analytics-platform.service";

export { AnalyticsProvider } from "@/modules/analytics/providers/analytics-provider";
export { AnalyticsContext } from "@/modules/analytics/contexts/analytics-context";

export { useAnalytics, useAnalyticsContext } from "@/modules/analytics/hooks/use-analytics";
export { useAnalyticsDashboard } from "@/modules/analytics/hooks/use-analytics-dashboard";
export { useAnalyticsReports } from "@/modules/analytics/hooks/use-analytics-reports";

export { DashboardTypeBadge } from "@/modules/analytics/components/dashboard-type-badge";
export { AlertSeverityBadge } from "@/modules/analytics/components/alert-severity-badge";
export { KpiTrendBadge } from "@/modules/analytics/components/kpi-trend-badge";

export {
  registerAnalyticsAiTools,
  ANALYTICS_AI_TOOLS,
  buildAnalyticsAiContext,
  generateReportForAi,
  explainKpiForAi,
  forecastRevenueForAi,
  forecastDemandForAi,
  detectBusinessAnomaliesForAi,
  recommendImprovementsForAi,
  generateExecutiveSummaryForAi,
  compareBranchesForAi,
} from "@/modules/analytics/ai";
