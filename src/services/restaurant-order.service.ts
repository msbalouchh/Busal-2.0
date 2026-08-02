import "server-only";

import type { Prisma, RestaurantOrderStatus } from "@prisma/client";
import { randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";
import { ORDER_LIST_PAGE_SIZE } from "@/modules/order-management/constants/routes";
import {
  buildDuplicateOrderNumber,
  calculateLineAmounts,
  calculateOrderTotals,
  validateOrderInput,
  validateOrderStatusTransition,
} from "@/modules/order-management/lib/order-validation";
import type {
  MergeOrdersInput,
  OrderAdjustmentsInput,
  OrderDashboardStats,
  OrderItemInput,
  OrderListQuery,
  OrderListResult,
  OrderManagementInput,
  OrderManagementRecord,
  OrderSortField,
  ProductSelectOption,
  SplitOrderInput,
  TransferOrderTableInput,
} from "@/modules/order-management/types/order-management-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

type OrderPayload = Prisma.RestaurantOrderGetPayload<{ include: typeof orderInclude }>;

const orderInclude = {
  customer: { select: { id: true, name: true } },
  restaurantTable: { select: { id: true, tableNumber: true, tableName: true } },
  reservation: { select: { id: true, reservationNumber: true } },
  staff: { select: { id: true, fullName: true, firstName: true, lastName: true } },
  items: {
    include: { modifiers: true },
    orderBy: [{ createdAt: "asc" as const }],
  },
} satisfies Prisma.RestaurantOrderInclude;

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

async function assertBranchInBusiness(businessId: string, branchId: string): Promise<void> {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, businessId },
    select: { id: true },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }
}

function decimalToNumber(value: Prisma.Decimal): number {
  return Number(value);
}

function serializeOrder(order: OrderPayload): OrderManagementRecord {
  return {
    id: order.id,
    businessId: order.businessId,
    branchId: order.branchId,
    orderNumber: order.orderNumber,
    orderType: order.orderType,
    customerId: order.customerId,
    customerName: order.customer?.name ?? null,
    restaurantTableId: order.restaurantTableId,
    tableLabel: order.restaurantTable
      ? (order.restaurantTable.tableName ?? order.restaurantTable.tableNumber)
      : null,
    reservationId: order.reservationId,
    reservationNumber: order.reservation?.reservationNumber ?? null,
    staffId: order.staffId,
    staffName: order.staff
      ? order.staff.fullName || `${order.staff.firstName} ${order.staff.lastName}`.trim()
      : null,
    status: order.status,
    subtotal: decimalToNumber(order.subtotal),
    discountAmount: decimalToNumber(order.discountAmount),
    taxAmount: decimalToNumber(order.taxAmount),
    serviceCharge: decimalToNumber(order.serviceCharge),
    deliveryCharge: decimalToNumber(order.deliveryCharge),
    tipAmount: decimalToNumber(order.tipAmount),
    totalAmount: decimalToNumber(order.totalAmount),
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    notes: order.notes,
    placedAt: order.placedAt.toISOString(),
    completedAt: order.completedAt?.toISOString() ?? null,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productNameSnapshot: item.productNameSnapshot,
      quantity: item.quantity,
      unitPrice: decimalToNumber(item.unitPrice),
      discountAmount: decimalToNumber(item.discountAmount),
      taxAmount: decimalToNumber(item.taxAmount),
      totalAmount: decimalToNumber(item.totalAmount),
      specialInstructions: item.specialInstructions,
      status: item.status,
      modifiers: item.modifiers.map((modifier) => ({
        id: modifier.id,
        modifierOptionId: modifier.modifierOptionId,
        nameSnapshot: modifier.nameSnapshot,
        priceAdjustment: decimalToNumber(modifier.priceAdjustment),
      })),
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

async function generateOrderNumber(businessId: string): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const suffix = randomBytes(3).toString("hex").toUpperCase();
    const orderNumber = `ORD-${datePart}-${suffix}`;

    const existing = await prisma.restaurantOrder.findFirst({
      where: { businessId, orderNumber },
      select: { id: true },
    });

    if (!existing) {
      return orderNumber;
    }
  }

  throw new Error("Unable to generate order number");
}

async function getOwnedOrder(
  businessId: string,
  branchId: string,
  orderId: string,
): Promise<OrderPayload> {
  const order = await prisma.restaurantOrder.findFirst({
    where: { id: orderId, businessId, branchId },
    include: orderInclude,
  });

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
}

