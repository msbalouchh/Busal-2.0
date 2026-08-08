import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  calculateLineAmounts,
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
  ProductSelectOption,
  SplitOrderInput,
  TransferOrderTableInput,
} from "@/modules/order-management/types/order-management-types";
import { ORDER_SOURCES, ORDER_STATUSES } from "@/modules/orders/constants/order-status";
import { buildOrderScopeFromInput, toOmsPlatformContext } from "@/modules/orders/lib/order-scope";
import {
  mapDomainStatusToPrisma,
  mapManagementOrderTypeToDomain,
  mapOrderRecordToManagementRecord,
} from "@/modules/orders/services/order-record-mapper.service";
import { orderService } from "@/modules/orders/services/order.service";
import { buildOmsPlatformSnapshot } from "@/modules/orders/services/oms-platform.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

function buildScope(ownerId: string, businessId: string, branchId: string) {
  const scope = buildOrderScopeFromInput({
    businessId,
    branchId,
    userId: ownerId,
  });
  return { scope, context: toOmsPlatformContext(scope) };
}

async function resolveProductModifiers(productId: string, modifierOptionIds: string[] = []) {
  if (modifierOptionIds.length === 0) {
    return [];
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

async function mapItemsToCreateInput(items: OrderItemInput[]) {
  const mapped: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPricePence: number;
    modifierOptionIds?: string[];
    notes?: string | null;
  }> = [];

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

    mapped.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPricePence: Math.round(unitPrice * 100),
      modifierOptionIds: item.modifierOptionIds,
      notes: item.specialInstructions,
    });

    void amounts;
  }

  return mapped;
}

function mapManagementInputToCreate(
  businessId: string,
  input: OrderManagementInput,
  scope: ReturnType<typeof buildOrderScopeFromInput>,
) {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId,
    branchId: input.branchId,
    customerId: input.customerId,
    orderType: mapManagementOrderTypeToDomain(input.orderType),
    source: ORDER_SOURCES.STAFF,
    tableId: input.restaurantTableId,
    reservationId: input.reservationId,
    notes: input.notes,
    discountAmountPence: Math.round((input.discountAmount ?? 0) * 100),
    serviceChargePence: Math.round((input.serviceCharge ?? 0) * 100),
    deliveryChargePence: Math.round((input.deliveryCharge ?? 0) * 100),
  };
}

export async function getOrderDashboardStats(
  businessId: string,
  branchId: string,
): Promise<OrderDashboardStats> {
  const scope = buildOrderScopeFromInput({ businessId, branchId, userId: "system" });
  const context = toOmsPlatformContext(scope);
  const snapshot = await buildOmsPlatformSnapshot(context);
  const today = new Date().toISOString().slice(0, 10);

  const todayOrders = snapshot.orders.filter(
    (record) => record.order.createdAt.slice(0, 10) === today,
  );

  return {
    totalToday: todayOrders.length,
    pendingToday: todayOrders.filter((record) => record.order.status === ORDER_STATUSES.PENDING).length,
    preparingToday: todayOrders.filter((record) => record.order.status === ORDER_STATUSES.PREPARING).length,
    readyToday: todayOrders.filter((record) => record.order.status === ORDER_STATUSES.READY).length,
    completedToday: todayOrders.filter((record) => record.order.status === ORDER_STATUSES.COMPLETED).length,
    cancelledToday: todayOrders.filter((record) => record.order.status === ORDER_STATUSES.CANCELLED).length,
    unpaidToday: todayOrders.filter((record) =>
      record.payments.every((payment) => payment.status !== "paid"),
    ).length,
    revenueToday: todayOrders
      .filter((record) => record.order.status === ORDER_STATUSES.COMPLETED)
      .reduce((sum, record) => sum + record.order.totalPence, 0) / 100,
  };
}

