import { formatMoneyPence } from "@/modules/payments/utils/currency";
import type {
  CustomerAnalytics,
  FinancialReport,
  InventoryAnalytics,
  OrderAnalytics,
  ProductAnalytics,
  ProductAnalyticsItem,
  SalesDashboard,
  StaffAnalyticsItem,
} from "@/services/reporting.service";

export function formatReportingMoney(pence: number): string {
  return formatMoneyPence(pence);
}

export interface SalesDashboardView {
  todaySalesPence: number;
  weeklySalesPence: number;
  monthlySalesPence: number;
  yearlySalesPence: number;
  grossRevenuePence: number;
  netRevenuePence: number;
  averageOrderValuePence: number;
  totalOrders: number;
}

export interface ReportingDashboardView {
  sales: SalesDashboardView;
  orders: {
    cancelledOrders: number;
    refundsPence: number;
    refundCount: number;
    ordersByHour: Array<{ hour: number; count: number }>;
    ordersByDay: Array<{ day: string; count: number }>;
  };
  products: {
    bestSellingCount: number;
    topRevenueCount: number;
  };
  customers: {
    newCustomers: number;
    returningCustomers: number;
    retentionRatePercent: number;
  };
  inventory: {
    lowStockCount: number;
    outOfStockCount: number;
    stockValuationPence: number;
  };
  staffCount: number;
}

export interface OrderAnalyticsView {
  ordersByHour: Array<{ hour: number; count: number; label: string }>;
  ordersByDay: Array<{ day: string; count: number }>;
  ordersByPaymentMethod: Array<{ method: string; count: number; totalPence: number }>;
  ordersByFulfilmentType: Array<{ type: string; count: number }>;
  cancelledOrders: number;
  refundsPence: number;
  refundCount: number;
}

export interface ProductAnalyticsView {
  bestSelling: Array<SerializedProductItem>;
  worstSelling: Array<SerializedProductItem>;
  categoryPerformance: Array<{
    categoryName: string;
    quantitySold: number;
    revenuePence: number;
  }>;
  topRevenueItems: Array<SerializedProductItem>;
}

export interface SerializedProductItem {
  menuItemId: string;
  name: string;
  categoryName: string | null;
  quantitySold: number;
  revenuePence: number;
}

export interface CustomerAnalyticsView {
  newCustomers: number;
  returningCustomers: number;
  retentionRatePercent: number;
  topSpendingCustomers: Array<{ id: string; name: string; totalSpentPence: number }>;
  loyaltyUsage: {
    totalPointsOutstanding: number;
    totalRedemptions: number;
    totalPointTransactions: number;
  };
}

export interface InventoryAnalyticsView {
  lowStockCount: number;
  outOfStockCount: number;
  stockValuationPence: number;
  ingredientUsage: Array<{ ingredientName: string; quantityUsed: string }>;
  wasteAnalysis: Array<{ ingredientName: string; wasteQuantity: string }>;
}

export interface StaffAnalyticsView {
  staff: Array<{
    staffId: string;
    staffName: string;
    ordersHandled: number;
    salesProcessedPence: number;
    averageProcessingMinutes: number | null;
  }>;
}

export interface FinancialReportView {
  period: string;
  from: string;
  to: string;
  grossRevenuePence: number;
  netRevenuePence: number;
  taxPence: number;
  discountPence: number;
  totalOrders: number;
  paymentMethodSummary: Array<{ method: string; count: number; totalPence: number }>;
}

function serializeProductItem(item: ProductAnalyticsItem): SerializedProductItem {
  return {
    menuItemId: item.menuItemId,
    name: item.name,
    categoryName: item.categoryName,
    quantitySold: item.quantitySold,
    revenuePence: item.revenuePence,
  };
}

export function serializeSalesDashboard(dashboard: SalesDashboard): SalesDashboardView {
  return {
    todaySalesPence: dashboard.periods.today.netRevenuePence,
    weeklySalesPence: dashboard.periods.week.netRevenuePence,
    monthlySalesPence: dashboard.periods.month.netRevenuePence,
    yearlySalesPence: dashboard.periods.year.netRevenuePence,
    grossRevenuePence: dashboard.grossRevenuePence,
    netRevenuePence: dashboard.netRevenuePence,
    averageOrderValuePence: dashboard.averageOrderValuePence,
    totalOrders: dashboard.totalOrders,
  };
}

