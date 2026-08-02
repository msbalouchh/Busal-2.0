import "server-only";

import type { Prisma, RestaurantOrderItemStatus, RestaurantOrderStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  calculateElapsedMinutes,
  mapOrderStatusToKitchen,
  validateKitchenItemStatusTransition,
  validateKitchenOrderTransition,
  validateKitchenStationInput,
} from "@/modules/kitchen-display-management/lib/kitchen-validation";
import type {
  KitchenDashboardStats,
  KitchenOrderRecord,
  KitchenQueueQuery,
  KitchenStationInput,
  KitchenStationRecord,
} from "@/modules/kitchen-display-management/types/kitchen-display-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

const kitchenOrderInclude = {
  customer: { select: { name: true } },
  restaurantTable: { select: { tableNumber: true, tableName: true } },
  items: {
    include: {
      modifiers: { select: { id: true, nameSnapshot: true } },
      product: { select: { preparationTime: true } },
    },
    orderBy: [{ createdAt: "asc" as const }],
  },
} satisfies Prisma.RestaurantOrderInclude;

type KitchenOrderPayload = Prisma.RestaurantOrderGetPayload<{
  include: typeof kitchenOrderInclude;
}>;

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

async function assertBranchInBusiness(businessId: string, branchId: string): Promise<void> {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, businessId },
    select: { id: true },
  });

  if (!branch) throw new Error("Branch not found");
}

async function getOwnedKitchenOrder(
  businessId: string,
  branchId: string,
  orderId: string,
): Promise<KitchenOrderPayload> {
  const order = await prisma.restaurantOrder.findFirst({
    where: { id: orderId, businessId, branchId },
    include: kitchenOrderInclude,
  });

  if (!order) throw new Error("Order not found");
  return order;
}

async function getStationProductIds(
  stationId: string | null | undefined,
): Promise<string[] | null> {
  if (!stationId) return null;

  const assignments = await prisma.kitchenStationProduct.findMany({
    where: { stationId },
    select: { productId: true },
  });

  return assignments.map((entry) => entry.productId);
}

function serializeKitchenOrder(
  order: KitchenOrderPayload,
  stationProductIds: string[] | null,
): KitchenOrderRecord {
  const items = order.items
    .filter((item) => !stationProductIds || stationProductIds.includes(item.productId))
    .map((item) => ({
      id: item.id,
      productId: item.productId,
      productNameSnapshot: item.productNameSnapshot,
      quantity: item.quantity,
      specialInstructions: item.specialInstructions,
      status: item.status,
      preparingStartedAt: item.preparingStartedAt?.toISOString() ?? null,
      readyAt: item.readyAt?.toISOString() ?? null,
      preparationTimeMinutes: item.product.preparationTime,
      modifiers: item.modifiers.map((modifier) => ({
        id: modifier.id,
        nameSnapshot: modifier.nameSnapshot,
      })),
    }));

  return {
    id: order.id,
    branchId: order.branchId,
    orderNumber: order.orderNumber,
    orderType: order.orderType,
    tableLabel: order.restaurantTable
      ? (order.restaurantTable.tableName ?? order.restaurantTable.tableNumber)
      : null,
    customerName: order.customer?.name ?? null,
    notes: order.notes,
    status: order.status,
    kitchenStatus: mapOrderStatusToKitchen(order.status),
    isPriority: order.isPriority,
    placedAt: order.placedAt.toISOString(),
    kitchenAcceptedAt: order.kitchenAcceptedAt?.toISOString() ?? null,
    kitchenPreparingAt: order.kitchenPreparingAt?.toISOString() ?? null,
    kitchenReadyAt: order.kitchenReadyAt?.toISOString() ?? null,
    kitchenServedAt: order.kitchenServedAt?.toISOString() ?? null,
    elapsedMinutes: calculateElapsedMinutes(order.placedAt.toISOString()),
    items,
  };
}

