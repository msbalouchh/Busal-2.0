import type { Prisma, ReportType } from "@prisma/client";

import type {
  AnalyticsDateRange,
  AnalyticsFilters,
  ExportReportRequest,
  SavedReportInput,
} from "@/modules/restaurant-analytics-management/types/restaurant-analytics-types";

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function decimal(value: Prisma.Decimal | number): number {
  return Number(value);
}

export function formatCurrency(value: number): string {
  return `£${value.toFixed(2)}`;
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function defaultDateRange(days = 30): AnalyticsDateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function parseDateRange(range: AnalyticsDateRange): { from: Date; to: Date } {
  const from = startOfDay(new Date(range.from));
  const to = endOfDay(new Date(range.to));

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new Error("Invalid date range");
  }

  if (from > to) {
    throw new Error("Start date must be before end date");
  }

  const maxRangeMs = 366 * 24 * 60 * 60 * 1000;
  if (to.getTime() - from.getTime() > maxRangeMs) {
    throw new Error("Date range cannot exceed 366 days");
  }

  return { from, to };
}

export function validateAnalyticsFilters(filters: AnalyticsFilters): void {
  parseDateRange(filters.dateRange);
}

export function validateSavedReportInput(input: SavedReportInput): void {
  if (!input.name?.trim()) throw new Error("Report name is required");
  validateAnalyticsFilters(input.filters);
}

export function validateExportRequest(input: ExportReportRequest): void {
  validateAnalyticsFilters(input.filters);
  if (!["csv", "excel", "pdf"].includes(input.format)) {
    throw new Error("Invalid export format");
  }
}

export function buildOrderWhere(
  businessId: string,
  filters: AnalyticsFilters,
): Prisma.RestaurantOrderWhereInput {
  const { from, to } = parseDateRange(filters.dateRange);

  return {
    businessId,
    ...(filters.branchId ? { branchId: filters.branchId } : {}),
    placedAt: { gte: from, lte: to },
    status: { not: "CANCELLED" },
  };
}

export function buildPaidOrderWhere(
  businessId: string,
  filters: AnalyticsFilters,
): Prisma.RestaurantOrderWhereInput {
  return {
    ...buildOrderWhere(businessId, filters),
    paymentStatus: { in: ["PAID", "PARTIALLY_PAID"] },
  };
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  SALES: "Sales",
  ORDERS: "Orders",
  CUSTOMERS: "Customers",
  PRODUCTS: "Products",
  PAYMENTS: "Payments",
  RESERVATIONS: "Reservations",
  INVENTORY: "Inventory",
  STAFF: "Staff",
  KITCHEN: "Kitchen",
  CUSTOM: "Custom",
};