export async function listManagedOrders(
  ownerId: string,
  query: OrderListQuery,
): Promise<OrderListResult> {
  const businessId = await getOwnedBusinessId(ownerId);
  const { context } = buildScope(ownerId, businessId, query.branchId);

  const result = await orderService.search(
    {
      branchId: query.branchId,
      status: query.status === "ALL" ? undefined : undefined,
      page: query.page,
      pageSize: query.pageSize,
      query: query.search,
    },
    context,
  );

  return {
    items: result.records.map(mapOrderRecordToManagementRecord),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  };
}

export async function getManagedOrder(
  ownerId: string,
  branchId: string,
  orderId: string,
): Promise<OrderManagementRecord | null> {
  const businessId = await getOwnedBusinessId(ownerId);
  const { context } = buildScope(ownerId, businessId, branchId);
  const record = await orderService.getById(context, orderId);
  return record ? mapOrderRecordToManagementRecord(record) : null;
}

export async function createRestaurantOrderForBusiness(input: {
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
}): Promise<OrderManagementRecord> {
  const scope = buildOrderScopeFromInput({
    businessId: input.businessId,
    branchId: input.branchId,
    userId: input.staffId ?? "system",
  });
  const context = toOmsPlatformContext(scope);
  const items = await mapItemsToCreateInput(input.items);

  const record = await orderService.create(context, {
    ...mapManagementInputToCreate(input.businessId, input as OrderManagementInput, scope),
    source: input.qrSessionId ? ORDER_SOURCES.QR : ORDER_SOURCES.STAFF,
    qrSessionId: input.qrSessionId,
    items,
  });

  return mapOrderRecordToManagementRecord(record);
}

export async function createManagedOrder(
  ownerId: string,
  input: OrderManagementInput,
): Promise<OrderManagementRecord> {
  validateOrderInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
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
  const { context } = buildScope(ownerId, businessId, input.branchId);
  const items = await mapItemsToCreateInput(input.items);

  const record = await orderService.modify(context, {
    orderId,
    items,
    discountAmountPence: Math.round((input.discountAmount ?? 0) * 100),
    serviceChargePence: Math.round((input.serviceCharge ?? 0) * 100),
  });

  if (!record) {
    throw new Error("Order not found");
  }

  return mapOrderRecordToManagementRecord(record);
}

async function transitionManagedOrder(
  ownerId: string,
  branchId: string,
  orderId: string,
  status: (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES],
): Promise<OrderManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const { context } = buildScope(ownerId, businessId, branchId);
  const existing = await orderService.getById(context, orderId);

  if (!existing) {
    throw new Error("Order not found");
  }

  const prismaCurrent = mapDomainStatusToPrisma(existing.order.status);
  const prismaNext = mapDomainStatusToPrisma(status);
  validateOrderStatusTransition(prismaCurrent, prismaNext);

  const record = await orderService.modify(context, { orderId, status });
  if (!record) {
    throw new Error("Unable to update order status");
  }

  return mapOrderRecordToManagementRecord(record);
}

export async function confirmManagedOrder(ownerId: string, branchId: string, orderId: string) {
  return transitionManagedOrder(ownerId, branchId, orderId, ORDER_STATUSES.CONFIRMED);
}

export async function startPreparingManagedOrder(ownerId: string, branchId: string, orderId: string) {
  return transitionManagedOrder(ownerId, branchId, orderId, ORDER_STATUSES.PREPARING);
}

export async function markReadyManagedOrder(ownerId: string, branchId: string, orderId: string) {
  return transitionManagedOrder(ownerId, branchId, orderId, ORDER_STATUSES.READY);
}

export async function markServedManagedOrder(ownerId: string, branchId: string, orderId: string) {
  return transitionManagedOrder(ownerId, branchId, orderId, ORDER_STATUSES.SERVED);
}

export async function completeManagedOrder(ownerId: string, branchId: string, orderId: string) {
  return transitionManagedOrder(ownerId, branchId, orderId, ORDER_STATUSES.COMPLETED);
}

export async function cancelManagedOrder(
  ownerId: string,
  branchId: string,
  orderId: string,
  reason?: string,
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const { context } = buildScope(ownerId, businessId, branchId);
  const record = await orderService.cancel(context, orderId, reason);
  if (!record) {
    throw new Error("Order not found");
  }
  return mapOrderRecordToManagementRecord(record);
}