async function resolveProductModifiers(
  productId: string,
  modifierOptionIds: string[] = [],
): Promise<Array<{ modifierOptionId: string; nameSnapshot: string; priceAdjustment: number }>> {
  if (modifierOptionIds.length === 0) {
    return [];
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      modifierGroups: {
        select: {
          modifierGroup: {
            select: {
              id: true,
              minimumSelection: true,
              maximumSelection: true,
              isRequired: true,
              options: {
                where: { status: "ACTIVE" },
                select: { id: true, name: true, priceAdjustment: true },
              },
            },
          },
        },
      },
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  const allowedOptionIds = new Set(
    product.modifierGroups.flatMap((entry) =>
      entry.modifierGroup.options.map((option) => option.id),
    ),
  );

  for (const optionId of modifierOptionIds) {
    if (!allowedOptionIds.has(optionId)) {
      throw new Error("Invalid modifier selection for product");
    }
  }

  const options = await prisma.modifierOption.findMany({
    where: { id: { in: modifierOptionIds }, status: "ACTIVE" },
    select: { id: true, name: true, priceAdjustment: true },
  });

  return options.map((option) => ({
    modifierOptionId: option.id,
    nameSnapshot: option.name,
    priceAdjustment: Number(option.priceAdjustment),
  }));
}

async function buildItemCreateData(items: OrderItemInput[]) {
  const createItems: Prisma.RestaurantOrderItemCreateWithoutOrderInput[] = [];

  for (const item of items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, status: "ACTIVE" },
      select: { id: true, name: true, price: true, taxRate: true },
    });

    if (!product) {
      throw new Error("Product must be active");
    }

    const modifiers = await resolveProductModifiers(item.productId, item.modifierOptionIds);
    const modifierTotal = modifiers.reduce((sum, modifier) => sum + modifier.priceAdjustment, 0);
    const unitPrice = Number(product.price);
    const taxRate = product.taxRate ? Number(product.taxRate) : null;
    const amounts = calculateLineAmounts(
      unitPrice,
      item.quantity,
      modifierTotal,
      taxRate,
      item.discountAmount ?? 0,
    );

    createItems.push({
      product: { connect: { id: product.id } },
      productNameSnapshot: product.name,
      quantity: item.quantity,
      unitPrice,
      discountAmount: item.discountAmount ?? 0,
      taxAmount: amounts.taxAmount,
      totalAmount: amounts.totalAmount,
      specialInstructions: item.specialInstructions?.trim() || null,
      modifiers: {
        create: modifiers.map((modifier) => ({
          modifierOptionId: modifier.modifierOptionId,
          nameSnapshot: modifier.nameSnapshot,
          priceAdjustment: modifier.priceAdjustment,
        })),
      },
    });
  }

  return createItems;
}

function resolveOrderOrderBy(
  sortBy: OrderSortField = "placedAt",
  sortDirection: "asc" | "desc" = "desc",
): Prisma.RestaurantOrderOrderByWithRelationInput[] {
  switch (sortBy) {
    case "orderNumber":
      return [{ orderNumber: sortDirection }];
    case "totalAmount":
      return [{ totalAmount: sortDirection }];
    case "status":
      return [{ status: sortDirection }, { placedAt: "desc" }];
    case "createdAt":
      return [{ createdAt: sortDirection }];
    case "placedAt":
    default:
      return [{ placedAt: sortDirection }];
  }
}

function buildOrderWhere(
  businessId: string,
  query: OrderListQuery,
): Prisma.RestaurantOrderWhereInput {
  const where: Prisma.RestaurantOrderWhereInput = {
    businessId,
    branchId: query.branchId,
  };

  if (query.status && query.status !== "ALL") where.status = query.status;
  if (query.orderType && query.orderType !== "ALL") where.orderType = query.orderType;
  if (query.paymentStatus && query.paymentStatus !== "ALL")
    where.paymentStatus = query.paymentStatus;

  if (query.search?.trim()) {
    const search = query.search.trim();
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  return where;
}

export async function getOrderDashboardStats(
  businessId: string,
  branchId: string,
): Promise<OrderDashboardStats> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const baseWhere = { businessId, branchId, placedAt: { gte: startOfDay } };

  const [
    totalToday,
    pendingToday,
    preparingToday,
    readyToday,
    completedToday,
    cancelledToday,
    unpaidToday,
    revenueAggregate,
  ] = await Promise.all([
    prisma.restaurantOrder.count({ where: baseWhere }),
    prisma.restaurantOrder.count({ where: { ...baseWhere, status: "PENDING" } }),
    prisma.restaurantOrder.count({ where: { ...baseWhere, status: "PREPARING" } }),
    prisma.restaurantOrder.count({ where: { ...baseWhere, status: "READY" } }),
    prisma.restaurantOrder.count({ where: { ...baseWhere, status: "COMPLETED" } }),
    prisma.restaurantOrder.count({ where: { ...baseWhere, status: "CANCELLED" } }),
    prisma.restaurantOrder.count({ where: { ...baseWhere, paymentStatus: "UNPAID" } }),
    prisma.restaurantOrder.aggregate({
      where: { ...baseWhere, status: "COMPLETED" },
      _sum: { totalAmount: true },
    }),
  ]);

  return {
    totalToday,
    pendingToday,
    preparingToday,
    readyToday,
    completedToday,
    cancelledToday,
    unpaidToday,
    revenueToday: Number(revenueAggregate._sum.totalAmount ?? 0),
  };
}

