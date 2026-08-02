import "server-only";

import type { Prisma, ReportType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  buildOrderWhere,
  buildPaidOrderWhere,
  decimal,
  formatCurrency,
  parseDateRange,
  roundMoney,
} from "@/modules/restaurant-analytics-management/lib/restaurant-analytics-validation";
import type {
  AnalyticsFilters,
  CustomersDashboardData,
  CustomReportResult,
  ExecutiveDashboardData,
  InventoryDashboardData,
  KitchenDashboardData,
  OrdersDashboardData,
  PaymentsDashboardData,
  ProductsDashboardData,
  ReservationsDashboardData,
  SalesDashboardData,
  StaffDashboardData,
  TableRow,
} from "@/modules/restaurant-analytics-management/types/restaurant-analytics-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

async function assertBranchInBusiness(businessId: string, branchId?: string | null): Promise<void> {
  if (!branchId) return;
  const branch = await prisma.branch.findFirst({ where: { id: branchId, businessId } });
  if (!branch) throw new Error("Branch not found");
}

function sumOrderTotals(orders: Array<{ totalAmount: Prisma.Decimal }>): number {
  return roundMoney(orders.reduce((sum, order) => sum + decimal(order.totalAmount), 0));
}

export async function getExecutiveDashboard(
  ownerId: string,
  filters: AnalyticsFilters,
): Promise<ExecutiveDashboardData> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, filters.branchId);
  const where = buildPaidOrderWhere(businessId, filters);
  const orderWhere = buildOrderWhere(businessId, filters);

  const [orders, allOrders, payments, topItems, customers] = await Promise.all([
    prisma.restaurantOrder.findMany({
      where,
      select: { totalAmount: true, placedAt: true },
    }),
    prisma.restaurantOrder.count({ where: orderWhere }),
    prisma.orderPayment.groupBy({
      by: ["paymentMethod"],
      where: {
        businessId,
        ...(filters.branchId ? { branchId: filters.branchId } : {}),
        paidAt: {
          gte: parseDateRange(filters.dateRange).from,
          lte: parseDateRange(filters.dateRange).to,
        },
        status: "PAID",
      },
      _count: { id: true },
      _sum: { amountPaid: true },
    }),
    prisma.restaurantOrderItem.groupBy({
      by: ["productNameSnapshot"],
      where: { order: where },
      _sum: { quantity: true, totalAmount: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.customer.count({
      where: {
        businessId,
        deletedAt: null,
        createdAt: {
          gte: parseDateRange(filters.dateRange).from,
          lte: parseDateRange(filters.dateRange).to,
        },
      },
    }),
  ]);

  const revenue = sumOrderTotals(orders);
  const avgOrder = orders.length > 0 ? roundMoney(revenue / orders.length) : 0;

  const revenueByDay = new Map<string, number>();
  for (const order of orders) {
    const day = order.placedAt.toISOString().slice(0, 10);
    revenueByDay.set(day, roundMoney((revenueByDay.get(day) ?? 0) + decimal(order.totalAmount)));
  }

  const hourCounts = new Map<number, number>();
  for (const order of orders) {
    const hour = order.placedAt.getHours();
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
  }

  return {
    kpis: [
      { label: "Revenue", value: formatCurrency(revenue) },
      { label: "Orders", value: String(allOrders) },
      { label: "Avg order value", value: formatCurrency(avgOrder) },
      { label: "New customers", value: String(customers) },
    ],
    revenueTrend: [...revenueByDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value]) => ({ label, value })),
    ordersByHour: [...hourCounts.entries()]
      .sort(([a], [b]) => a - b)
      .map(([hour, value]) => ({ label: `${String(hour).padStart(2, "0")}:00`, value })),
    topProducts: topItems.map((item) => ({
      cells: [
        item.productNameSnapshot,
        String(item._sum.quantity ?? 0),
        formatCurrency(decimal(item._sum.totalAmount ?? 0)),
      ],
    })),
    paymentMethods: payments.map((entry) => ({
      label: entry.paymentMethod,
      value: decimal(entry._sum.amountPaid ?? 0),
    })),
  };
}

