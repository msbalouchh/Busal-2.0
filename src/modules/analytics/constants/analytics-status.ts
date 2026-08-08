/** Analytics dashboard types. */
export const DASHBOARD_TYPES = {
  EXECUTIVE: "executive",
  RESTAURANT: "restaurant",
  SALES: "sales",
  OPERATIONS: "operations",
  KITCHEN: "kitchen",
  FINANCE: "finance",
  MARKETING: "marketing",
  INVENTORY: "inventory",
  STAFF: "staff",
  CRM: "crm",
  OWNER: "owner",
  CUSTOM: "custom",
} as const;

export type DashboardType = (typeof DASHBOARD_TYPES)[keyof typeof DASHBOARD_TYPES];

/** Widget display types. */
export const WIDGET_TYPES = {
  KPI: "kpi",
  CHART: "chart",
  TABLE: "table",
  METRIC: "metric",
  INSIGHT: "insight",
  ALERT: "alert",
} as const;

export type WidgetType = (typeof WIDGET_TYPES)[keyof typeof WIDGET_TYPES];

/** Chart visualization types. */
export const CHART_TYPES = {
  LINE: "line",
  BAR: "bar",
  PIE: "pie",
  AREA: "area",
  DONUT: "donut",
  HEATMAP: "heatmap",
  SCATTER: "scatter",
} as const;

export type ChartType = (typeof CHART_TYPES)[keyof typeof CHART_TYPES];

/** Report lifecycle statuses. */
export const REPORT_STATUSES = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

export type ReportStatus = (typeof REPORT_STATUSES)[keyof typeof REPORT_STATUSES];

/** Scheduled report delivery frequencies. */
export const SCHEDULE_FREQUENCIES = {
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
} as const;

export type ScheduleFrequency = (typeof SCHEDULE_FREQUENCIES)[keyof typeof SCHEDULE_FREQUENCIES];

/** Alert severity levels. */
export const ALERT_SEVERITIES = {
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "critical",
} as const;

export type AlertSeverity = (typeof ALERT_SEVERITIES)[keyof typeof ALERT_SEVERITIES];

/** KPI trend direction. */
export const KPI_TRENDS = {
  UP: "up",
  DOWN: "down",
  FLAT: "flat",
} as const;

export type KpiTrend = (typeof KPI_TRENDS)[keyof typeof KPI_TRENDS];

/** Report output formats. */
export const REPORT_EXPORT_FORMATS = {
  CSV: "csv",
  EXCEL: "excel",
  PDF: "pdf",
} as const;

export type ReportExportFormat = (typeof REPORT_EXPORT_FORMATS)[keyof typeof REPORT_EXPORT_FORMATS];

/** Report template categories. */
export const REPORT_TYPES = {
  SALES: "sales",
  REVENUE: "revenue",
  PROFIT: "profit",
  EXPENSE: "expense",
  INVENTORY: "inventory",
  WASTE: "waste",
  RESERVATION: "reservation",
  STAFF_PERFORMANCE: "staff_performance",
  CUSTOMER: "customer",
  LOYALTY: "loyalty",
  FINANCIAL_STATEMENT: "financial_statement",
  CUSTOM: "custom",
} as const;

export type ReportType = (typeof REPORT_TYPES)[keyof typeof REPORT_TYPES];

/** Cross-module analytics source keys. */
export const ANALYTICS_MODULE_SOURCES = {
  BILLING: "billing",
  FINANCE: "finance",
  CRM: "crm",
  ORDERS: "orders",
  MENU: "menu",
  TABLES: "tables",
  RESERVATIONS: "reservations",
  KITCHEN: "kitchen",
  POS: "pos",
  INVENTORY: "inventory",
  STAFF: "staff",
} as const;

export type AnalyticsModuleSource =
  (typeof ANALYTICS_MODULE_SOURCES)[keyof typeof ANALYTICS_MODULE_SOURCES];

export const ANALYTICS_AI_TOOL_IDS = {
  GENERATE_REPORT: "analytics.generate-report",
  EXPLAIN_KPI: "analytics.explain-kpi",
  FORECAST_REVENUE: "analytics.forecast-revenue",
  FORECAST_DEMAND: "analytics.forecast-demand",
  DETECT_ANOMALIES: "analytics.detect-anomalies",
  RECOMMEND_IMPROVEMENTS: "analytics.recommend-improvements",
  EXECUTIVE_SUMMARY: "analytics.executive-summary",
  COMPARE_BRANCHES: "analytics.compare-branches",
  CUSTOMER_INSIGHTS: "analytics.customer-insights",
  CHURN_PREDICTION: "analytics.churn-prediction",
  INVENTORY_FORECAST: "analytics.inventory-forecast",
  STAFFING_RECOMMENDATIONS: "analytics.staffing-recommendations",
  FINANCIAL_FORECAST: "analytics.financial-forecast",
  BUSINESS_HEALTH_SCORE: "analytics.business-health-score",
} as const;

export type AnalyticsAiToolId = (typeof ANALYTICS_AI_TOOL_IDS)[keyof typeof ANALYTICS_AI_TOOL_IDS];

/** Module-local permission markers (future RBAC wiring). */
export const ANALYTICS_PERMISSIONS = {
  READ: "analytics.read",
  MANAGE: "analytics.manage",
  DASHBOARD: "analytics.dashboard",
  REPORT: "analytics.report",
  EXPORT: "analytics.export",
  SCHEDULE: "analytics.schedule",
  ALERT: "analytics.alert",
  BENCHMARK: "analytics.benchmark",
} as const;

export type AnalyticsPermission =
  (typeof ANALYTICS_PERMISSIONS)[keyof typeof ANALYTICS_PERMISSIONS];

export const DASHBOARD_TYPE_LABELS: Record<DashboardType, string> = {
  executive: "Executive",
  restaurant: "Restaurant",
  sales: "Sales",
  operations: "Operations",
  kitchen: "Kitchen",
  finance: "Finance",
  marketing: "Marketing",
  inventory: "Inventory",
  staff: "Staff",
  crm: "CRM",
  owner: "Owner",
  custom: "Custom",
};

export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  info: "Info",
  warning: "Warning",
  critical: "Critical",
};

export const KPI_TREND_LABELS: Record<KpiTrend, string> = {
  up: "Up",
  down: "Down",
  flat: "Flat",
};