export async function listManagedOrders(
  ownerId: string,
  query: OrderListQuery,
): Promise<OrderListResult> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, query.branchId);

  const pageSize = query.pageSize ?? ORDER_LIST_PAGE_SIZE;
  const page = Math.max(1, query.page ?? 1);
  const where = buildOrderWhere(businessId, query);

  const [total, items] = await Promise.all([
    prisma.restaurantOrder.count({ where }),
    prisma.restaurantOrder.findMany({
      where,
      include: orderInclude,
      orderBy: resolveOrderOrderBy(query.sortBy, query.sortDirection),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: items.map(serializeOrder),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getManagedOrder(
  ownerId: string,
  branchId: string,
  orderId: string,
): Promise<OrderManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const order = await getOwnedOrder(businessId, branchId, orderId);
  return serializeOrder(order);
}

export interface CreateRestaurantOrderParams {
  businessId: string;
  branchId: string;
  orderType: OrderManagementInput["orderType"];
  customerId?: string | null;
  restaurantTableId?: string | null;
  reservationId?: string | null;
  qrSessionId?: string | null;
  staffId?: string | null;
  notes?: string | null;
  items: OrderItemInput[];
  discountAmount?: number;
  serviceCharge?: number;
  deliveryCharge?: number;
  tipAmount?: number;
  paymentMethod?: OrderManagementInput["paymentMethod"];
}

export async function createRestaurantOrderForBusiness(
  input: CreateRestaurantOrderParams,
): Promise<OrderManagementRecord> {
  const itemCreates = await buildItemCreateData(input.items);
  const totals = calculateOrderTotals({
    items: itemCreates.map((item) => ({
      totalAmount: Number(item.totalAmount),
      taxAmount: Number(item.taxAmount),
    })),
    discountAmount: input.discountAmount,
    serviceCharge: input.serviceCharge,
    deliveryCharge: input.deliveryCharge,
    tipAmount: input.tipAmount,
  });

  const order = await prisma.restaurantOrder.create({
    data: {
      businessId: input.businessId,
      branchId: input.branchId,
      orderNumber: await generateOrderNumber(input.businessId),
      orderType: input.orderType,
      customerId: input.customerId ?? null,
      restaurantTableId: input.restaurantTableId ?? null,
      reservationId: input.reservationId ?? null,
      qrSessionId: input.qrSessionId ?? null,
      staffId: input.staffId ?? null,
      status: "PENDING",
      subtotal: totals.subtotal,
      discountAmount: input.discountAmount ?? 0,
      taxAmount: totals.taxAmount,
      serviceCharge: input.serviceCharge ?? 0,
      deliveryCharge: input.deliveryCharge ?? 0,
      tipAmount: input.tipAmount ?? 0,
      totalAmount: totals.totalAmount,
      paymentStatus: "UNPAID",
      paymentMethod: input.paymentMethod ?? null,
      notes: input.notes?.trim() || null,
      items: { create: itemCreates },
    },
    include: orderInclude,
  });

  return serializeOrder(order);
}

export async function createManagedOrder(
  ownerId: string,
  input: OrderManagementInput,
): Promise<OrderManagementRecord> {
  validateOrderInput(input);

  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, input.branchId);

  return createRestaurantOrderForBusiness({
    businessId,
    branchId: input.branchId,
    orderType: input.orderType,
    customerId: input.customerId,
    restaurantTableId: input.restaurantTableId,
    reservationId: input.reservationId,
    staffId: input.staffId,
    notes: input.notes,
    items: input.items,
    discountAmount: input.discountAmount,
    serviceCharge: input.serviceCharge,
    deliveryCharge: input.deliveryCharge,
    tipAmount: input.tipAmount,
    paymentMethod: input.paymentMethod,
  });
}

export async function updateManagedOrder(
  ownerId: string,
  orderId: string,
  input: OrderManagementInput,
): Promise<OrderManagementRecord> {
  validateOrderInput(input);

  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedOrder(businessId, input.branchId, orderId);

  if (["COMPLETED", "CANCELLED"].includes(existing.status)) {
    throw new Error("Cannot edit a completed or cancelled order");
  }

  await prisma.restaurantOrderItemModifier.deleteMany({
    where: { orderItem: { orderId } },
  });
  await prisma.restaurantOrderItem.deleteMany({ where: { orderId } });

  const itemCreates = await buildItemCreateData(input.items);
  const totals = calculateOrderTotals({
    items: itemCreates.map((item) => ({
      totalAmount: Number(item.totalAmount),
      taxAmount: Number(item.taxAmount),
    })),
    discountAmount: input.discountAmount,
    serviceCharge: input.serviceCharge,
    deliveryCharge: input.deliveryCharge,
    tipAmount: input.tipAmount,
  });

  const order = await prisma.restaurantOrder.update({
    where: { id: orderId },
    data: {
      orderType: input.orderType,
      customerId: input.customerId ?? null,
      restaurantTableId: input.restaurantTableId ?? null,
      reservationId: input.reservationId ?? null,
      staffId: input.staffId ?? null,
      subtotal: totals.subtotal,
      discountAmount: input.discountAmount ?? 0,
      taxAmount: totals.taxAmount,
      serviceCharge: input.serviceCharge ?? 0,
      deliveryCharge: input.deliveryCharge ?? 0,
      tipAmount: input.tipAmount ?? 0,
      totalAmount: totals.totalAmount,
      paymentMethod: input.paymentMethod ?? null,
      notes: input.notes?.trim() || null,
      items: { create: itemCreates },
    },
    include: orderInclude,
  });

  return serializeOrder(order);
}

async function transitionOrderStatus(
  ownerId: string,
  branchId: string,
  orderId: string,
  nextStatus: RestaurantOrderStatus,
): Promise<OrderManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedOrder(businessId, branchId, orderId);
  validateOrderStatusTransition(existing.status, nextStatus);

  const order = await prisma.restaurantOrder.update({
    where: { id: orderId },
    data: {
      status: nextStatus,
      ...(nextStatus === "COMPLETED" ? { completedAt: new Date() } : {}),
      ...(nextStatus === "CANCELLED" ? { cancelledAt: new Date() } : {}),
    },
    include: orderInclude,
  });

  return serializeOrder(order);
}

export async function confirmManagedOrder(ownerId: string, branchId: string, orderId: string) {
  return transitionOrderStatus(ownerId, branchId, orderId, "CONFIRMED");
}

export async function startPreparingManagedOrder(
  ownerId: string,
  branchId: string,
  orderId: string,
) {
  return transitionOrderStatus(ownerId, branchId, orderId, "PREPARING");
}

export async function markReadyManagedOrder(ownerId: string, branchId: string, orderId: string) {
  return transitionOrderStatus(ownerId, branchId, orderId, "READY");
}

export async function markServedManagedOrder(ownerId: string, branchId: string, orderId: string) {
  return transitionOrderStatus(ownerId, branchId, orderId, "SERVED");
}

export async function completeManagedOrder(ownerId: string, branchId: string, orderId: string) {
  return transitionOrderStatus(ownerId, branchId, orderId, "COMPLETED");
}

export async function cancelManagedOrder(
  ownerId: string,
  branchId: string,
  orderId: string,
): Promise<OrderManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  await getOwnedOrder(businessId, branchId, orderId);

  const order = await prisma.restaurantOrder.update({
    where: { id: orderId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      items: {
        updateMany: { where: { status: { not: "CANCELLED" } }, data: { status: "CANCELLED" } },
      },
    },
    include: orderInclude,
  });

  return serializeOrder(order);
}