export function serializeReportingDashboard(input: {
  sales: SalesDashboard;
  orders: OrderAnalytics;
  products: ProductAnalytics;
  customers: CustomerAnalytics;
  inventory: InventoryAnalytics;
  staff: StaffAnalyticsItem[];
}): ReportingDashboardView {
  return {
    sales: serializeSalesDashboard(input.sales),
    orders: {
      cancelledOrders: input.orders.cancelledOrders,
      refundsPence: input.orders.refundsPence,
      refundCount: input.orders.refundCount,
      ordersByHour: input.orders.ordersByHour,
      ordersByDay: input.orders.ordersByDay,
    },
    products: {
      bestSellingCount: input.products.bestSelling.length,
      topRevenueCount: input.products.topRevenueItems.length,
    },
    customers: {
      newCustomers: input.customers.newCustomers,
      returningCustomers: input.customers.returningCustomers,
      retentionRatePercent: input.customers.retentionRatePercent,
    },
    inventory: {
      lowStockCount: input.inventory.lowStockCount,
      outOfStockCount: input.inventory.outOfStockCount,
      stockValuationPence: input.inventory.stockValuationPence,
    },
    staffCount: input.staff.length,
  };
}

export function serializeOrderAnalytics(analytics: OrderAnalytics): OrderAnalyticsView {
  return {
    ordersByHour: analytics.ordersByHour.map((entry) => ({
      ...entry,
      label: `${String(entry.hour).padStart(2, "0")}:00`,
    })),
    ordersByDay: analytics.ordersByDay,
    ordersByPaymentMethod: analytics.ordersByPaymentMethod.map((entry) => ({
      method: entry.method,
      count: entry.count,
      totalPence: entry.totalPence,
    })),
    ordersByFulfilmentType: analytics.ordersByFulfilmentType.map((entry) => ({
      type: entry.type.replace("_", " "),
      count: entry.count,
    })),
    cancelledOrders: analytics.cancelledOrders,
    refundsPence: analytics.refundsPence,
    refundCount: analytics.refundCount,
  };
}

export function serializeProductAnalytics(analytics: ProductAnalytics): ProductAnalyticsView {
  return {
    bestSelling: analytics.bestSelling.map(serializeProductItem),
    worstSelling: analytics.worstSelling.map(serializeProductItem),
    categoryPerformance: analytics.categoryPerformance,
    topRevenueItems: analytics.topRevenueItems.map(serializeProductItem),
  };
}

export function serializeCustomerAnalytics(analytics: CustomerAnalytics): CustomerAnalyticsView {
  return analytics;
}

export function serializeInventoryAnalytics(analytics: InventoryAnalytics): InventoryAnalyticsView {
  return analytics;
}

export function serializeStaffAnalytics(staff: StaffAnalyticsItem[]): StaffAnalyticsView {
  return {
    staff: staff.map((entry) => ({
      staffId: entry.staffId,
      staffName: entry.staffName,
      ordersHandled: entry.ordersHandled,
      salesProcessedPence: entry.salesProcessedPence,
      averageProcessingMinutes: entry.averageProcessingMinutes,
    })),
  };
}

export function serializeFinancialReport(report: FinancialReport): FinancialReportView {
  return {
    period: report.period,
    from: report.from,
    to: report.to,
    grossRevenuePence: report.grossRevenuePence,
    netRevenuePence: report.netRevenuePence,
    taxPence: report.taxPence,
    discountPence: report.discountPence,
    totalOrders: report.totalOrders,
    paymentMethodSummary: report.paymentMethodSummary.map((entry) => ({
      method: entry.method,
      count: entry.count,
      totalPence: entry.totalPence,
    })),
  };
}

export function rowsToCsv(headers: string[], rows: string[][]): string {
  const escape = (value: string) => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  };

  return [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join(
    "\n",
  );
}

export function rowsToExcel(headers: string[], rows: string[][]): Buffer {
  const csv = rowsToCsv(headers, rows);
  return Buffer.from(`\uFEFF${csv.replace(/,/g, "\t")}`, "utf8");
}
