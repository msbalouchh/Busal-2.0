import "server-only";

import type { Decimal } from "@prisma/client/runtime/library";
import type { OrderPayment, Reservation, RestaurantOrder } from "@prisma/client";

import {
  ALERT_SEVERITIES,
  ANALYTICS_MODULE_SOURCES,
  CHART_TYPES,
  DASHBOARD_TYPES,
  KPI_TRENDS,
  REPORT_STATUSES,
  REPORT_TYPES,
  type AnalyticsModuleSource,
  type DashboardType,
  type KpiTrend,
} from "@/modules/analytics/constants/analytics-status";
import type { AnalyticsTenantScope } from "@/modules/analytics/lib/analytics-scope";
import type {
  Alert,
  AnalyticsAiContext,
  AnalyticsRecord,
  Benchmark,
  BillingAnalytics,
  BusinessInsight,
  Chart,
  CustomerAnalytics,
  Dashboard,
  DashboardLayout,
  DashboardWidget,
  DataSource,
  FinanceAnalytics,
  Forecast,
  InventoryAnalytics,
  KPI,
  KitchenAnalytics,
  MenuAnalytics,
  Metric,
  Report,
  ReportTemplate,
  ReservationAnalytics,
  SalesAnalytics,
  SavedReport,
  SavedView,
  ScheduledReport,
  StaffAnalytics,
} from "@/modules/analytics/types/analytics-platform";

export interface StoredAnalyticsBranchMeta {
  dashboards: Dashboard[];
  widgets: DashboardWidget[];
  reports: Report[];
  reportTemplates: ReportTemplate[];
  scheduledReports: ScheduledReport[];
  savedReports: SavedReport[];
  alerts: Alert[];
  benchmarks: Benchmark[];
  forecasts: Forecast[];
  dataSources: DataSource[];
  dashboardLayouts: DashboardLayout[];
  savedViews: SavedView[];
}

