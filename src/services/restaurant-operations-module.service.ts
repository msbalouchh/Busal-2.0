import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { branchFilter } from "@/modules/business-context/utils/branch-scope";
import { ORDER_QUEUE_PAGE_SIZE } from "@/modules/restaurant-operations/constants/restaurant-operations";
import type {
  BulkMenuAvailabilityInput,
  MenuOperationsBundle,
  MergeTablesInput,
  OrderQueueQuery,
  OrderQueueResult,
  ReservationOperationsBundle,
  ReservationOperationsQuery,
  RestaurantDashboardWidgets,
  RestaurantOperationsBundle,
  RestaurantOperationsPermissions,
  SerializedOrderQueueItem,
  SerializedReservationEntry,
  SerializedTableFloorItem,
  SplitTablesInput,
} from "@/modules/restaurant-operations/types/restaurant-operations-types";
import { moneyDecimalToPence } from "@/modules/payments/utils/currency";
import { getInventoryDashboard } from "@/services/inventory.service";
import { getMenuManagementContext } from "@/services/menu-management.service";
import { listOrders, type OrderData } from "@/services/order.service";
import { getDateRangeForPeriod, getReportingDashboard } from "@/services/reporting.service";
import { listReservations } from "@/services/reservation.service";
import { listTablesForBusiness } from "@/services/table.service";

function buildPermissions(platform: BusinessContext): RestaurantOperationsPermissions {
  const permissions = platform.authorization.permissions;

  return {
    canViewMenu: platform.isOwner || hasPermission(permissions, PERMISSION_CODES.MENU_VIEW),
    canManageMenu:
      platform.isOwner ||
      hasPermission(permissions, PERMISSION_CODES.MENU_CREATE) ||
      hasPermission(permissions, PERMISSION_CODES.MENU_UPDATE),
    canViewTables: platform.isOwner || hasPermission(permissions, PERMISSION_CODES.TABLE_MANAGE),
    canManageTables: platform.isOwner || hasPermission(permissions, PERMISSION_CODES.TABLE_MANAGE),
    canViewReservations:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.RESERVATION_VIEW),
    canManageReservations:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.RESERVATION_MANAGE),
    canViewOrders: platform.isOwner || hasPermission(permissions, PERMISSION_CODES.ORDER_VIEW),
    canManageOrders:
      platform.isOwner ||
      hasPermission(permissions, PERMISSION_CODES.ORDER_CREATE) ||
      hasPermission(permissions, PERMISSION_CODES.ORDER_CANCEL),
    canViewKitchen: platform.isOwner || hasPermission(permissions, PERMISSION_CODES.KITCHEN_VIEW),
    canUpdateKitchen:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.KITCHEN_UPDATE),
    canUsePos: platform.isOwner || hasPermission(permissions, PERMISSION_CODES.POS_USE),
    canViewInventory:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.INVENTORY_VIEW),
    canManageInventory:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.INVENTORY_MANAGE),
  };
}