export async function getSalesDashboard(
  ownerId: string,
  filters: AnalyticsFilters,
): Promise<SalesDashboardData> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, filters.branchId);
  const where = buildPaidOrderWhere(businessId, filters);

  const orders = await prisma.restaurantOrder.findMany({
    where,
    select: {
      totalAmount: true,
      subtotal: true,
      discountAmount: true,
      taxAmount: true,
      placedAt: true,
    },
  });

  const gross = sumOrderTotals(orders);
  const discounts = roundMoney(orders.reduce((sum, o) => sum + decimal(o.discountAmount), 0));
  const tax = roundMoney(orders.reduce((sum, o) => sum + decimal(o.taxAmount), 0));
  const net = roundMoney(gross - discounts);

  const revenueByDay = new Map<string, number>();
  for (const order of orders) {
    const day = order.placedAt.toISOString().slice(0, 10);
    revenueByDay.set(day, roundMoney((revenueByDay.get(day) ?? 0) + decimal(order.totalAmount)));
  }

  return {
    kpis: [
      { label: "Gross revenue", value: formatCurrency(gross) },
      { label: "Net revenue", value: formatCurrency(net) },
      { label: "Discounts", value: formatCurrency(discounts) },
      { label: "Tax collected", value: formatCurrency(tax) },
    ],
    revenueTrend: [...revenueByDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value]) => ({ label, value })),
    grossVsNet: [
      { label: "Gross", value: gross },
      { label: "Net", value: net },
    ],
    discountTotal: discounts,
    taxTotal: tax,
  };
}

export async function getOrdersDashboard(
  ownerId: string,
  filters: AnalyticsFilters,
): Promise<OrdersDashboardData> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, filters.branchId);
  const where = buildOrderWhere(businessId, filters);

  const orders = await prisma.restaurantOrder.findMany({
    where,
    select: { orderType: true, placedAt: true, status: true },
  });

  const cancelled = orders.filter((o) => o.status === "CANCELLED").length;
  const hourCounts = new Map<number, number>();
  const typeCounts = new Map<string, number>();
  const dayCounts = new Map<string, number>();

  for (const order of orders) {
    if (order.status === "CANCELLED") continue;
    hourCounts.set(order.placedAt.getHours(), (hourCounts.get(order.placedAt.getHours()) ?? 0) + 1);
    typeCounts.set(order.orderType, (typeCounts.get(order.orderType) ?? 0) + 1);
    const day = order.placedAt.toISOString().slice(0, 10);
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
  }

  return {
    kpis: [
      { label: "Total orders", value: String(orders.length - cancelled) },
      { label: "Cancelled", value: String(cancelled) },
    ],
    ordersByHour: [...hourCounts.entries()]
      .sort(([a], [b]) => a - b)
      .map(([hour, value]) => ({ label: `${String(hour).padStart(2, "0")}:00`, value })),
    ordersByType: [...typeCounts.entries()].map(([label, value]) => ({ label, value })),
    ordersByDay: [...dayCounts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value]) => ({ label, value })),
    cancelledOrders: cancelled,
  };
}

export async function getPaymentsDashboard(
  ownerId: string,
  filters: AnalyticsFilters,
): Promise<PaymentsDashboardData> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, filters.branchId);
  const { from, to } = parseDateRange(filters.dateRange);

  const paymentWhere = {
    businessId,
    ...(filters.branchId ? { branchId: filters.branchId } : {}),
    paidAt: { gte: from, lte: to },
  };

  const [payments, refunds] = await Promise.all([
    prisma.orderPayment.findMany({
      where: { ...paymentWhere, status: { in: ["PAID", "PARTIALLY_PAID"] } },
      select: { paymentMethod: true, amountPaid: true, paidAt: true },
    }),
    prisma.orderPayment.findMany({
      where: { ...paymentWhere, status: "REFUNDED" },
      select: { amountPaid: true },
    }),
  ]);

  const methodTotals = new Map<string, number>();
  const dailyTotals = new Map<string, number>();
  let total = 0;

  for (const payment of payments) {
    const amount = decimal(payment.amountPaid);
    total = roundMoney(total + amount);
    methodTotals.set(
      payment.paymentMethod,
      roundMoney((methodTotals.get(payment.paymentMethod) ?? 0) + amount),
    );
    if (payment.paidAt) {
      const day = payment.paidAt.toISOString().slice(0, 10);
      dailyTotals.set(day, roundMoney((dailyTotals.get(day) ?? 0) + amount));
    }
  }

  const refundsTotal = roundMoney(refunds.reduce((sum, r) => sum + decimal(r.amountPaid), 0));

  return {
    kpis: [
      { label: "Total collected", value: formatCurrency(total) },
      { label: "Refunds", value: formatCurrency(refundsTotal) },
      { label: "Transactions", value: String(payments.length) },
    ],
    byMethod: [...methodTotals.entries()].map(([label, value]) => ({ label, value })),
    refundsTotal,
    refundCount: refunds.length,
    dailyRevenue: [...dailyTotals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value]) => ({ label, value })),
  };
}