function buildKitchenWhere(
  businessId: string,
  query: KitchenQueueQuery,
): Prisma.RestaurantOrderWhereInput {
  const where: Prisma.RestaurantOrderWhereInput = {
    businessId,
    branchId: query.branchId,
    status: { notIn: ["CANCELLED"] },
  };

  if (query.status && query.status !== "ALL") {
    const statusMap: Record<string, RestaurantOrderStatus> = {
      NEW: "PENDING",
      ACCEPTED: "CONFIRMED",
      PREPARING: "PREPARING",
      READY: "READY",
      SERVED: "SERVED",
      COMPLETED: "COMPLETED",
    };
    where.status = statusMap[query.status];
  } else {
    where.status = { in: ["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED", "COMPLETED"] };
  }

  if (query.search?.trim()) {
    const search = query.search.trim();
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function getKitchenDashboardStats(
  businessId: string,
  branchId: string,
): Promise<KitchenDashboardStats> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const base = { businessId, branchId };

  const [
    newCount,
    acceptedCount,
    preparingCount,
    readyCount,
    servedToday,
    completedToday,
    priorityCount,
    prepOrders,
  ] = await Promise.all([
    prisma.restaurantOrder.count({ where: { ...base, status: "PENDING" } }),
    prisma.restaurantOrder.count({ where: { ...base, status: "CONFIRMED" } }),
    prisma.restaurantOrder.count({ where: { ...base, status: "PREPARING" } }),
    prisma.restaurantOrder.count({ where: { ...base, status: "READY" } }),
    prisma.restaurantOrder.count({
      where: { ...base, status: "SERVED", placedAt: { gte: startOfDay } },
    }),
    prisma.restaurantOrder.count({
      where: { ...base, status: "COMPLETED", completedAt: { gte: startOfDay } },
    }),
    prisma.restaurantOrder.count({
      where: {
        ...base,
        isPriority: true,
        status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY"] },
      },
    }),
    prisma.restaurantOrder.findMany({
      where: {
        ...base,
        status: "COMPLETED",
        kitchenPreparingAt: { not: null },
        kitchenReadyAt: { not: null },
        completedAt: { gte: startOfDay },
      },
      select: { kitchenPreparingAt: true, kitchenReadyAt: true },
      take: 100,
    }),
  ]);

  const prepDurations = prepOrders
    .map((order) => {
      if (!order.kitchenPreparingAt || !order.kitchenReadyAt) return null;
      return (order.kitchenReadyAt.getTime() - order.kitchenPreparingAt.getTime()) / 60_000;
    })
    .filter((value): value is number => value != null);

  const averagePrepMinutes =
    prepDurations.length === 0
      ? 0
      : Math.round(prepDurations.reduce((sum, value) => sum + value, 0) / prepDurations.length);

  return {
    newCount,
    acceptedCount,
    preparingCount,
    readyCount,
    servedToday,
    completedToday,
    averagePrepMinutes,
    priorityCount,
  };
}

export async function listKitchenQueue(
  ownerId: string,
  query: KitchenQueueQuery,
): Promise<KitchenOrderRecord[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, query.branchId);

  const stationProductIds = await getStationProductIds(query.stationId);
  const where = buildKitchenWhere(businessId, query);

  if (stationProductIds && stationProductIds.length > 0) {
    where.items = { some: { productId: { in: stationProductIds } } };
  }

  const orders = await prisma.restaurantOrder.findMany({
    where,
    include: kitchenOrderInclude,
    orderBy: [{ isPriority: "desc" }, { placedAt: "asc" }],
    take: 100,
  });

  return orders
    .map((order) => serializeKitchenOrder(order, stationProductIds))
    .filter((order) => order.items.length > 0 || !stationProductIds?.length);
}