async function buildDashboardWidgets(
  platform: BusinessContext,
): Promise<RestaurantDashboardWidgets> {
  const businessId = platform.business.id;
  const branchId = platform.branchId;
  const todayRange = getDateRangeForPeriod("today");

  const [
    reporting,
    kitchenQueueCount,
    todaysReservations,
    occupiedTables,
    staffOnShift,
    inventory,
  ] = await Promise.all([
    getReportingDashboard(businessId, branchId),
    prisma.kitchenQueue.count({
      where: {
        businessId,
        ...branchFilter(branchId),
        status: { in: ["NEW", "ACKNOWLEDGED", "PREPARING", "READY"] },
      },
    }),
    prisma.reservation.count({
      where: {
        businessId,
        ...branchFilter(branchId),
        reservationDate: { gte: todayRange.from, lte: todayRange.to },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
    }),
    prisma.legacyTable.count({
      where: {
        businessId,
        ...branchFilter(branchId),
        status: { in: ["OCCUPIED", "RESERVED"] },
        isActive: true,
      },
    }),
    prisma.staff.count({
      where: {
        businessId,
        isActive: true,
        ...branchFilter(branchId),
      },
    }),
    getInventoryDashboard(businessId, branchId),
  ]);

  const activeOrders = await prisma.restaurantOrder.count({
    where: {
      businessId,
      ...branchFilter(branchId),
      status: { notIn: ["COMPLETED", "CANCELLED"] },
    },
  });

  return {
    todaysSalesPence: reporting.sales.periods.today.grossRevenuePence,
    activeOrders,
    kitchenQueueCount,
    todaysReservations,
    occupiedTables,
    staffOnShift,
    inventoryAlerts: inventory.lowStock.length + inventory.outOfStock.length,
  };
}

async function getOrderAmountPaidPence(orderId: string): Promise<number> {
  const payments = await prisma.orderPayment.findMany({
    where: { orderId, status: "PAID" },
    select: { amountPaid: true },
  });

  return payments.reduce((sum, payment) => sum + moneyDecimalToPence(payment.amountPaid), 0);
}

function mapRestaurantStatusToOrderStatus(
  status: Prisma.RestaurantOrderGetPayload<{ select: { status: true } }>["status"],
): SerializedOrderQueueItem["status"] {
  if (status === "CONFIRMED") {
    return "ACCEPTED";
  }
  return status as SerializedOrderQueueItem["status"];
}

function mapRestaurantKitchenStatus(
  status: Prisma.RestaurantOrderGetPayload<{ select: { status: true } }>["status"],
): string | null {
  if (status === "PENDING" || status === "CONFIRMED") {
    return "NEW";
  }
  if (status === "PREPARING") {
    return "PREPARING";
  }
  if (status === "READY") {
    return "READY";
  }
  if (status === "SERVED" || status === "COMPLETED") {
    return "SERVED";
  }
  return null;
}

async function serializeOrderQueueItem(
  order: Prisma.RestaurantOrderGetPayload<{
    include: {
      restaurantTable: { select: { tableName: true } };
      customer: { select: { name: true; phone: true } };
      items: { select: { id: true } };
    };
  }>,
): Promise<SerializedOrderQueueItem> {
  const orderTotalPence = moneyDecimalToPence(order.totalAmount);
  const amountPaidPence = await getOrderAmountPaidPence(order.id);
  const remainingBalancePence = Math.max(orderTotalPence - amountPaidPence, 0);

  let paymentStatus: SerializedOrderQueueItem["paymentStatus"] = "UNPAID";
  if (order.paymentStatus === "PAID" || remainingBalancePence <= 0) {
    paymentStatus = "PAID";
  } else if (order.paymentStatus === "PARTIALLY_PAID" || amountPaidPence > 0) {
    paymentStatus = "PARTIAL";
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: mapRestaurantStatusToOrderStatus(order.status),
    fulfilmentType: order.orderType as SerializedOrderQueueItem["fulfilmentType"],
    customerName: order.customer?.name ?? null,
    customerPhone: order.customer?.phone ?? null,
    tableName: order.restaurantTable?.tableName ?? null,
    total:
      typeof order.totalAmount === "number" ? order.totalAmount : order.totalAmount.toNumber(),
    paymentStatus,
    amountPaidPence,
    remainingBalancePence,
    kitchenStatus: mapRestaurantKitchenStatus(order.status),
    itemCount: order.items.length,
    createdAt: order.placedAt.toISOString(),
  };
}

const restaurantOrderQueueInclude = {
  restaurantTable: { select: { tableName: true } },
  customer: { select: { name: true, phone: true } },
  items: { select: { id: true } },
} satisfies Prisma.RestaurantOrderInclude;

function normalizeDateKey(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

function getWeekRange(dateKey: string): { from: Date; to: Date } {
  const anchor = new Date(`${dateKey}T00:00:00.000Z`);
  const day = anchor.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const from = new Date(anchor);
  from.setUTCDate(anchor.getUTCDate() + diff);
  const to = new Date(from);
  to.setUTCDate(from.getUTCDate() + 6);
  return { from, to };
}

export async function getRestaurantOperationsBundle(
  platform: BusinessContext,
): Promise<RestaurantOperationsBundle> {
  const permissions = buildPermissions(platform);
  const widgets = await buildDashboardWidgets(platform);

  const orders = await prisma.restaurantOrder.findMany({
    where: {
      businessId: platform.business.id,
      ...branchFilter(platform.branchId),
    },
    include: restaurantOrderQueueInclude,
    orderBy: [{ placedAt: "desc" }],
    take: 5,
  });

  const recentOrders = await Promise.all(orders.map(serializeOrderQueueItem));

  return {
    permissions,
    widgets,
    recentOrders,
  };
}

export async function getMenuOperationsBundle(
  platform: BusinessContext,
): Promise<MenuOperationsBundle> {
  return getMenuManagementContext(platform.business.ownerId, platform.branchId);
}

export async function queryOrderQueue(
  platform: BusinessContext,
  query: OrderQueueQuery = {},
): Promise<OrderQueueResult> {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? ORDER_QUEUE_PAGE_SIZE;

  const orders = await prisma.restaurantOrder.findMany({
    where: {
      businessId: platform.business.id,
      ...branchFilter(platform.branchId),
      ...(query.status ? { status: query.status === "ACCEPTED" ? "CONFIRMED" : query.status } : {}),
      ...(query.fulfilmentType ? { orderType: query.fulfilmentType } : {}),
      ...(query.search
        ? {
            OR: [
              { orderNumber: { contains: query.search, mode: "insensitive" } },
              { customer: { name: { contains: query.search, mode: "insensitive" } } },
              { customer: { phone: { contains: query.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: restaurantOrderQueueInclude,
    orderBy: [{ placedAt: "desc" }],
  });

  const serialized = await Promise.all(orders.map(serializeOrderQueueItem));
  const filtered = query.paymentStatus
    ? serialized.filter((order) => order.paymentStatus === query.paymentStatus)
    : serialized;

  const total = filtered.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const start = (page - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getReservationOperationsBundle(
  platform: BusinessContext,
  query: ReservationOperationsQuery = {},
): Promise<ReservationOperationsBundle> {
  const anchorDate = query.date ?? normalizeDateKey(new Date());
  const weekRange = getWeekRange(anchorDate);

  const reservationRows = await prisma.reservation.findMany({
    where: {
      businessId: platform.business.id,
      ...branchFilter(platform.branchId),
      ...(query.status ? { status: query.status } : {}),
      ...(query.view === "daily"
        ? { reservationDate: new Date(`${anchorDate}T00:00:00.000Z`) }
        : {}),
      ...(query.view === "weekly"
        ? {
            reservationDate: {
              gte: weekRange.from,
              lte: weekRange.to,
            },
          }
        : {}),
    },
    include: {
      legacyTable: { select: { id: true, name: true } },
      createdByStaff: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: [{ reservationDate: "asc" }, { startTime: "asc" }],
  });

  const reservations: SerializedReservationEntry[] = reservationRows.map((reservation) => ({
    id: reservation.id,
    businessId: reservation.businessId,
    branchId: reservation.branchId,
    guestName: reservation.guestName,
    guestPhone: reservation.guestPhone,
    guestEmail: reservation.guestEmail,
    customerName: reservation.guestName,
    customerPhone: reservation.guestPhone,
    customerEmail: reservation.guestEmail,
    reservationNumber: reservation.reservationNumber,
    reservationDate: reservation.reservationDate,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    partySize: reservation.partySize,
    status: reservation.status,
    notes: reservation.notes,
    source: reservation.source,
    createdByStaffId: reservation.createdByStaffId,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt,
    createdByStaff: reservation.createdByStaff,
    tableId: reservation.legacyTableId,
    tableName: reservation.legacyTable?.name ?? null,
    isWaitlist: reservation.status === "PENDING" && reservation.legacyTableId === null,
  }));

  const waitlist = reservations.filter((entry) => entry.isWaitlist);

  const calendarDays = reservations.reduce<Array<{ date: string; count: number }>>((acc, entry) => {
    const date = normalizeDateKey(entry.reservationDate);
    const existing = acc.find((item) => item.date === date);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ date, count: 1 });
    }
    return acc;
  }, []);

  return { reservations, waitlist, calendarDays };
}

export async function getTableFloorBundle(
  platform: BusinessContext,
): Promise<SerializedTableFloorItem[]> {
  const [tables, qrCounts, reservationCounts] = await Promise.all([
    listTablesForBusiness(platform.business.id, { branchId: platform.branchId, isActive: true }),
    prisma.qRCode.groupBy({
      by: ["tableId"],
      where: {
        businessId: platform.business.id,
        ...branchFilter(platform.branchId),
        tableId: { not: null },
        isActive: true,
      },
      _count: { _all: true },
    }),
    prisma.reservation.groupBy({
      by: ["legacyTableId"],
      where: {
        businessId: platform.business.id,
        ...branchFilter(platform.branchId),
        legacyTableId: { not: null },
        status: { in: ["PENDING", "CONFIRMED", "SEATED"] },
      },
      _count: { _all: true },
    }),
  ]);

  const qrMap = new Map(
    qrCounts.filter((entry) => entry.tableId).map((entry) => [entry.tableId!, entry._count._all]),
  );
  const reservationMap = new Map(
    reservationCounts
      .filter((entry) => entry.legacyTableId)
      .map((entry) => [entry.legacyTableId!, entry._count._all]),
  );

  return tables.map((table) => ({
    ...table,
    qrCodeCount: qrMap.get(table.id) ?? 0,
    activeReservationCount: reservationMap.get(table.id) ?? 0,
  }));
}

export async function mergeTables(
  platform: BusinessContext,
  input: MergeTablesInput,
): Promise<void> {
  if (input.sourceTableIds.length === 0) {
    throw new Error("Select at least one table to merge");
  }

  if (input.sourceTableIds.includes(input.targetTableId)) {
    throw new Error("Target table cannot be included in source tables");
  }

  await prisma.$transaction(async (tx) => {
    const tables = await tx.legacyTable.findMany({
      where: {
        businessId: platform.business.id,
        id: { in: [input.targetTableId, ...input.sourceTableIds] },
      },
    });

    const target = tables.find((table) => table.id === input.targetTableId);
    if (!target) {
      throw new Error("Target table not found");
    }

    const sources = tables.filter((table) => input.sourceTableIds.includes(table.id));
    if (sources.length !== input.sourceTableIds.length) {
      throw new Error("One or more source tables not found");
    }

    const mergedCapacity =
      target.capacity + sources.reduce((total, table) => total + table.capacity, 0);

    await tx.legacyTable.update({
      where: { id: target.id },
      data: {
        capacity: mergedCapacity,
        status: "OCCUPIED",
      },
    });

    for (const source of sources) {
      await tx.legacyTable.update({
        where: { id: source.id },
        data: {
          status: "OUT_OF_SERVICE",
          isActive: false,
          section: source.section
            ? `${source.section} (merged into ${target.name})`
            : `Merged into ${target.name}`,
        },
      });
    }
  });
}

export async function splitTables(
  platform: BusinessContext,
  input: SplitTablesInput,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const target = await tx.legacyTable.findFirst({
      where: { id: input.targetTableId, businessId: platform.business.id },
    });

    if (!target) {
      throw new Error("Target table not found");
    }

    const sources = await tx.legacyTable.findMany({
      where: {
        businessId: platform.business.id,
        id: { in: input.sourceTableIds },
      },
    });

    if (sources.length !== input.sourceTableIds.length) {
      throw new Error("One or more source tables not found");
    }

    let restoredCapacity = 0;

    for (const source of sources) {
      const capacity = input.restoredCapacities[source.id];
      if (!capacity || capacity < 1) {
        throw new Error(`Invalid restored capacity for table ${source.name}`);
      }

      restoredCapacity += capacity;

      await tx.legacyTable.update({
        where: { id: source.id },
        data: {
          capacity,
          status: "AVAILABLE",
          isActive: true,
        },
      });
    }

    const nextCapacity = Math.max(target.capacity - restoredCapacity, 1);
    await tx.legacyTable.update({
      where: { id: target.id },
      data: {
        capacity: nextCapacity,
        status: "AVAILABLE",
      },
    });
  });
}

export async function bulkUpdateMenuAvailability(
  platform: BusinessContext,
  input: BulkMenuAvailabilityInput,
): Promise<void> {
  if (input.menuItemIds.length === 0) {
    throw new Error("Select at least one menu item");
  }

  await prisma.menuItem.updateMany({
    where: {
      businessId: platform.business.id,
      id: { in: input.menuItemIds },
    },
    data: { isAvailable: input.isAvailable },
  });
}

export async function cancelRestaurantOrder(
  platform: BusinessContext,
  orderId: string,
): Promise<OrderData> {
  const order = await prisma.restaurantOrder.findFirst({
    where: { id: orderId, businessId: platform.business.id },
    select: { id: true, branchId: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const { cancelOrder } = await import("@/services/order.service");
  return cancelOrder(orderId, platform.business.id, order.branchId);
}

export async function listRestaurantOrdersForVerification(
  platform: BusinessContext,
): Promise<number> {
  const orders = await listOrders(platform.business.id, { branchId: platform.branchId });
  return orders.length;
}

export async function listRestaurantReservationsForVerification(
  platform: BusinessContext,
): Promise<number> {
  const reservations = await listReservations(platform.business.ownerId, {
    branchId: platform.branchId,
  });
  return reservations.length;
}
