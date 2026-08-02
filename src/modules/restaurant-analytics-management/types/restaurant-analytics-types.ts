import type { ReportType, WidgetType } from "@prisma/client";

export interface AnalyticsDateRange {
  from: string;
  to: string;
}

export interface AnalyticsFilters {
  branchId?: string | null;
  dateRange: AnalyticsDateRange;
}

export interface KpiMetric {
  label: string;
  value: string;
  hint?: string;
  trend?: number | null;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface TableRow {
  cells: string[];
}

export interface ExecutiveDashboardData {
  kpis: KpiMetric[];
  revenueTrend: ChartDataPoint[];
  ordersByHour: ChartDataPoint[];
  topProducts: TableRow[];
  paymentMethods: ChartDataPoint[];
}

export interface SalesDashboardData {
  kpis: KpiMetric[];
  revenueTrend: ChartDataPoint[];
  grossVsNet: ChartDataPoint[];
  discountTotal: number;
  taxTotal: number;
}

export interface OrdersDashboardData {
  kpis: KpiMetric[];
  ordersByHour: ChartDataPoint[];
  ordersByType: ChartDataPoint[];
  ordersByDay: ChartDataPoint[];
  cancelledOrders: number;
}

export interface PaymentsDashboardData {
  kpis: KpiMetric[];
  byMethod: ChartDataPoint[];
  refundsTotal: number;
  refundCount: number;
  dailyRevenue: ChartDataPoint[];
}

export interface CustomersDashboardData {
  kpis: KpiMetric[];
  newCustomers: number;
  returningCustomers: number;
  retentionRate: number;
  topSpenders: TableRow[];
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
}

export interface ProductsDashboardData {
  topSelling: TableRow[];
  worstSelling: TableRow[];
  categoryPerformance: TableRow[];
}

export interface InventoryDashboardData {
  kpis: KpiMetric[];
  lowStockItems: TableRow[];
  stockValue: number;
  purchaseOrdersOpen: number;
  purchaseTotal: number;
}

export interface KitchenDashboardData {
  kpis: KpiMetric[];
  ordersByStatus: ChartDataPoint[];
  averagePrepMinutes: number | null;
}

export interface StaffDashboardData {
  performance: TableRow[];
}

export interface ReservationsDashboardData {
  kpis: KpiMetric[];
  byStatus: ChartDataPoint[];
  byDay: ChartDataPoint[];
}

export interface SavedReportRecord {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  reportType: ReportType;
  filters: AnalyticsFilters;
  isPublic: boolean;
  createdByStaffId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidgetRecord {
  id: string;
  businessId: string;
  title: string;
  widgetType: WidgetType;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  configuration: Record<string, unknown>;
  displayOrder: number;
}

export interface SavedReportInput {
  name: string;
  description?: string | null;
  reportType: ReportType;
  filters: AnalyticsFilters;
  isPublic?: boolean;
}

export interface DashboardWidgetInput {
  title: string;
  widgetType: WidgetType;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  configuration?: Record<string, unknown>;
  displayOrder?: number;
}

export interface ExportReportRequest {
  reportType: ReportType;
  format: "csv" | "excel" | "pdf";
  filters: AnalyticsFilters;
  title?: string;
}

export interface CustomReportResult {
  reportType: ReportType;
  kpis: KpiMetric[];
  chartData: ChartDataPoint[];
  tableRows: TableRow[];
  tableHeaders: string[];
}