export async function listKitchenStations(
  ownerId: string,
  branchId: string,
): Promise<KitchenStationRecord[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, branchId);

  const stations = await prisma.kitchenStation.findMany({
    where: { businessId, branchId, status: { not: "ARCHIVED" } },
    include: {
      products: { select: { productId: true } },
      _count: { select: { products: true } },
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  return stations.map((station) => ({
    id: station.id,
    businessId: station.businessId,
    branchId: station.branchId,
    name: station.name,
    description: station.description,
    displayOrder: station.displayOrder,
    status: station.status,
    productCount: station._count.products,
    productIds: station.products.map((entry) => entry.productId),
  }));
}

export async function createKitchenStation(ownerId: string, input: KitchenStationInput) {
  validateKitchenStationInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, input.branchId);

  const station = await prisma.kitchenStation.create({
    data: {
      businessId,
      branchId: input.branchId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      displayOrder: input.displayOrder ?? 0,
      status: input.status ?? "ACTIVE",
      products: input.productIds?.length
        ? { create: input.productIds.map((productId) => ({ productId })) }
        : undefined,
    },
    include: { products: { select: { productId: true } }, _count: { select: { products: true } } },
  });

  return {
    id: station.id,
    businessId: station.businessId,
    branchId: station.branchId,
    name: station.name,
    description: station.description,
    displayOrder: station.displayOrder,
    status: station.status,
    productCount: station._count.products,
    productIds: station.products.map((entry) => entry.productId),
  } satisfies KitchenStationRecord;
}

export async function updateKitchenStation(
  ownerId: string,
  stationId: string,
  input: KitchenStationInput,
) {
  validateKitchenStationInput(input);
  const businessId = await getOwnedBusinessId(ownerId);

  const existing = await prisma.kitchenStation.findFirst({
    where: { id: stationId, businessId, branchId: input.branchId },
  });

  if (!existing) throw new Error("Kitchen station not found");

  await prisma.kitchenStationProduct.deleteMany({ where: { stationId } });

  const station = await prisma.kitchenStation.update({
    where: { id: stationId },
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      displayOrder: input.displayOrder ?? existing.displayOrder,
      status: input.status ?? existing.status,
      products: input.productIds?.length
        ? { create: input.productIds.map((productId) => ({ productId })) }
        : undefined,
    },
    include: { products: { select: { productId: true } }, _count: { select: { products: true } } },
  });

  return {
    id: station.id,
    businessId: station.businessId,
    branchId: station.branchId,
    name: station.name,
    description: station.description,
    displayOrder: station.displayOrder,
    status: station.status,
    productCount: station._count.products,
    productIds: station.products.map((entry) => entry.productId),
  } satisfies KitchenStationRecord;
}

export async function listBranchProductsForKitchenStation(ownerId: string, branchId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, branchId);

  const products = await prisma.product.findMany({
    where: { businessId, status: "ACTIVE" },
    select: { id: true, name: true, preparationTime: true },
    orderBy: [{ name: "asc" }],
    take: 300,
  });

  return products.map((product) => ({
    id: product.id,
    label: product.name,
    preparationTime: product.preparationTime,
  }));
}

async function transitionKitchenOrder(
  ownerId: string,
  branchId: string,
  orderId: string,
  nextStatus: RestaurantOrderStatus,
): Promise<KitchenOrderRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedKitchenOrder(businessId, branchId, orderId);
  validateKitchenOrderTransition(existing.status, nextStatus);

  const now = new Date();
  const order = await prisma.restaurantOrder.update({
    where: { id: orderId },
    data: {
      status: nextStatus,
      ...(nextStatus === "CONFIRMED" ? { kitchenAcceptedAt: now } : {}),
      ...(nextStatus === "PREPARING" ? { kitchenPreparingAt: now } : {}),
      ...(nextStatus === "READY" ? { kitchenReadyAt: now } : {}),
      ...(nextStatus === "SERVED" ? { kitchenServedAt: now } : {}),
      ...(nextStatus === "COMPLETED" ? { completedAt: now } : {}),
    },
    include: kitchenOrderInclude,
  });

  return serializeKitchenOrder(order, null);
}

export async function acceptKitchenOrder(ownerId: string, branchId: string, orderId: string) {
  return transitionKitchenOrder(ownerId, branchId, orderId, "CONFIRMED");
}