export async function getCustomersDashboard(
  ownerId: string,
  filters: AnalyticsFilters,
): Promise<CustomersDashboardData> {
  const businessId = await getOwnedBusinessId(ownerId);
  const { from, to } = parseDateRange(filters.dateRange);

  const [newCustomers, customersWithOrders, topSpenders, loyaltyEarned, loyaltyRedeemed] =
    await Promise.all([
      prisma.customer.count({
        where: { businessId, deletedAt: null, createdAt: { gte: from, lte: to } },
      }),
      prisma.restaurantOrder.groupBy({
        by: ["customerId"],
        where: {
          ...buildPaidOrderWhere(businessId, filters),
          customerId: { not: null },
        },
        _count: { id: true },
      }),
      prisma.customer.findMany({
        where: { businessId, deletedAt: null },
        orderBy: { totalSpend: "desc" },
        take: 10,
        select: { name: true, totalSpend: true, totalOrders: true },
      }),
      prisma.loyaltyTransaction.aggregate({
        where: {
          type: "EARN",
          createdAt: { gte: from, lte: to },
          loyaltyAccount: { customer: { businessId } },
        },
        _sum: { points: true },
      }),
      prisma.loyaltyTransaction.aggregate({
        where: {
          type: "REDEEM",
          createdAt: { gte: from, lte: to },
          loyaltyAccount: { customer: { businessId } },
        },
        _sum: { points: true },
      }),
    ]);

  const returning = customersWithOrders.filter((c) => c._count.id > 1).length;
  const totalWithOrders = customersWithOrders.length;
  const retentionRate = totalWithOrders > 0 ? roundMoney((returning / totalWithOrders) * 100) : 0;

  return {
    kpis: [
      { label: "New customers", value: String(newCustomers) },
      { label: "Returning", value: String(returning) },
      { label: "Retention", value: `${retentionRate}%` },
    ],
    newCustomers,
    returningCustomers: returning,
    retentionRate,
    topSpenders: topSpenders.map((c) => ({
      cells: [c.name, String(c.totalOrders), formatCurrency(decimal(c.totalSpend))],
    })),
    loyaltyPointsEarned: decimal(loyaltyEarned._sum.points ?? 0),
    loyaltyPointsRedeemed: Math.abs(decimal(loyaltyRedeemed._sum.points ?? 0)),
  };
}

export async function getProductsDashboard(
  ownerId: string,
  filters: AnalyticsFilters,
): Promise<ProductsDashboardData> {
  const businessId = await getOwnedBusinessId(ownerId);
  const where = buildPaidOrderWhere(businessId, filters);

  const items = await prisma.restaurantOrderItem.groupBy({
    by: ["productNameSnapshot", "productId"],
    where: { order: where },
    _sum: { quantity: true, totalAmount: true },
    orderBy: { _sum: { quantity: "desc" } },
  });

  const sorted = items.sort(
    (a, b) => decimal(b._sum.quantity ?? 0) - decimal(a._sum.quantity ?? 0),
  );

  const toRow = (item: (typeof items)[number]): TableRow => ({
    cells: [
      item.productNameSnapshot,
      String(item._sum.quantity ?? 0),
      formatCurrency(decimal(item._sum.totalAmount ?? 0)),
    ],
  });

  return {
    topSelling: sorted.slice(0, 10).map(toRow),
    worstSelling: [...sorted].reverse().slice(0, 10).map(toRow),
    categoryPerformance: [],
  };
}

