import type {
  AlertSeverity,
  AnalyticsModuleSource,
  ChartType,
  DashboardType,
  KpiTrend,
  ReportStatus,
  ScheduleFrequency,
  WidgetType,
} from "@/modules/analytics/constants/analytics-status";

/** Configurable analytics dashboard. */
export interface Dashboard {
  id: string;
  tenantId: string;
  workspaceId: string;
  businessId: string;
  name: string;
  dashboardType: DashboardType;
  description: string;
  widgetIds: string[];
  isDefault: boolean;
  isCustom: boolean;
  branchIds: string[];
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

/** Dashboard widget (drag-and-drop capable). */
export interface DashboardWidget {
  id: string;
  dashboardId: string;
  widgetType: WidgetType;
  title: string;
  metricId: string | null;
  kpiId: string | null;
  chartId: string | null;
  reportId: string | null;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  refreshIntervalSec: number;
  moduleSource: AnalyticsModuleSource | null;
}

/** Raw metric data point. */
export interface Metric {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string | null;
  key: string;
  label: string;
  value: number;
  unit: string;
  moduleSource: AnalyticsModuleSource;
  recordedAt: string;
  periodStart: string;
  periodEnd: string;
}

/** Key performance indicator with trend. */
export interface KPI {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string | null;
  key: string;
  label: string;
  currentValue: number;
  previousValue: number;
  targetValue: number | null;
  unit: string;
  trend: KpiTrend;
  changePercent: number;
  moduleSource: AnalyticsModuleSource;
  updatedAt: string;
}

/** Chart definition with data series. */
export interface Chart {
  id: string;
  tenantId: string;
  businessId: string;
  title: string;
  chartType: ChartType;
  moduleSource: AnalyticsModuleSource;
  labels: string[];
  datasets: ChartDataset[];
  periodStart: string;
  periodEnd: string;
}

export interface ChartDataset {
  id: string;
  label: string;
  data: number[];
  color: string | null;
}

/** Analytics report definition. */
export interface Report {
  id: string;
  tenantId: string;
  businessId: string;
  name: string;
  description: string;
  status: ReportStatus;
  moduleSources: AnalyticsModuleSource[];
  chartIds: string[];
  kpiIds: string[];
  branchIds: string[];
  periodStart: string;
  periodEnd: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

/** User-saved report snapshot. */
export interface SavedReport {
  id: string;
  tenantId: string;
  businessId: string;
  reportId: string;
  name: string;
  savedAt: string;
  savedByUserId: string;
  snapshotData: Record<string, unknown>;
}

/** Scheduled report delivery. */
export interface ScheduledReport {
  id: string;
  tenantId: string;
  businessId: string;
  reportId: string;
  name: string;
  frequency: ScheduleFrequency;
  recipientEmails: string[];
  nextRunAt: string;
  lastRunAt: string | null;
  isActive: boolean;
  createdAt: string;
}

/** AI-generated or rule-based business insight. */
export interface BusinessInsight {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string | null;
  title: string;
  summary: string;
  moduleSource: AnalyticsModuleSource;
  severity: AlertSeverity;
  impactScore: number;
  recommendedActions: string[];
  generatedAt: string;
}

/** Forecast projection. */
export interface Forecast {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string | null;
  forecastType: "revenue" | "demand" | "inventory" | "staffing";
  moduleSource: AnalyticsModuleSource;
  periodStart: string;
  periodEnd: string;
  projectedValues: ForecastDataPoint[];
  confidenceScore: number;
  generatedAt: string;
}

export interface ForecastDataPoint {
  date: string;
  value: number;
  lowerBound: number;
  upperBound: number;
}

/** Analytics alert. */
export interface Alert {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string | null;
  title: string;
  message: string;
  severity: AlertSeverity;
  moduleSource: AnalyticsModuleSource;
  metricKey: string;
  thresholdValue: number;
  actualValue: number;
  isAcknowledged: boolean;
  triggeredAt: string;
}

/** Industry or internal benchmark. */
export interface Benchmark {
  id: string;
  tenantId: string;
  businessId: string;
  metricKey: string;
  label: string;
  businessValue: number;
  industryAverage: number;
  topPerformerValue: number;
  percentileRank: number;
  moduleSource: AnalyticsModuleSource;
  periodStart: string;
  periodEnd: string;
}

/** Cross-module sales analytics. */
export interface SalesAnalytics {
  tenantId: string;
  businessId: string;
  branchId: string | null;
  totalRevenueCents: number;
  orderCount: number;
  averageOrderValueCents: number;
  topSellingItems: Array<{ itemId: string; name: string; quantity: number; revenueCents: number }>;
  revenueByHour: Array<{ hour: number; revenueCents: number }>;
  periodStart: string;
  periodEnd: string;
}

/** Customer analytics from CRM. */
export interface CustomerAnalytics {
  tenantId: string;
  businessId: string;
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  retentionRateBps: number;
  averageLifetimeValueCents: number;
  topSegments: Array<{ segment: string; count: number; revenueCents: number }>;
  periodStart: string;
  periodEnd: string;
}

/** Menu performance analytics. */
export interface MenuAnalytics {
  tenantId: string;
  businessId: string;
  branchId: string | null;
  totalItems: number;
  activeItems: number;
  topPerformers: Array<{ itemId: string; name: string; orders: number; revenueCents: number }>;
  underperformers: Array<{ itemId: string; name: string; orders: number }>;
  categoryBreakdown: Array<{ category: string; revenueCents: number; orderCount: number }>;
  periodStart: string;
  periodEnd: string;
}

/** Reservation analytics. */
export interface ReservationAnalytics {
  tenantId: string;
  businessId: string;
  branchId: string | null;
  totalReservations: number;
  confirmedCount: number;
  cancelledCount: number;
  noShowCount: number;
  noShowRateBps: number;
  averagePartySize: number;
  peakHours: Array<{ hour: number; count: number }>;
  periodStart: string;
  periodEnd: string;
}

/** Kitchen operations analytics. */
export interface KitchenAnalytics {
  tenantId: string;
  businessId: string;
  branchId: string | null;
  totalTickets: number;
  averagePrepTimeMin: number;
  onTimeRateBps: number;
  stationBreakdown: Array<{ station: string; ticketCount: number; avgPrepTimeMin: number }>;
  rushHourPeak: string;
  periodStart: string;
  periodEnd: string;
}

/** Inventory analytics. */
export interface InventoryAnalytics {
  tenantId: string;
  businessId: string;
  branchId: string | null;
  totalSkus: number;
  lowStockCount: number;
  wasteValueCents: number;
  turnoverRateBps: number;
  topConsumedItems: Array<{ itemId: string; name: string; quantityUsed: number }>;
  periodStart: string;
  periodEnd: string;
}

/** Staff and labour analytics. */
export interface StaffAnalytics {
  tenantId: string;
  businessId: string;
  branchId: string | null;
  totalStaff: number;
  activeShifts: number;
  labourCostCents: number;
  labourCostPercentBps: number;
  overtimeHours: number;
  attendanceRateBps: number;
  periodStart: string;
  periodEnd: string;
}

/** Finance analytics rollup. */
export interface FinanceAnalytics {
  tenantId: string;
  businessId: string;
  revenueCents: number;
  expenseCents: number;
  netProfitCents: number;
  grossMarginBps: number;
  accountsReceivableCents: number;
  cashOnHandCents: number;
  periodStart: string;
  periodEnd: string;
}

/** Billing/subscription analytics rollup. */
export interface BillingAnalytics {
  tenantId: string;
  mrrCents: number;
  arrCents: number;
  activeSubscriptions: number;
  churnRateBps: number;
  upgradeCount: number;
  downgradeCount: number;
  periodStart: string;
  periodEnd: string;
}

/** AI-enriched analytics context. */
export interface AnalyticsAiContext {
  tenantId: string;
  summary: string;
  topInsights: string[];
  anomalyCount: number;
  forecastConfidence: number;
  recommendedActions: string[];
  executiveSummary: string;
  lastGeneratedAt: string;
}

/** Full analytics aggregate — single source of truth. */
export interface AnalyticsRecord {
  dashboards: Dashboard[];
  widgets: DashboardWidget[];
  metrics: Metric[];
  kpis: KPI[];
  charts: Chart[];
  reports: Report[];
  savedReports: SavedReport[];
  scheduledReports: ScheduledReport[];
  insights: BusinessInsight[];
  forecasts: Forecast[];
  alerts: Alert[];
  benchmarks: Benchmark[];
  sales: SalesAnalytics;
  customers: CustomerAnalytics;
  menu: MenuAnalytics;
  reservations: ReservationAnalytics;
  kitchen: KitchenAnalytics;
  inventory: InventoryAnalytics;
  staff: StaffAnalytics;
  finance: FinanceAnalytics;
  billing: BillingAnalytics;
  aiContext: AnalyticsAiContext;
}

export interface AnalyticsSearchQuery {
  query?: string;
  tenantId?: string;
  businessId?: string;
  branchId?: string;
  moduleSource?: AnalyticsModuleSource;
  dashboardType?: DashboardType;
  limit?: number;
}

export interface GenerateReportInput {
  name: string;
  moduleSources: AnalyticsModuleSource[];
  branchIds: string[];
  periodStart: string;
  periodEnd: string;
}

export interface CompareBranchesInput {
  branchIds: string[];
  metricKeys: string[];
  periodStart: string;
  periodEnd: string;
}

export interface AnalyticsPlatformContext {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
  baseCurrency: string;
}

export interface AnalyticsContextValue {
  context: AnalyticsPlatformContext;
  record: AnalyticsRecord;
  selectedDashboardId: string | null;
  selectedDashboard: Dashboard | null;
  selectDashboard: (dashboardId: string | null) => void;
  refresh: () => void;
}

export interface AnalyticsDashboardContextValue {
  dashboards: Dashboard[];
  widgets: DashboardWidget[];
  kpis: KPI[];
  selectedDashboardId: string | null;
  selectDashboard: (dashboardId: string | null) => void;
  refresh: () => void;
}

export interface AnalyticsReportsContextValue {
  reports: Report[];
  savedReports: SavedReport[];
  scheduledReports: ScheduledReport[];
  refresh: () => void;
}