export async function startKitchenPreparing(ownerId: string, branchId: string, orderId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedKitchenOrder(businessId, branchId, orderId);

  validateKitchenOrderTransition(existing.status, "PREPARING");

  const now = new Date();
  const order = await prisma.restaurantOrder.update({
    where: { id: orderId },
    data: {
      status: "PREPARING",
      kitchenAcceptedAt: existing.kitchenAcceptedAt ?? now,
      kitchenPreparingAt: now,
      items: {
        updateMany: {
          where: { status: "PENDING" },
          data: { status: "PREPARING", preparingStartedAt: now },
        },
      },
    },
    include: kitchenOrderInclude,
  });

  return serializeKitchenOrder(order, null);
}

export async function markKitchenOrderReady(ownerId: string, branchId: string, orderId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  await getOwnedKitchenOrder(businessId, branchId, orderId);
  const now = new Date();

  const order = await prisma.restaurantOrder.update({
    where: { id: orderId },
    data: {
      status: "READY",
      kitchenReadyAt: now,
      items: {
        updateMany: {
          where: { status: { in: ["PENDING", "PREPARING"] } },
          data: { status: "READY", readyAt: now },
        },
      },
    },
    include: kitchenOrderInclude,
  });

  return serializeKitchenOrder(order, null);
}

export async function markKitchenOrderServed(ownerId: string, branchId: string, orderId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  await getOwnedKitchenOrder(businessId, branchId, orderId);
  const now = new Date();

  const order = await prisma.restaurantOrder.update({
    where: { id: orderId },
    data: {
      status: "SERVED",
      kitchenServedAt: now,
      items: {
        updateMany: {
          where: { status: { in: ["PENDING", "PREPARING", "READY"] } },
          data: { status: "SERVED" },
        },
      },
    },
    include: kitchenOrderInclude,
  });

  return serializeKitchenOrder(order, null);
}

export async function completeKitchenOrder(ownerId: string, branchId: string, orderId: string) {
  return transitionKitchenOrder(ownerId, branchId, orderId, "COMPLETED");
}

export async function toggleKitchenOrderPriority(
  ownerId: string,
  branchId: string,
  orderId: string,
  isPriority: boolean,
) {
  const businessId = await getOwnedBusinessId(ownerId);
  await getOwnedKitchenOrder(businessId, branchId, orderId);

  const order = await prisma.restaurantOrder.update({
    where: { id: orderId },
    data: { isPriority },
    include: kitchenOrderInclude,
  });

  return serializeKitchenOrder(order, null);
}

export async function updateKitchenItemStatus(
  ownerId: string,
  branchId: string,
  orderId: string,
  itemId: string,
  nextStatus: RestaurantOrderItemStatus,
) {
  const businessId = await getOwnedBusinessId(ownerId);
  await getOwnedKitchenOrder(businessId, branchId, orderId);

  const item = await prisma.restaurantOrderItem.findFirst({
    where: { id: itemId, orderId },
  });

  if (!item) throw new Error("Order item not found");
  validateKitchenItemStatusTransition(item.status, nextStatus);

  const now = new Date();
  await prisma.restaurantOrderItem.update({
    where: { id: itemId },
    data: {
      status: nextStatus,
      ...(nextStatus === "PREPARING" ? { preparingStartedAt: now } : {}),
      ...(nextStatus === "READY" ? { readyAt: now } : {}),
    },
  });

  const order = await getOwnedKitchenOrder(businessId, branchId, orderId);
  return serializeKitchenOrder(order, null);
}

export async function assignProductsToKitchenStation(
  ownerId: string,
  stationId: string,
  branchId: string,
  productIds: string[],
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const station = await prisma.kitchenStation.findFirst({
    where: { id: stationId, businessId, branchId },
  });

  if (!station) throw new Error("Kitchen station not found");

  await prisma.kitchenStationProduct.deleteMany({ where: { stationId } });

  if (productIds.length > 0) {
    await prisma.kitchenStationProduct.createMany({
      data: productIds.map((productId) => ({ stationId, productId })),
      skipDuplicates: true,
    });
  }

  return listKitchenStations(ownerId, branchId);
}