export async function deleteManagedOrder(ownerId: string, branchId: string, orderId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  await getOwnedOrder(businessId, branchId, orderId);
  await prisma.restaurantOrder.delete({ where: { id: orderId } });
}

export async function applyOrderAdjustments(ownerId: string, input: OrderAdjustmentsInput) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedOrder(businessId, input.branchId, input.orderId);

  const discountAmount = input.discountAmount ?? decimalToNumber(existing.discountAmount);
  const serviceCharge = input.serviceCharge ?? decimalToNumber(existing.serviceCharge);
  const deliveryCharge = input.deliveryCharge ?? decimalToNumber(existing.deliveryCharge);
  const tipAmount = input.tipAmount ?? decimalToNumber(existing.tipAmount);

  const totals = calculateOrderTotals({
    items: existing.items.map((item) => ({
      totalAmount: decimalToNumber(item.totalAmount),
      taxAmount: decimalToNumber(item.taxAmount),
    })),
    discountAmount,
    serviceCharge,
    deliveryCharge,
    tipAmount,
  });

  const order = await prisma.restaurantOrder.update({
    where: { id: input.orderId },
    data: {
      discountAmount,
      serviceCharge,
      deliveryCharge,
      tipAmount,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
    },
    include: orderInclude,
  });

  return serializeOrder(order);
}