export async function getInventoryDashboard(
  ownerId: string,
  filters: AnalyticsFilters,
): Promise<InventoryDashboardData> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, filters.branchId);
  const { from, to } = parseDateRange(filters.dateRange);

  const itemWhere = {
    businessId,
    deletedAt: null,
    ...(filters.branchId ? { branchId: filters.branchId } : {}),
  };

  const [items, openPos, purchaseAgg] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: itemWhere,
      select: {
        name: true,
        sku: true,
        currentStock: true,
        minimumStock: true,
        reorderLevel: true,
        averageCost: true,
        trackStock: true,
      },
    }),
    prisma.purchaseOrder.count({
      where: {
        businessId,
        ...(filters.branchId ? { branchId: filters.branchId } : {}),
        status: { in: ["DRAFT", "SENT", "PARTIALLY_RECEIVED"] },
      },
    }),
    prisma.purchaseOrder.aggregate({
      where: {
        businessId,
        ...(filters.branchId ? { branchId: filters.branchId } : {}),
        createdAt: { gte: from, lte: to },
        status: { in: ["RECEIVED", "PARTIALLY_RECEIVED"] },
      },
      _sum: { totalAmount: true },
    }),
  ]);

  const lowStock = items.filter((item) => {
    if (!item.trackStock) return false;
    const current = decimal(item.currentStock);
    const threshold = decimal(item.reorderLevel ?? item.minimumStock);
    return current <= threshold;
  });

  const stockValue = roundMoney(
    items.reduce((sum, item) => sum + decimal(item.currentStock) * decimal(item.averageCost), 0),
  );

  return {
    kpis: [
      { label: "Stock value", value: formatCurrency(stockValue) },
      { label: "Low stock items", value: String(lowStock.length) },
      { label: "Open POs", value: String(openPos) },
    ],
    lowStockItems: lowStock.slice(0, 15).map((item) => ({
      cells: [item.name, item.sku, String(decimal(item.currentStock))],
    })),
    stockValue,
    purchaseOrdersOpen: openPos,
    purchaseTotal: decimal(purchaseAgg._sum.totalAmount ?? 0),
  };
}

export async function getKitchenDashboard(
  ownerId: string,
  filters: AnalyticsFilters,
): Promise<KitchenDashboardData> {
  const businessId = await getOwnedBusinessId(ownerId);
  const where = buildOrderWhere(businessId, filters);

  const orders = await prisma.restaurantOrder.findMany({
    where,
    select: {
      status: true,
      placedAt: true,
      kitchenReadyAt: true,
      kitchenPreparingAt: true,
    },
  });

  const statusCounts = new Map<string, number>();
  const prepTimes: number[] = [];

  for (const order of orders) {
    statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1);
    if (order.kitchenPreparingAt && order.kitchenReadyAt) {
      prepTimes.push((order.kitchenReadyAt.getTime() - order.kitchenPreparingAt.getTime()) / 60000);
    }
  }

  const avgPrep =
    prepTimes.length > 0
      ? roundMoney(prepTimes.reduce((sum, value) => sum + value, 0) / prepTimes.length)
      : null;

  return {
    kpis: [
      { label: "Kitchen orders", value: String(orders.length) },
      { label: "Avg prep (min)", value: avgPrep != null ? String(avgPrep) : "—" },
    ],
    ordersByStatus: [...statusCounts.entries()].map(([label, value]) => ({ label, value })),
    averagePrepMinutes: avgPrep,
  };
}

export async function getStaffDashboard(
  ownerId: string,
  filters: AnalyticsFilters,
): Promise<StaffDashboardData> {
  const businessId = await getOwnedBusinessId(ownerId);
  const where = buildPaidOrderWhere(businessId, filters);

  const grouped = await prisma.restaurantOrder.groupBy({
    by: ["staffId"],
    where: { ...where, staffId: { not: null } },
    _count: { id: true },
    _sum: { totalAmount: true },
  });

  const staffIds = grouped.map((g) => g.staffId).filter(Boolean) as string[];
  const staffRecords = await prisma.staff.findMany({
    where: { id: { in: staffIds } },
    select: { id: true, fullName: true, firstName: true, lastName: true },
  });

  const staffMap = new Map(staffRecords.map((s) => [s.id, s]));

  return {
    performance: grouped.map((entry) => {
      const staff = entry.staffId ? staffMap.get(entry.staffId) : null;
      const name =
        staff?.fullName ||
        [staff?.firstName, staff?.lastName].filter(Boolean).join(" ") ||
        "Unknown";
      return {
        cells: [
          name,
          String(entry._count.id),
          formatCurrency(decimal(entry._sum.totalAmount ?? 0)),
        ],
      };
    }),
  };
}