export interface OperationalAnalyticsData {
  currentOrders: RestaurantOrder[];
  previousOrders: RestaurantOrder[];
  currentPayments: OrderPayment[];
  previousPayments: OrderPayment[];
  currentReservations: Reservation[];
  previousReservations: Reservation[];
  customerCount: number;
  newCustomers: number;
  returningCustomers: number;
  averageLifetimeValueCents: number;
  inventorySkuCount: number;
  lowStockCount: number;
  staffCount: number;
  menuItemCount: number;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function decimalToCents(value: Decimal | number): number {
  return Math.round(Number(value) * 100);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function computeTrend(current: number, previous: number): { trend: KpiTrend; changePercent: number } {
  if (previous === 0) {
    return { trend: current >= 0 ? KPI_TRENDS.UP : KPI_TRENDS.FLAT, changePercent: 0 };
  }

  const changePercent = ((current - previous) / previous) * 100;
  if (Math.abs(changePercent) < 1) {
    return { trend: KPI_TRENDS.FLAT, changePercent };
  }

  return {
    trend: changePercent > 0 ? KPI_TRENDS.UP : KPI_TRENDS.DOWN,
    changePercent: Math.round(changePercent * 10) / 10,
  };
}

function sumOrderRevenue(orders: RestaurantOrder[]): number {
  return orders.reduce((sum, order) => sum + decimalToCents(order.totalAmount), 0);
}

function getPeriodBounds(reference = new Date()): {
  start: string;
  end: string;
  previousStart: string;
  previousEnd: string;
} {
  const startDate = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const endDate = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  const previousEndDate = new Date(startDate);
  previousEndDate.setDate(0);
  const previousStartDate = new Date(previousEndDate.getFullYear(), previousEndDate.getMonth(), 1);

  return {
    start: isoDate(startDate),
    end: isoDate(endDate),
    previousStart: isoDate(previousStartDate),
    previousEnd: isoDate(previousEndDate),
  };
}

function seedDashboard(
  scope: AnalyticsTenantScope,
  type: DashboardType,
  name: string,
  description: string,
  isDefault: boolean,
): Dashboard {
  const now = new Date().toISOString();
  return {
    id: createId(`dash-${type}`),
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    name,
    dashboardType: type,
    description,
    widgetIds: [],
    isDefault,
    isCustom: false,
    branchIds: [scope.branchId],
    createdByUserId: scope.userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

export function defaultBranchAnalyticsMeta(scope: AnalyticsTenantScope): StoredAnalyticsBranchMeta {
  const now = new Date().toISOString();
  const dashboards = [
    seedDashboard(scope, DASHBOARD_TYPES.EXECUTIVE, "Executive Dashboard", "High-level business performance", true),
    seedDashboard(scope, DASHBOARD_TYPES.RESTAURANT, "Restaurant Dashboard", "Restaurant operations overview", false),
    seedDashboard(scope, DASHBOARD_TYPES.SALES, "Sales Dashboard", "Sales and revenue performance", false),
    seedDashboard(scope, DASHBOARD_TYPES.FINANCE, "Finance Dashboard", "Financial KPIs and statements", false),
    seedDashboard(scope, DASHBOARD_TYPES.INVENTORY, "Inventory Dashboard", "Stock and waste analytics", false),
    seedDashboard(scope, DASHBOARD_TYPES.STAFF, "Staff Dashboard", "Labour and productivity metrics", false),
    seedDashboard(scope, DASHBOARD_TYPES.CRM, "CRM Dashboard", "Customer and loyalty analytics", false),
    seedDashboard(scope, DASHBOARD_TYPES.MARKETING, "Marketing Dashboard", "Campaign and acquisition metrics", false),
    seedDashboard(scope, DASHBOARD_TYPES.OPERATIONS, "Operations Dashboard", "Cross-module operations KPIs", false),
  ];

  const reportTemplates: ReportTemplate[] = Object.values(REPORT_TYPES).map((reportType) => ({
    id: createId(`tmpl-${reportType}`),
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    name: `${reportType.replace(/_/g, " ")} template`,
    description: `System template for ${reportType} reports`,
    reportType,
    moduleSources: [ANALYTICS_MODULE_SOURCES.ORDERS],
    defaultChartIds: [],
    defaultKpiIds: [],
    isSystem: true,
    createdByUserId: scope.userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }));

  const dataSources: DataSource[] = Object.values(ANALYTICS_MODULE_SOURCES).map((moduleSource) => ({
    id: createId(`ds-${moduleSource}`),
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    name: `${moduleSource} data source`,
    moduleSource,
    connectionType: "prisma" as const,
    isActive: true,
    lastSyncedAt: now,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }));

  return {
    dashboards,
    widgets: [],
    reports: [],
    reportTemplates,
    scheduledReports: [],
    savedReports: [],
    alerts: [],
    benchmarks: [],
    forecasts: [],
    dataSources,
    dashboardLayouts: [],
    savedViews: [],
  };
}

function buildSalesAnalytics(
  scope: AnalyticsTenantScope,
  data: OperationalAnalyticsData,
  period: ReturnType<typeof getPeriodBounds>,
): SalesAnalytics {
  const totalRevenueCents = sumOrderRevenue(data.currentOrders);
  const orderCount = data.currentOrders.length;
  const averageOrderValueCents = orderCount > 0 ? Math.round(totalRevenueCents / orderCount) : 0;
  const revenueByHourMap = new Map<number, number>();

  for (const order of data.currentOrders) {
    const hour = order.placedAt.getHours();
    revenueByHourMap.set(hour, (revenueByHourMap.get(hour) ?? 0) + decimalToCents(order.totalAmount));
  }

  return {
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    totalRevenueCents,
    orderCount,
    averageOrderValueCents,
    topSellingItems: [],
    revenueByHour: [...revenueByHourMap.entries()]
      .sort(([a], [b]) => a - b)
      .map(([hour, revenueCents]) => ({ hour, revenueCents })),
    periodStart: period.start,
    periodEnd: period.end,
  };
}

function buildCustomerAnalytics(
  scope: AnalyticsTenantScope,
  data: OperationalAnalyticsData,
  period: ReturnType<typeof getPeriodBounds>,
): CustomerAnalytics {
  const retentionRateBps =
    data.customerCount > 0 ? Math.round((data.returningCustomers / data.customerCount) * 10000) : 0;

  return {
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    totalCustomers: data.customerCount,
    newCustomers: data.newCustomers,
    returningCustomers: data.returningCustomers,
    retentionRateBps,
    averageLifetimeValueCents: data.averageLifetimeValueCents,
    topSegments: [],
    periodStart: period.start,
    periodEnd: period.end,
  };
}

function buildReservationAnalytics(
  scope: AnalyticsTenantScope,
  data: OperationalAnalyticsData,
  period: ReturnType<typeof getPeriodBounds>,
): ReservationAnalytics {
  const total = data.currentReservations.length;
  const confirmed = data.currentReservations.filter(
    (r) => r.status === "CONFIRMED" || r.status === "SEATED",
  ).length;
  const cancelled = data.currentReservations.filter((r) => r.status === "CANCELLED").length;
  const noShow = data.currentReservations.filter((r) => r.status === "NO_SHOW").length;
  const noShowRateBps = total > 0 ? Math.round((noShow / total) * 10000) : 0;
  const averagePartySize =
    total > 0
      ? Math.round(
          data.currentReservations.reduce((sum, reservation) => sum + reservation.partySize, 0) / total,
        )
      : 0;

  return {
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    totalReservations: total,
    confirmedCount: confirmed,
    cancelledCount: cancelled,
    noShowCount: noShow,
    noShowRateBps,
    averagePartySize,
    peakHours: [],
    periodStart: period.start,
    periodEnd: period.end,
  };
}

function buildKitchenAnalytics(
  scope: AnalyticsTenantScope,
  data: OperationalAnalyticsData,
  period: ReturnType<typeof getPeriodBounds>,
): KitchenAnalytics {
  const tickets = data.currentOrders.filter((order) => order.kitchenAcceptedAt);
  const prepTimes = tickets
    .filter((order) => order.kitchenAcceptedAt && order.kitchenReadyAt)
    .map((order) => {
      const start = order.kitchenAcceptedAt!.getTime();
      const end = order.kitchenReadyAt!.getTime();
      return (end - start) / 60000;
    });

  const averagePrepTimeMin =
    prepTimes.length > 0 ? Math.round((prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length) * 10) / 10 : 0;
  const onTimeCount = prepTimes.filter((minutes) => minutes <= 20).length;
  const onTimeRateBps = prepTimes.length > 0 ? Math.round((onTimeCount / prepTimes.length) * 10000) : 0;

  return {
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    totalTickets: tickets.length,
    averagePrepTimeMin,
    onTimeRateBps,
    stationBreakdown: [],
    rushHourPeak: "18:00",
    periodStart: period.start,
    periodEnd: period.end,
  };
}

function buildInventoryAnalytics(
  scope: AnalyticsTenantScope,
  data: OperationalAnalyticsData,
  period: ReturnType<typeof getPeriodBounds>,
): InventoryAnalytics {
  return {
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    totalSkus: data.inventorySkuCount,
    lowStockCount: data.lowStockCount,
    wasteValueCents: 0,
    turnoverRateBps: 0,
    topConsumedItems: [],
    periodStart: period.start,
    periodEnd: period.end,
  };
}

function buildStaffAnalytics(
  scope: AnalyticsTenantScope,
  data: OperationalAnalyticsData,
  sales: SalesAnalytics,
  period: ReturnType<typeof getPeriodBounds>,
): StaffAnalytics {
  const labourCostCents = Math.round(sales.totalRevenueCents * 0.28);
  const labourCostPercentBps =
    sales.totalRevenueCents > 0 ? Math.round((labourCostCents / sales.totalRevenueCents) * 10000) : 0;

  return {
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    totalStaff: data.staffCount,
    activeShifts: 0,
    labourCostCents,
    labourCostPercentBps,
    overtimeHours: 0,
    attendanceRateBps: 9500,
    periodStart: period.start,
    periodEnd: period.end,
  };
}

function buildFinanceAnalytics(
  scope: AnalyticsTenantScope,
  sales: SalesAnalytics,
  staff: StaffAnalytics,
  period: ReturnType<typeof getPeriodBounds>,
): FinanceAnalytics {
  const expenseCents = staff.labourCostCents + Math.round(sales.totalRevenueCents * 0.32);
  const netProfitCents = sales.totalRevenueCents - expenseCents;
  const grossMarginBps =
    sales.totalRevenueCents > 0
      ? Math.round(
          ((sales.totalRevenueCents - Math.round(sales.totalRevenueCents * 0.35)) / sales.totalRevenueCents) *
            10000,
        )
      : 0;

  return {
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    revenueCents: sales.totalRevenueCents,
    expenseCents,
    netProfitCents,
    grossMarginBps,
    accountsReceivableCents: 0,
    cashOnHandCents: Math.max(0, netProfitCents),
    periodStart: period.start,
    periodEnd: period.end,
  };
}

function buildMenuAnalytics(
  scope: AnalyticsTenantScope,
  data: OperationalAnalyticsData,
  period: ReturnType<typeof getPeriodBounds>,
): MenuAnalytics {
  return {
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    totalItems: data.menuItemCount,
    activeItems: data.menuItemCount,
    topPerformers: [],
    underperformers: [],
    categoryBreakdown: [],
    periodStart: period.start,
    periodEnd: period.end,
  };
}

function buildBillingAnalytics(scope: AnalyticsTenantScope, period: ReturnType<typeof getPeriodBounds>): BillingAnalytics {
  return {
    tenantId: scope.tenantId,
    mrrCents: 0,
    arrCents: 0,
    activeSubscriptions: 1,
    churnRateBps: 0,
    upgradeCount: 0,
    downgradeCount: 0,
    periodStart: period.start,
    periodEnd: period.end,
  };
}

function buildKpis(
  scope: AnalyticsTenantScope,
  sales: SalesAnalytics,
  data: OperationalAnalyticsData,
  finance: FinanceAnalytics,
  reservations: ReservationAnalytics,
  staff: StaffAnalytics,
  customers: CustomerAnalytics,
  kitchen: KitchenAnalytics,
  inventory: InventoryAnalytics,
  period: ReturnType<typeof getPeriodBounds>,
): KPI[] {
  const now = new Date().toISOString();
  const previousRevenue = sumOrderRevenue(data.previousOrders);
  const previousOrders = data.previousOrders.length;
  const previousReservations = data.previousReservations.length;

  const kpiDefs = [
    { key: "total_revenue", label: "Revenue", current: sales.totalRevenueCents, previous: previousRevenue, target: previousRevenue > 0 ? Math.round(previousRevenue * 1.1) : null, unit: "GBP_cents", moduleSource: ANALYTICS_MODULE_SOURCES.POS },
    { key: "net_profit", label: "Profit", current: finance.netProfitCents, previous: previousRevenue - Math.round(previousRevenue * 0.6), target: null, unit: "GBP_cents", moduleSource: ANALYTICS_MODULE_SOURCES.FINANCE },
    { key: "total_expenses", label: "Expenses", current: finance.expenseCents, previous: Math.round(previousRevenue * 0.6), target: null, unit: "GBP_cents", moduleSource: ANALYTICS_MODULE_SOURCES.FINANCE },
    { key: "order_count", label: "Orders", current: sales.orderCount, previous: previousOrders, target: previousOrders > 0 ? Math.round(previousOrders * 1.05) : null, unit: "count", moduleSource: ANALYTICS_MODULE_SOURCES.ORDERS },
    { key: "average_order_value", label: "Average Order Value", current: sales.averageOrderValueCents, previous: previousOrders > 0 ? Math.round(sumOrderRevenue(data.previousOrders) / previousOrders) : 0, target: null, unit: "GBP_cents", moduleSource: ANALYTICS_MODULE_SOURCES.POS },
    { key: "customer_lifetime_value", label: "Customer Lifetime Value", current: customers.averageLifetimeValueCents, previous: customers.averageLifetimeValueCents, target: null, unit: "GBP_cents", moduleSource: ANALYTICS_MODULE_SOURCES.CRM },
    { key: "reservation_rate", label: "Reservation Rate", current: reservations.totalReservations, previous: previousReservations, target: null, unit: "count", moduleSource: ANALYTICS_MODULE_SOURCES.RESERVATIONS },
    { key: "kitchen_performance", label: "Kitchen Performance", current: kitchen.onTimeRateBps, previous: kitchen.onTimeRateBps, target: 9000, unit: "bps", moduleSource: ANALYTICS_MODULE_SOURCES.KITCHEN },
    { key: "inventory_turnover", label: "Inventory Turnover", current: inventory.turnoverRateBps, previous: inventory.turnoverRateBps, target: null, unit: "bps", moduleSource: ANALYTICS_MODULE_SOURCES.INVENTORY },
    { key: "waste_percent", label: "Waste %", current: inventory.wasteValueCents, previous: 0, target: 500, unit: "bps", moduleSource: ANALYTICS_MODULE_SOURCES.INVENTORY },
    { key: "staff_productivity", label: "Staff Productivity", current: staff.totalStaff > 0 ? Math.round(sales.orderCount / staff.totalStaff) : 0, previous: 0, target: null, unit: "count", moduleSource: ANALYTICS_MODULE_SOURCES.STAFF },
    { key: "payroll_cost", label: "Payroll Cost", current: staff.labourCostCents, previous: Math.round(previousRevenue * 0.28), target: null, unit: "GBP_cents", moduleSource: ANALYTICS_MODULE_SOURCES.STAFF },
    { key: "repeat_customers", label: "Repeat Customers", current: customers.returningCustomers, previous: customers.returningCustomers, target: null, unit: "count", moduleSource: ANALYTICS_MODULE_SOURCES.CRM },
  ] satisfies Array<{ key: string; label: string; current: number; previous: number; target: number | null; unit: string; moduleSource: AnalyticsModuleSource }>;

  return kpiDefs.map((def) => {
    const { trend, changePercent } = computeTrend(def.current, def.previous);
    return {
      id: createId(`kpi-${def.key}`),
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      key: def.key,
      label: def.label,
      currentValue: def.current,
      previousValue: def.previous,
      targetValue: def.target,
      unit: def.unit,
      trend,
      changePercent,
      moduleSource: def.moduleSource,
      updatedAt: now,
    };
  });
}

function buildCharts(scope: AnalyticsTenantScope, sales: SalesAnalytics, period: ReturnType<typeof getPeriodBounds>): Chart[] {
  const labels = sales.revenueByHour.map((entry) => `${entry.hour}:00`);
  const data = sales.revenueByHour.map((entry) => entry.revenueCents);

  return [
    {
      id: createId("chart-revenue"),
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      title: "Revenue by Hour",
      chartType: CHART_TYPES.LINE,
      moduleSource: ANALYTICS_MODULE_SOURCES.FINANCE,
      labels: labels.length > 0 ? labels : ["No data"],
      datasets: [{ id: createId("ds-revenue"), label: "Revenue", data: data.length > 0 ? data : [0], color: "#2563eb" }],
      periodStart: period.start,
      periodEnd: period.end,
    },
  ];
}

function buildMetrics(scope: AnalyticsTenantScope, sales: SalesAnalytics, period: ReturnType<typeof getPeriodBounds>): Metric[] {
  const now = new Date().toISOString();
  return [
    {
      id: createId("metric-revenue-daily"),
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      key: "revenue_daily",
      label: "Daily Revenue",
      value: sales.orderCount > 0 ? Math.round(sales.totalRevenueCents / Math.max(1, sales.orderCount)) : 0,
      unit: "GBP_cents",
      moduleSource: ANALYTICS_MODULE_SOURCES.POS,
      recordedAt: now,
      periodStart: period.start,
      periodEnd: period.end,
    },
    {
      id: createId("metric-orders-daily"),
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      key: "orders_daily",
      label: "Daily Orders",
      value: sales.orderCount,
      unit: "count",
      moduleSource: ANALYTICS_MODULE_SOURCES.ORDERS,
      recordedAt: now,
      periodStart: period.start,
      periodEnd: period.end,
    },
  ];
}

function buildForecasts(scope: AnalyticsTenantScope, sales: SalesAnalytics, period: ReturnType<typeof getPeriodBounds>): Forecast[] {
  const now = new Date().toISOString();
  const dailyAvg = sales.orderCount > 0 ? Math.round(sales.totalRevenueCents / 30) : 0;
  const projectedValues = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index + 1);
    const value = dailyAvg + index * 1000;
    return { date: isoDate(date), value, lowerBound: Math.round(value * 0.9), upperBound: Math.round(value * 1.1) };
  });

  return [
    {
      id: createId("forecast-revenue"),
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      forecastType: "revenue",
      moduleSource: ANALYTICS_MODULE_SOURCES.FINANCE,
      periodStart: period.start,
      periodEnd: period.end,
      projectedValues,
      confidenceScore: sales.totalRevenueCents > 0 ? 0.82 : 0.5,
      generatedAt: now,
    },
  ];
}

function buildInsights(scope: AnalyticsTenantScope, sales: SalesAnalytics, finance: FinanceAnalytics, alerts: Alert[]): BusinessInsight[] {
  const now = new Date().toISOString();
  const insights: BusinessInsight[] = [{
    id: createId("insight-revenue"),
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    title: "Revenue performance",
    summary: `Revenue for the current period is £${(sales.totalRevenueCents / 100).toFixed(2)} across ${sales.orderCount} orders.`,
    moduleSource: ANALYTICS_MODULE_SOURCES.POS,
    severity: ALERT_SEVERITIES.INFO,
    impactScore: 0.4,
    recommendedActions: ["Review peak-hour staffing"],
    generatedAt: now,
  }];

  if (finance.netProfitCents < 0) {
    insights.push({
      id: createId("insight-profit"),
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      title: "Negative net profit",
      summary: "Expenses exceed revenue for the current period.",
      moduleSource: ANALYTICS_MODULE_SOURCES.FINANCE,
      severity: ALERT_SEVERITIES.WARNING,
      impactScore: 0.75,
      recommendedActions: ["Review labour costs"],
      generatedAt: now,
    });
  }

  if (alerts.some((alert) => alert.severity === ALERT_SEVERITIES.CRITICAL)) {
    insights.push({
      id: createId("insight-alerts"),
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      title: "Critical alerts active",
      summary: "Critical analytics alerts require attention.",
      moduleSource: ANALYTICS_MODULE_SOURCES.ORDERS,
      severity: ALERT_SEVERITIES.CRITICAL,
      impactScore: 0.9,
      recommendedActions: ["Acknowledge critical alerts"],
      generatedAt: now,
    });
  }

  return insights;
}

function buildBenchmarks(scope: AnalyticsTenantScope, kpis: KPI[], period: ReturnType<typeof getPeriodBounds>): Benchmark[] {
  return kpis.slice(0, 5).map((kpi) => ({
    id: createId(`bench-${kpi.key}`),
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    metricKey: kpi.key,
    label: kpi.label,
    businessValue: kpi.currentValue,
    industryAverage: kpi.previousValue || kpi.currentValue,
    topPerformerValue: Math.round((kpi.previousValue || kpi.currentValue) * 1.15),
    percentileRank: kpi.changePercent >= 0 ? 72 : 48,
    moduleSource: kpi.moduleSource,
    periodStart: period.start,
    periodEnd: period.end,
  }));
}

function buildAlerts(scope: AnalyticsTenantScope, kpis: KPI[]): Alert[] {
  const now = new Date().toISOString();
  const revenueKpi = kpis.find((kpi) => kpi.key === "total_revenue");
  if (!revenueKpi || revenueKpi.trend !== KPI_TRENDS.DOWN || revenueKpi.changePercent >= -10) {
    return [];
  }

  return [{
    id: createId("alert-revenue"),
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    title: "Revenue decline",
    message: `Revenue is down ${Math.abs(revenueKpi.changePercent).toFixed(1)}% vs previous period`,
    severity: ALERT_SEVERITIES.WARNING,
    moduleSource: ANALYTICS_MODULE_SOURCES.FINANCE,
    metricKey: revenueKpi.key,
    thresholdValue: revenueKpi.previousValue,
    actualValue: revenueKpi.currentValue,
    isAcknowledged: false,
    triggeredAt: now,
  }];
}

function buildAiContext(scope: AnalyticsTenantScope, sales: SalesAnalytics, finance: FinanceAnalytics, insights: BusinessInsight[], forecasts: Forecast[]): AnalyticsAiContext {
  return {
    tenantId: scope.tenantId,
    summary: `£${(sales.totalRevenueCents / 100).toFixed(0)} revenue — ${sales.orderCount} orders`,
    topInsights: insights.map((insight) => insight.title),
    anomalyCount: insights.filter((insight) => insight.severity !== ALERT_SEVERITIES.INFO).length,
    forecastConfidence: forecasts.length > 0 ? forecasts.reduce((sum, f) => sum + f.confidenceScore, 0) / forecasts.length : 0.5,
    recommendedActions: insights.flatMap((i) => i.recommendedActions).slice(0, 5),
    executiveSummary: `Business generated £${(sales.totalRevenueCents / 100).toFixed(0)} in revenue with net profit of £${(finance.netProfitCents / 100).toFixed(0)}.`,
    lastGeneratedAt: new Date().toISOString(),
  };
}

export function buildAnalyticsRecord(scope: AnalyticsTenantScope, meta: StoredAnalyticsBranchMeta, data: OperationalAnalyticsData): AnalyticsRecord {
  const period = getPeriodBounds();
  const sales = buildSalesAnalytics(scope, data, period);
  const customers = buildCustomerAnalytics(scope, data, period);
  const reservations = buildReservationAnalytics(scope, data, period);
  const kitchen = buildKitchenAnalytics(scope, data, period);
  const inventory = buildInventoryAnalytics(scope, data, period);
  const staff = buildStaffAnalytics(scope, data, sales, period);
  const finance = buildFinanceAnalytics(scope, sales, staff, period);
  const menu = buildMenuAnalytics(scope, data, period);
  const billing = buildBillingAnalytics(scope, period);
  const kpis = buildKpis(scope, sales, data, finance, reservations, staff, customers, kitchen, inventory, period);
  const computedAlerts = [...meta.alerts.filter((a) => !a.isAcknowledged), ...buildAlerts(scope, kpis)];
  const charts = buildCharts(scope, sales, period);
  const forecasts = meta.forecasts.length > 0 ? meta.forecasts : buildForecasts(scope, sales, period);
  const insights = buildInsights(scope, sales, finance, computedAlerts);
  const benchmarks = meta.benchmarks.length > 0 ? meta.benchmarks : buildBenchmarks(scope, kpis, period);

  return {
    dashboards: meta.dashboards.filter((d) => d.deletedAt === null),
    widgets: meta.widgets,
    metrics: buildMetrics(scope, sales, period),
    kpis,
    charts,
    reports: meta.reports.filter((r) => r.deletedAt === null),
    reportTemplates: meta.reportTemplates.filter((t) => t.deletedAt === null),
    savedReports: meta.savedReports,
    scheduledReports: meta.scheduledReports,
    insights,
    forecasts,
    alerts: computedAlerts,
    benchmarks,
    dataSources: meta.dataSources.filter((s) => s.deletedAt === null),
    dashboardLayouts: meta.dashboardLayouts.filter((l) => l.deletedAt === null),
    savedViews: meta.savedViews.filter((v) => v.deletedAt === null),
    sales,
    customers,
    menu,
    reservations,
    kitchen,
    inventory,
    staff,
    finance,
    billing,
    aiContext: buildAiContext(scope, sales, finance, insights, forecasts),
  };
}

export function createDashboardRecord(scope: AnalyticsTenantScope, input: { name: string; dashboardType: DashboardType; description: string; branchIds: string[]; isDefault?: boolean }): Dashboard {
  const now = new Date().toISOString();
  return {
    id: createId("dash"),
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    name: input.name,
    dashboardType: input.dashboardType,
    description: input.description,
    widgetIds: [],
    isDefault: input.isDefault ?? false,
    isCustom: true,
    branchIds: input.branchIds,
    createdByUserId: scope.userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

export function createReportRecord(scope: AnalyticsTenantScope, input: { name: string; description: string; moduleSources: AnalyticsModuleSource[]; branchIds: string[]; periodStart: string; periodEnd: string; chartIds: string[]; kpiIds: string[] }): Report {
  const now = new Date().toISOString();
  return {
    id: createId("report"),
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    name: input.name,
    description: input.description,
    status: REPORT_STATUSES.DRAFT,
    moduleSources: input.moduleSources,
    chartIds: input.chartIds,
    kpiIds: input.kpiIds,
    branchIds: input.branchIds,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    createdByUserId: scope.userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

export function createWidgetRecord(scope: AnalyticsTenantScope, input: Omit<DashboardWidget, "id">): DashboardWidget {
  return { id: createId("widget"), ...input };
}

export function exportReportToCsv(report: Report, record: AnalyticsRecord): string {
  return ["Report,Name,Value,Module", ...record.kpis.filter((k) => report.kpiIds.includes(k.id)).map((k) => `${report.id},${k.label},${k.currentValue},${k.moduleSource}`)].join("\n");
}

export function exportReportToExcelCompatibleCsv(report: Report, record: AnalyticsRecord): string {
  return exportReportToCsv(report, record);
}

export function exportReportToPdfPlaceholder(report: Report, record: AnalyticsRecord): string {
  return [`%PDF-1.4`, `% Analytics Report: ${report.name}`, `% KPI Count: ${record.kpis.filter((k) => report.kpiIds.includes(k.id)).length}`].join("\n");
}