export async function transferOrderTable(ownerId: string, input: TransferOrderTableInput) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedOrder(businessId, input.branchId, input.orderId);

  if (existing.orderType !== "DINE_IN") {
    throw new Error("Only dine-in orders can be transferred");
  }

  const table = await prisma.restaurantTable.findFirst({
    where: {
      id: input.restaurantTableId,
      businessId,
      branchId: input.branchId,
      status: { notIn: ["ARCHIVED", "OUT_OF_SERVICE"] },
    },
    select: { id: true },
  });

  if (!table) throw new Error("Table not found");

  const order = await prisma.restaurantOrder.update({
    where: { id: input.orderId },
    data: { restaurantTableId: input.restaurantTableId },
    include: orderInclude,
  });

  return serializeOrder(order);
}

export async function splitManagedOrder(ownerId: string, input: SplitOrderInput) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedOrder(businessId, input.branchId, input.orderId);

  if (input.itemIds.length === 0) throw new Error("Select items to split");

  const splitItems = existing.items.filter((item) => input.itemIds.includes(item.id));
  if (splitItems.length === 0 || splitItems.length === existing.items.length) {
    throw new Error("Split must move at least one item and leave at least one item");
  }

  const remainingItems = existing.items.filter((item) => !input.itemIds.includes(item.id));
  const splitTotals = calculateOrderTotals({
    items: splitItems.map((item) => ({
      totalAmount: decimalToNumber(item.totalAmount),
      taxAmount: decimalToNumber(item.taxAmount),
    })),
  });
  const remainingTotals = calculateOrderTotals({
    items: remainingItems.map((item) => ({
      totalAmount: decimalToNumber(item.totalAmount),
      taxAmount: decimalToNumber(item.taxAmount),
    })),
    discountAmount: decimalToNumber(existing.discountAmount),
    serviceCharge: decimalToNumber(existing.serviceCharge),
    deliveryCharge: decimalToNumber(existing.deliveryCharge),
    tipAmount: decimalToNumber(existing.tipAmount),
  });

  const newOrder = await prisma.$transaction(async (tx) => {
    const created = await tx.restaurantOrder.create({
      data: {
        businessId,
        branchId: input.branchId,
        orderNumber: buildDuplicateOrderNumber(existing.orderNumber),
        orderType: existing.orderType,
        customerId: existing.customerId,
        restaurantTableId: existing.restaurantTableId,
        reservationId: existing.reservationId,
        staffId: existing.staffId,
        status: existing.status,
        subtotal: splitTotals.subtotal,
        taxAmount: splitTotals.taxAmount,
        totalAmount: splitTotals.totalAmount,
        paymentStatus: existing.paymentStatus,
        paymentMethod: existing.paymentMethod,
        notes: existing.notes,
        mergedFromOrderId: existing.id,
      },
    });

    await tx.restaurantOrderItem.updateMany({
      where: { id: { in: input.itemIds } },
      data: { orderId: created.id },
    });

    await tx.restaurantOrder.update({
      where: { id: existing.id },
      data: {
        subtotal: remainingTotals.subtotal,
        taxAmount: remainingTotals.taxAmount,
        totalAmount: remainingTotals.totalAmount,
      },
    });

    return tx.restaurantOrder.findUniqueOrThrow({
      where: { id: created.id },
      include: orderInclude,
    });
  });

  return serializeOrder(newOrder);
}

