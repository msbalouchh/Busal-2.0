import "server-only";

import type { FulfilmentType, OrderStatus } from "@prisma/client";

import { buildOrderScopeFromInput, toOmsPlatformContext } from "@/modules/orders/lib/order-scope";
import { orderService } from "@/modules/orders/services/order.service";
import { createOmsOrderFromSession } from "@/modules/orders/services/pos-oms-bridge.service";

export interface OrderItemData {
  id: string;
  orderId: string;
  menuItemId: string;
  nameSnapshot: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  notes: string | null;
  createdAt: Date;
}

export interface OrderData {
  id: string;
  businessId: string;
  orderSessionId: string;
  orderNumber: string;
  fulfilmentType: FulfilmentType;
  tableId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: OrderStatus;
  items: OrderItemData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ListOrdersFilters {
  status?: OrderStatus;
  branchId?: string | null;
}

function mapRecordToOrderData(record: Awaited<ReturnType<typeof orderService.getById>>): OrderData {
  if (!record) {
    throw new Error("Order not found");
  }

  return {
    id: record.order.id,
    businessId: record.order.businessId,
    orderSessionId: record.order.id,
    orderNumber: record.order.orderNumber,
    fulfilmentType: "DINE_IN",
    tableId: null,
    customerName: record.order.customerName,
    customerPhone: null,
    notes: record.notes?.[0]?.content ?? null,
    subtotal: record.order.subtotalPence / 100,
    discount: record.order.discountTotalPence / 100,
    tax: record.order.taxTotalPence / 100,
    total: record.order.totalPence / 100,
    status: record.order.status.toUpperCase() as OrderStatus,
    items: record.items.map((item) => ({
      id: item.id,
      orderId: record.order.id,
      menuItemId: item.productId,
      nameSnapshot: item.productName,
      unitPrice: item.unitPricePence / 100,
      quantity: item.quantity,
      totalPrice: item.lineTotalPence / 100,
      notes: item.notes,
      createdAt: new Date(record.order.createdAt),
    })),
    createdAt: new Date(record.order.createdAt),
    updatedAt: new Date(record.order.updatedAt),
  };
}

function buildContext(businessId: string, branchId: string) {
  const scope = buildOrderScopeFromInput({ businessId, branchId, userId: "system" });
  return toOmsPlatformContext(scope);
}

/** @deprecated Use OMS `orderService.create` via POS bridge. */
export async function createOrderFromSession(
  orderSessionId: string,
  branchId: string | null = null,
): Promise<OrderData> {
  return createOmsOrderFromSession(orderSessionId, branchId);
}

/** @deprecated Use OMS `orderService.getById`. */
export async function getOrder(orderId: string, businessId?: string, branchId?: string): Promise<OrderData> {
  if (!businessId || !branchId) {
    throw new Error("Business and branch context required");
  }

  const record = await orderService.getById(buildContext(businessId, branchId), orderId);
  return mapRecordToOrderData(record);
}

/** @deprecated Use OMS `orderService.search`. */
export async function listOrders(
  businessId: string,
  filters: ListOrdersFilters = {},
): Promise<OrderData[]> {
  if (!filters.branchId) {
    throw new Error("Branch context required");
  }

  const context = buildContext(businessId, filters.branchId);
  const result = await orderService.search({ branchId: filters.branchId }, context);
  return result.records.map((record) => mapRecordToOrderData(record));
}

/** @deprecated Use OMS `orderService.cancel`. */
export async function cancelOrder(
  orderId: string,
  businessId?: string,
  branchId?: string,
): Promise<OrderData> {
  if (!businessId || !branchId) {
    throw new Error("Business and branch context required");
  }

  const context = buildContext(businessId, branchId);
  const record = await orderService.cancel(context, orderId);
  return mapRecordToOrderData(record);
}
