import "server-only";

import { type FulfilmentType, type PaymentMethod, type Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

import { prisma } from "@/lib/prisma";
import { branchFilter } from "@/modules/business-context/utils/branch-scope";
import { moneyDecimalToPence } from "@/modules/payments/utils/currency";

export type ReportingPeriod = "today" | "week" | "month" | "year";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface SalesMetrics {
  grossRevenuePence: number;
  netRevenuePence: number;
  totalOrders: number;
  averageOrderValuePence: number;
}

export interface PeriodSales {
  today: SalesMetrics;
  week: SalesMetrics;
  month: SalesMetrics;
  year: SalesMetrics;
}

export interface SalesDashboard {
  periods: PeriodSales;
  grossRevenuePence: number;
  netRevenuePence: number;
  averageOrderValuePence: number;
  totalOrders: number;
}

export interface OrderAnalytics {
  ordersByHour: Array<{ hour: number; count: number }>;
  ordersByDay: Array<{ day: string; count: number }>;
  ordersByPaymentMethod: Array<{ method: PaymentMethod; count: number; totalPence: number }>;
  ordersByFulfilmentType: Array<{ type: FulfilmentType; count: number }>;
  cancelledOrders: number;
  refundsPence: number;
  refundCount: number;
}

export interface ProductAnalyticsItem {
  menuItemId: string;
  name: string;
  categoryName: string | null;
  quantitySold: number;
  revenuePence: number;
}

export interface ProductAnalytics {
  bestSelling: ProductAnalyticsItem[];
  worstSelling: ProductAnalyticsItem[];
  categoryPerformance: Array<{ categoryName: string; quantitySold: number; revenuePence: number }>;
  topRevenueItems: ProductAnalyticsItem[];
}

export interface CustomerAnalytics {
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

export interface InventoryAnalytics {
  lowStockCount: number;
  outOfStockCount: number;
  stockValuationPence: number;
  ingredientUsage: Array<{ ingredientName: string; quantityUsed: string }>;
  wasteAnalysis: Array<{ ingredientName: string; wasteQuantity: string }>;
}

export interface StaffAnalyticsItem {
  staffId: string;
  staffName: string;
  ordersHandled: number;
  salesProcessedPence: number;
  averageProcessingMinutes: number | null;
}

export interface FinancialReport {
  period: ReportingPeriod | "daily" | "weekly" | "monthly";
  from: string;
  to: string;
  grossRevenuePence: number;
  netRevenuePence: number;
  taxPence: number;
  discountPence: number;
  totalOrders: number;
  paymentMethodSummary: Array<{ method: PaymentMethod; count: number; totalPence: number }>;
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfWeek(date: Date): Date {
  const result = startOfDay(date);
  const day = result.getDay();
  const diff = day === 0 ? 6 : day - 1;
  result.setDate(result.getDate() - diff);
  return result;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

function getDateRangeForPeriod(period: ReportingPeriod, reference = new Date()): DateRange {
  const to = reference;

  switch (period) {
    case "today":
      return { from: startOfDay(reference), to };
    case "week":
      return { from: startOfWeek(reference), to };
    case "month":
      return { from: startOfMonth(reference), to };
    case "year":
      return { from: startOfYear(reference), to };
  }
}

function completedOrderWhere(
  businessId: string,
  branchId: string | null = null,
  range?: DateRange,
): Prisma.OrderWhereInput {
  return {
    businessId,
    ...branchFilter(branchId),
    status: "COMPLETED",
    ...(range
      ? {
          createdAt: {
            gte: range.from,
            lte: range.to,
          },
        }
      : {}),
  };
}

function sumOrderMetrics(
  orders: Array<{ subtotal: Prisma.Decimal; total: Prisma.Decimal }>,
): SalesMetrics {
  const totalOrders = orders.length;

  if (totalOrders === 0) {
    return {
      grossRevenuePence: 0,
      netRevenuePence: 0,
      totalOrders: 0,
      averageOrderValuePence: 0,
    };
  }

  const grossRevenuePence = orders.reduce(
    (sum, order) => sum + moneyDecimalToPence(order.subtotal),
    0,
  );
  const netRevenuePence = orders.reduce((sum, order) => sum + moneyDecimalToPence(order.total), 0);

  return {
    grossRevenuePence,
    netRevenuePence,
    totalOrders,
    averageOrderValuePence: Math.round(netRevenuePence / totalOrders),
  };
}

async function getSalesMetricsForRange(
  businessId: string,
  range: DateRange,
  branchId: string | null = null,
): Promise<SalesMetrics> {
  const orders = await prisma.order.findMany({
    where: completedOrderWhere(businessId, branchId, range),
    select: { subtotal: true, total: true },
  });

  return sumOrderMetrics(orders);
}

export async function getSalesDashboard(
  businessId: string,
  branchId: string | null = null,
): Promise<SalesDashboard> {
  const now = new Date();
  const [today, week, month, year] = await Promise.all([
    getSalesMetricsForRange(businessId, getDateRangeForPeriod("today", now), branchId),
    getSalesMetricsForRange(businessId, getDateRangeForPeriod("week", now), branchId),
    getSalesMetricsForRange(businessId, getDateRangeForPeriod("month", now), branchId),
    getSalesMetricsForRange(businessId, getDateRangeForPeriod("year", now), branchId),
  ]);

  return {
    periods: { today, week, month, year },
    grossRevenuePence: today.grossRevenuePence,
    netRevenuePence: today.netRevenuePence,
    averageOrderValuePence: today.averageOrderValuePence,
    totalOrders: today.totalOrders,
  };
}

export async function getOrderAnalytics(
  businessId: string,
  range?: DateRange,
  branchId: string | null = null,
): Promise<OrderAnalytics> {
  const effectiveRange = range ?? getDateRangeForPeriod("month");

  const [orders, payments, cancelledCount, refundPayments] = await Promise.all([
    prisma.order.findMany({
      where: {
        businessId,
        ...branchFilter(branchId),
        createdAt: { gte: effectiveRange.from, lte: effectiveRange.to },
      },
      select: {
        id: true,
        status: true,
        fulfilmentType: true,
        createdAt: true,
      },
    }),
    prisma.payment.findMany({
      where: {
        businessId,
        ...branchFilter(branchId),
        createdAt: { gte: effectiveRange.from, lte: effectiveRange.to },
      },
      select: {
        method: true,
        amount: true,
        status: true,
      },
    }),
    prisma.order.count({
      where: {
        businessId,
        ...branchFilter(branchId),
        status: "CANCELLED",
        createdAt: { gte: effectiveRange.from, lte: effectiveRange.to },
      },
    }),
    prisma.payment.findMany({
      where: {
        businessId,
        ...branchFilter(branchId),
        status: "REFUNDED",
        createdAt: { gte: effectiveRange.from, lte: effectiveRange.to },
      },
      select: { amount: true },
    }),
  ]);

  const hourBuckets = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayBuckets = dayLabels.map((day) => ({ day, count: 0 }));

  for (const order of orders.filter((entry) => entry.status === "COMPLETED")) {
    hourBuckets[order.createdAt.getHours()]!.count += 1;

    const jsDay = order.createdAt.getDay();
    const index = jsDay === 0 ? 6 : jsDay - 1;
    dayBuckets[index]!.count += 1;
  }

  const paymentMethodMap = new Map<PaymentMethod, { count: number; totalPence: number }>();
  for (const payment of payments.filter((entry) => entry.status === "COMPLETED")) {
    const existing = paymentMethodMap.get(payment.method) ?? { count: 0, totalPence: 0 };
    paymentMethodMap.set(payment.method, {
      count: existing.count + 1,
      totalPence: existing.totalPence + payment.amount,
    });
  }

  const fulfilmentMap = new Map<FulfilmentType, number>();
  for (const order of orders.filter((entry) => entry.status === "COMPLETED")) {
    fulfilmentMap.set(order.fulfilmentType, (fulfilmentMap.get(order.fulfilmentType) ?? 0) + 1);
  }

  return {
    ordersByHour: hourBuckets,
    ordersByDay: dayBuckets,
    ordersByPaymentMethod: Array.from(paymentMethodMap.entries()).map(([method, data]) => ({
      method,
      ...data,
    })),
    ordersByFulfilmentType: Array.from(fulfilmentMap.entries()).map(([type, count]) => ({
      type,
      count,
    })),
    cancelledOrders: cancelledCount,
    refundsPence: refundPayments.reduce((sum, payment) => sum + payment.amount, 0),
    refundCount: refundPayments.length,
  };
}

async function aggregateProductItems(
  businessId: string,
  range: DateRange,
  branchId: string | null = null,
): Promise<ProductAnalyticsItem[]> {
  const items = await prisma.orderItem.findMany({
    where: {
      order: completedOrderWhere(businessId, branchId, range),
    },
    select: {
      menuItemId: true,
      nameSnapshot: true,
      quantity: true,
      totalPrice: true,
      menuItem: {
        select: {
          category: { select: { name: true } },
        },
      },
    },
  });

  const map = new Map<string, ProductAnalyticsItem>();

  for (const item of items) {
    const existing = map.get(item.menuItemId) ?? {
      menuItemId: item.menuItemId,
      name: item.nameSnapshot,
      categoryName: item.menuItem.category?.name ?? null,
      quantitySold: 0,
      revenuePence: 0,
    };

    map.set(item.menuItemId, {
      ...existing,
      quantitySold: existing.quantitySold + item.quantity,
      revenuePence: existing.revenuePence + moneyDecimalToPence(item.totalPrice),
    });
  }

  return Array.from(map.values());
}

export async function getProductAnalytics(
  businessId: string,
  range?: DateRange,
  branchId: string | null = null,
): Promise<ProductAnalytics> {
  const effectiveRange = range ?? getDateRangeForPeriod("month");
  const items = await aggregateProductItems(businessId, effectiveRange, branchId);

  const sortedByQuantity = [...items].sort((a, b) => b.quantitySold - a.quantitySold);
  const sortedByRevenue = [...items].sort((a, b) => b.revenuePence - a.revenuePence);

  const categoryMap = new Map<string, { quantitySold: number; revenuePence: number }>();
  for (const item of items) {
    const categoryName = item.categoryName ?? "Uncategorised";
    const existing = categoryMap.get(categoryName) ?? { quantitySold: 0, revenuePence: 0 };
    categoryMap.set(categoryName, {
      quantitySold: existing.quantitySold + item.quantitySold,
      revenuePence: existing.revenuePence + item.revenuePence,
    });
  }

  const withSales = sortedByQuantity.filter((item) => item.quantitySold > 0);

  return {
    bestSelling: withSales.slice(0, 10),
    worstSelling: [...withSales].reverse().slice(0, 10),
    categoryPerformance: Array.from(categoryMap.entries())
      .map(([categoryName, data]) => ({ categoryName, ...data }))
      .sort((a, b) => b.revenuePence - a.revenuePence),
    topRevenueItems: sortedByRevenue.slice(0, 10),
  };
}

export async function getCustomerAnalytics(
  businessId: string,
  range?: DateRange,
  branchId: string | null = null,
): Promise<CustomerAnalytics> {
  const effectiveRange = range ?? getDateRangeForPeriod("month");
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const customers = await prisma.customer.findMany({
    where: { businessId, deletedAt: null },
    select: {
      id: true,
      name: true,
      loyaltyPoints: true,
      createdAt: true,
      orders: {
        where: { status: "COMPLETED", ...branchFilter(branchId) },
        select: { total: true, createdAt: true },
      },
    },
  });

  const newCustomers = customers.filter(
    (customer) => customer.createdAt >= effectiveRange.from,
  ).length;
  const returningCustomers = customers.filter((customer) => customer.orders.length > 1).length;
  const customersWithOrders = customers.filter((customer) => customer.orders.length > 0).length;
  const retentionRatePercent =
    customersWithOrders === 0 ? 0 : Math.round((returningCustomers / customersWithOrders) * 100);

  const topSpendingCustomers = customers
    .map((customer) => ({
      id: customer.id,
      name: customer.name,
      totalSpentPence: customer.orders.reduce(
        (sum, order) => sum + moneyDecimalToPence(order.total),
        0,
      ),
    }))
    .sort((a, b) => b.totalSpentPence - a.totalSpentPence)
    .slice(0, 10);

  const [totalRedemptions, totalPointTransactions] = await Promise.all([
    prisma.customerRewardRedemption.count({ where: { businessId } }),
    prisma.loyaltyPointTransaction.count({ where: { businessId } }),
  ]);

  return {
    newCustomers,
    returningCustomers,
    retentionRatePercent,
    topSpendingCustomers,
    loyaltyUsage: {
      totalPointsOutstanding: customers.reduce((sum, customer) => sum + customer.loyaltyPoints, 0),
      totalRedemptions,
      totalPointTransactions,
    },
  };
}

export async function getInventoryAnalytics(
  businessId: string,
  branchId: string | null = null,
): Promise<InventoryAnalytics> {
  const ingredients = await prisma.ingredient.findMany({
    where: { businessId, deletedAt: null },
    select: {
      name: true,
      costPricePence: true,
      currentStock: true,
      minimumStock: true,
    },
  });

  let lowStockCount = 0;
  let outOfStockCount = 0;
  let stockValuationPence = 0;

  for (const ingredient of ingredients) {
    const current = new Decimal(ingredient.currentStock);
    const minimum = new Decimal(ingredient.minimumStock);

    if (current.lte(0)) {
      outOfStockCount += 1;
    } else if (current.lte(minimum)) {
      lowStockCount += 1;
    }

    stockValuationPence += Math.round(
      ingredient.costPricePence * Number.parseFloat(current.toString()),
    );
  }

  const [usageMovements, wasteMovements] = await Promise.all([
    prisma.stockMovement.findMany({
      where: {
        businessId,
        ...branchFilter(branchId),
        movementType: "SALE_DEDUCTION",
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { ingredient: { select: { name: true } } },
    }),
    prisma.stockMovement.findMany({
      where: {
        businessId,
        ...branchFilter(branchId),
        movementType: "WASTE",
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { ingredient: { select: { name: true } } },
    }),
  ]);

  return {
    lowStockCount,
    outOfStockCount,
    stockValuationPence,
    ingredientUsage: usageMovements.map((movement) => ({
      ingredientName: movement.ingredient.name,
      quantityUsed: movement.quantityChange.abs().toString(),
    })),
    wasteAnalysis: wasteMovements.map((movement) => ({
      ingredientName: movement.ingredient.name,
      wasteQuantity: movement.quantityChange.abs().toString(),
    })),
  };
}

export async function getStaffAnalytics(
  businessId: string,
  range?: DateRange,
  branchId: string | null = null,
): Promise<StaffAnalyticsItem[]> {
  const effectiveRange = range ?? getDateRangeForPeriod("month");

  const payments = await prisma.payment.findMany({
    where: {
      businessId,
      ...branchFilter(branchId),
      status: "COMPLETED",
      staffId: { not: null },
      createdAt: { gte: effectiveRange.from, lte: effectiveRange.to },
    },
    select: {
      staffId: true,
      amount: true,
      orderId: true,
      staff: { select: { firstName: true, lastName: true } },
    },
  });

  const kitchenQueues = await prisma.kitchenQueue.findMany({
    where: {
      businessId,
      ...branchFilter(branchId),
      queuedAt: { gte: effectiveRange.from, lte: effectiveRange.to },
      servedAt: { not: null },
    },
    select: {
      orderId: true,
      queuedAt: true,
      servedAt: true,
      order: { select: { payments: { select: { staffId: true } } } },
    },
  });

  const staffMap = new Map<
    string,
    {
      staffName: string;
      orderIds: Set<string>;
      salesProcessedPence: number;
      processingMinutes: number[];
    }
  >();

  for (const payment of payments) {
    if (!payment.staffId || !payment.staff) {
      continue;
    }

    const existing = staffMap.get(payment.staffId) ?? {
      staffName: `${payment.staff.firstName} ${payment.staff.lastName}`.trim(),
      orderIds: new Set<string>(),
      salesProcessedPence: 0,
      processingMinutes: [],
    };

    existing.orderIds.add(payment.orderId);
    existing.salesProcessedPence += payment.amount;
    staffMap.set(payment.staffId, existing);
  }

  for (const queue of kitchenQueues) {
    if (!queue.servedAt) {
      continue;
    }

    const minutes = (queue.servedAt.getTime() - queue.queuedAt.getTime()) / 60000;
    const staffId = queue.order.payments.find((payment) => payment.staffId)?.staffId;

    if (!staffId) {
      continue;
    }

    const existing = staffMap.get(staffId);
    if (existing) {
      existing.processingMinutes.push(minutes);
    }
  }

  return Array.from(staffMap.entries())
    .map(([staffId, data]) => ({
      staffId,
      staffName: data.staffName,
      ordersHandled: data.orderIds.size,
      salesProcessedPence: data.salesProcessedPence,
      averageProcessingMinutes:
        data.processingMinutes.length === 0
          ? null
          : Math.round(
              data.processingMinutes.reduce((sum, value) => sum + value, 0) /
                data.processingMinutes.length,
            ),
    }))
    .sort((a, b) => b.salesProcessedPence - a.salesProcessedPence);
}

export async function getFinancialReport(
  businessId: string,
  period: ReportingPeriod | "daily" | "weekly" | "monthly",
  branchId: string | null = null,
): Promise<FinancialReport> {
  const mappedPeriod: ReportingPeriod =
    period === "daily"
      ? "today"
      : period === "weekly"
        ? "week"
        : period === "monthly"
          ? "month"
          : period;

  const range = getDateRangeForPeriod(mappedPeriod);

  const [orders, payments] = await Promise.all([
    prisma.order.findMany({
      where: completedOrderWhere(businessId, branchId, range),
      select: { subtotal: true, total: true, tax: true, discount: true },
    }),
    prisma.payment.findMany({
      where: {
        businessId,
        ...branchFilter(branchId),
        status: "COMPLETED",
        createdAt: { gte: range.from, lte: range.to },
      },
      select: { method: true, amount: true },
    }),
  ]);

  const metrics = sumOrderMetrics(orders);
  const taxPence = orders.reduce((sum, order) => sum + moneyDecimalToPence(order.tax), 0);
  const discountPence = orders.reduce((sum, order) => sum + moneyDecimalToPence(order.discount), 0);

  const paymentMethodMap = new Map<PaymentMethod, { count: number; totalPence: number }>();
  for (const payment of payments) {
    const existing = paymentMethodMap.get(payment.method) ?? { count: 0, totalPence: 0 };
    paymentMethodMap.set(payment.method, {
      count: existing.count + 1,
      totalPence: existing.totalPence + payment.amount,
    });
  }

  return {
    period,
    from: range.from.toISOString(),
    to: range.to.toISOString(),
    grossRevenuePence: metrics.grossRevenuePence,
    netRevenuePence: metrics.netRevenuePence,
    taxPence,
    discountPence,
    totalOrders: metrics.totalOrders,
    paymentMethodSummary: Array.from(paymentMethodMap.entries()).map(([method, data]) => ({
      method,
      ...data,
    })),
  };
}

export async function getReportingDashboard(businessId: string, branchId: string | null = null) {
  const [sales, orders, products, customers, inventory, staff] = await Promise.all([
    getSalesDashboard(businessId, branchId),
    getOrderAnalytics(businessId, undefined, branchId),
    getProductAnalytics(businessId, undefined, branchId),
    getCustomerAnalytics(businessId, undefined, branchId),
    getInventoryAnalytics(businessId, branchId),
    getStaffAnalytics(businessId, undefined, branchId),
  ]);

  return {
    sales,
    orders,
    products,
    customers,
    inventory,
    staff,
  };
}

export { getDateRangeForPeriod };