export async function mergeManagedOrders(ownerId: string, input: MergeOrdersInput) {
  const businessId = await getOwnedBusinessId(ownerId);
  const target = await getOwnedOrder(businessId, input.branchId, input.targetOrderId);

  if (input.sourceOrderIds.length === 0) throw new Error("Select orders to merge");

  const sources = await prisma.restaurantOrder.findMany({
    where: {
      id: { in: input.sourceOrderIds },
      businessId,
      branchId: input.branchId,
      status: { notIn: ["COMPLETED", "CANCELLED"] },
    },
    include: orderInclude,
  });

  if (sources.length !== input.sourceOrderIds.length) {
    throw new Error("One or more source orders are invalid");
  }

  const allItems = [...target.items, ...sources.flatMap((order) => order.items)];
  const totals = calculateOrderTotals({
    items: allItems.map((item) => ({
      totalAmount: decimalToNumber(item.totalAmount),
      taxAmount: decimalToNumber(item.taxAmount),
    })),
    discountAmount: decimalToNumber(target.discountAmount),
    serviceCharge: decimalToNumber(target.serviceCharge),
    deliveryCharge: decimalToNumber(target.deliveryCharge),
    tipAmount: decimalToNumber(target.tipAmount),
  });

  const merged = await prisma.$transaction(async (tx) => {
    for (const source of sources) {
      await tx.restaurantOrderItem.updateMany({
        where: { orderId: source.id },
        data: { orderId: target.id },
      });

      await tx.restaurantOrder.update({
        where: { id: source.id },
        data: { status: "CANCELLED", cancelledAt: new Date(), mergedFromOrderId: target.id },
      });
    }

    return tx.restaurantOrder.update({
      where: { id: target.id },
      data: {
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
      },
      include: orderInclude,
    });
  });

  return serializeOrder(merged);
}

export async function listBranchProductsForOrder(
  ownerId: string,
  branchId: string,
): Promise<ProductSelectOption[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, branchId);

  const products = await prisma.product.findMany({
    where: { businessId, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      price: true,
      taxRate: true,
      modifierGroups: {
        orderBy: { displayOrder: "asc" },
        select: {
          modifierGroup: {
            select: {
              id: true,
              name: true,
              minimumSelection: true,
              maximumSelection: true,
              isRequired: true,
              options: {
                where: { status: "ACTIVE" },
                orderBy: { displayOrder: "asc" },
                select: { id: true, name: true, priceAdjustment: true },
              },
            },
          },
        },
      },
    },
    orderBy: [{ name: "asc" }],
    take: 200,
  });

  return products.map((product) => ({
    id: product.id,
    label: product.name,
    price: Number(product.price),
    taxRate: product.taxRate ? Number(product.taxRate) : null,
    modifierGroups: product.modifierGroups.map((entry) => ({
      id: entry.modifierGroup.id,
      name: entry.modifierGroup.name,
      minSelections: entry.modifierGroup.minimumSelection,
      maxSelections: entry.modifierGroup.maximumSelection,
      isRequired: entry.modifierGroup.isRequired,
      options: entry.modifierGroup.options.map((option) => ({
        id: option.id,
        name: option.name,
        priceAdjustment: Number(option.priceAdjustment),
      })),
    })),
  }));
}

export async function listBranchTablesForOrderSelect(ownerId: string, branchId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const tables = await prisma.restaurantTable.findMany({
    where: { businessId, branchId, status: { notIn: ["ARCHIVED", "OUT_OF_SERVICE"] } },
    include: { floor: { select: { name: true } } },
    orderBy: [{ tableNumber: "asc" }],
  });

  return tables.map((table) => ({
    id: table.id,
    label: `${table.floor.name} · ${table.tableName ?? table.tableNumber}`,
  }));
}

export async function listBranchStaffForOrderSelect(ownerId: string, branchId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const staff = await prisma.staff.findMany({
    where: {
      businessId,
      employmentStatus: "ACTIVE",
      OR: [{ branchId }, { branchAssignments: { some: { branchId } } }],
    },
    select: { id: true, firstName: true, lastName: true, fullName: true },
    orderBy: [{ firstName: "asc" }],
  });

  return staff.map((member) => ({
    id: member.id,
    label: member.fullName || `${member.firstName} ${member.lastName}`.trim(),
  }));
}

export async function listBranchCustomersForOrderSelect(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const customers = await prisma.customer.findMany({
    where: { businessId, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 100,
  });

  return customers.map((customer) => ({ id: customer.id, label: customer.name }));
}