export async function deleteManagedOrder(ownerId: string, branchId: string, orderId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const { context } = buildScope(ownerId, businessId, branchId);
  const deleted = await orderService.deleteHard(context, orderId);
  if (!deleted) {
    throw new Error("Order not found");
  }
}

export async function applyOrderAdjustments(ownerId: string, input: OrderAdjustmentsInput) {
  const businessId = await getOwnedBusinessId(ownerId);
  const { context } = buildScope(ownerId, businessId, input.branchId);
  const record = await orderService.modify(context, {
    orderId: input.orderId,
    discountAmountPence: Math.round((input.discountAmount ?? 0) * 100),
    serviceChargePence: Math.round((input.serviceCharge ?? 0) * 100),
  });
  if (!record) {
    throw new Error("Order not found");
  }
  return mapOrderRecordToManagementRecord(record);
}

export async function transferOrderTable(ownerId: string, input: TransferOrderTableInput) {
  const businessId = await getOwnedBusinessId(ownerId);
  const { context } = buildScope(ownerId, businessId, input.branchId);
  const record = await orderService.assignTable(context, input.orderId, input.restaurantTableId);
  if (!record) {
    throw new Error("Order not found");
  }
  return mapOrderRecordToManagementRecord(record);
}

export async function splitManagedOrder(ownerId: string, input: SplitOrderInput) {
  const businessId = await getOwnedBusinessId(ownerId);
  const { context } = buildScope(ownerId, businessId, input.branchId);
  const records = await orderService.splitOrder(context, {
    orderId: input.orderId,
    itemIds: input.itemIds,
  });
  const created = records.find((record) => record.order.id !== input.orderId) ?? records[0];
  if (!created) {
    throw new Error("Unable to split order");
  }
  return mapOrderRecordToManagementRecord(created);
}

export async function mergeManagedOrders(ownerId: string, input: MergeOrdersInput) {
  const businessId = await getOwnedBusinessId(ownerId);
  const { context } = buildScope(ownerId, businessId, input.branchId);
  const record = await orderService.mergeOrders(context, {
    targetOrderId: input.targetOrderId,
    sourceOrderIds: input.sourceOrderIds,
  });
  if (!record) {
    throw new Error("Unable to merge orders");
  }
  return mapOrderRecordToManagementRecord(record);
}

export async function listBranchProductsForOrder(
  ownerId: string,
  branchId: string,
): Promise<ProductSelectOption[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  const products = await prisma.product.findMany({
    where: { businessId, status: "ACTIVE" },
    include: {
      modifierGroups: {
        include: {
          modifierGroup: {
            include: {
              options: { where: { status: "ACTIVE" } },
            },
          },
        },
      },
    },
    orderBy: [{ name: "asc" }],
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
    where: { businessId, branchId, status: "AVAILABLE" },
    select: { id: true, tableNumber: true, tableName: true },
    orderBy: [{ tableNumber: "asc" }],
  });

  return tables.map((table) => ({
    id: table.id,
    label: table.tableName ?? String(table.tableNumber),
  }));
}

export async function listBranchStaffForOrderSelect(ownerId: string, branchId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const staff = await prisma.staff.findMany({
    where: { businessId, branchId, isActive: true },
    select: { id: true, fullName: true, firstName: true, lastName: true },
    orderBy: [{ fullName: "asc" }],
  });

  return staff.map((member) => ({
    id: member.id,
    label: member.fullName ?? `${member.firstName} ${member.lastName}`.trim(),
  }));
}

export async function listBranchCustomersForOrderSelect(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const customers = await prisma.customer.findMany({
    where: { businessId },
    select: { id: true, name: true },
    orderBy: [{ name: "asc" }],
    take: 200,
  });

  return customers.map((customer) => ({
    id: customer.id,
    label: customer.name,
  }));
}

export { calculateLineAmounts } from "@/modules/order-management/lib/order-validation";