export async function getReservationsDashboard(
  ownerId: string,
  filters: AnalyticsFilters,
): Promise<ReservationsDashboardData> {
  const businessId = await getOwnedBusinessId(ownerId);
  const { from, to } = parseDateRange(filters.dateRange);

  const reservations = await prisma.reservation.findMany({
    where: {
      businessId,
      ...(filters.branchId ? { branchId: filters.branchId } : {}),
      reservationDate: { gte: from, lte: to },
    },
    select: { status: true, reservationDate: true, partySize: true },
  });

  const statusCounts = new Map<string, number>();
  const dayCounts = new Map<string, number>();
  let totalParty = 0;

  for (const res of reservations) {
    statusCounts.set(res.status, (statusCounts.get(res.status) ?? 0) + 1);
    const day = res.reservationDate.toISOString().slice(0, 10);
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
    totalParty += res.partySize;
  }

  return {
    kpis: [
      { label: "Reservations", value: String(reservations.length) },
      { label: "Total covers", value: String(totalParty) },
    ],
    byStatus: [...statusCounts.entries()].map(([label, value]) => ({ label, value })),
    byDay: [...dayCounts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value]) => ({ label, value })),
  };
}

export async function runCustomReport(
  ownerId: string,
  reportType: ReportType,
  filters: AnalyticsFilters,
): Promise<CustomReportResult> {
  switch (reportType) {
    case "SALES": {
      const data = await getSalesDashboard(ownerId, filters);
      return {
        reportType,
        kpis: data.kpis,
        chartData: data.revenueTrend,
        tableHeaders: ["Date", "Revenue"],
        tableRows: data.revenueTrend.map((point) => ({
          cells: [point.label, formatCurrency(point.value)],
        })),
      };
    }
    case "ORDERS": {
      const data = await getOrdersDashboard(ownerId, filters);
      return {
        reportType,
        kpis: data.kpis,
        chartData: data.ordersByHour,
        tableHeaders: ["Hour", "Orders"],
        tableRows: data.ordersByHour.map((point) => ({
          cells: [point.label, String(point.value)],
        })),
      };
    }
    case "PRODUCTS": {
      const data = await getProductsDashboard(ownerId, filters);
      return {
        reportType,
        kpis: [],
        chartData: [],
        tableHeaders: ["Product", "Qty", "Revenue"],
        tableRows: data.topSelling,
      };
    }
    case "PAYMENTS": {
      const data = await getPaymentsDashboard(ownerId, filters);
      return {
        reportType,
        kpis: data.kpis,
        chartData: data.byMethod,
        tableHeaders: ["Method", "Amount"],
        tableRows: data.byMethod.map((point) => ({
          cells: [point.label, formatCurrency(point.value)],
        })),
      };
    }
    case "CUSTOMERS": {
      const data = await getCustomersDashboard(ownerId, filters);
      return {
        reportType,
        kpis: data.kpis,
        chartData: [],
        tableHeaders: ["Customer", "Orders", "Spend"],
        tableRows: data.topSpenders,
      };
    }
    case "INVENTORY": {
      const data = await getInventoryDashboard(ownerId, filters);
      return {
        reportType,
        kpis: data.kpis,
        chartData: [],
        tableHeaders: ["Item", "SKU", "Stock"],
        tableRows: data.lowStockItems,
      };
    }
    case "STAFF": {
      const data = await getStaffDashboard(ownerId, filters);
      return {
        reportType,
        kpis: [],
        chartData: [],
        tableHeaders: ["Staff", "Orders", "Revenue"],
        tableRows: data.performance,
      };
    }
    case "KITCHEN": {
      const data = await getKitchenDashboard(ownerId, filters);
      return {
        reportType,
        kpis: data.kpis,
        chartData: data.ordersByStatus,
        tableHeaders: ["Status", "Count"],
        tableRows: data.ordersByStatus.map((point) => ({
          cells: [point.label, String(point.value)],
        })),
      };
    }
    case "RESERVATIONS": {
      const data = await getReservationsDashboard(ownerId, filters);
      return {
        reportType,
        kpis: data.kpis,
        chartData: data.byDay,
        tableHeaders: ["Date", "Reservations"],
        tableRows: data.byDay.map((point) => ({
          cells: [point.label, String(point.value)],
        })),
      };
    }
    default: {
      const data = await getExecutiveDashboard(ownerId, filters);
      return {
        reportType: "CUSTOM",
        kpis: data.kpis,
        chartData: data.revenueTrend,
        tableHeaders: ["Date", "Revenue"],
        tableRows: data.revenueTrend.map((point) => ({
          cells: [point.label, formatCurrency(point.value)],
        })),
      };
    }
  }
}
