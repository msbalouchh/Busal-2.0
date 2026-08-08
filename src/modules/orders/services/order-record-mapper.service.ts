import "server-only";

import type {
  OrderType as PrismaOrderType,
  PaymentMethod,
  RestaurantOrderPaymentStatus,
  RestaurantOrderStatus,
} from "@prisma/client";

import {
  mapDomainOrderTypeToPrisma,
  mapDomainStatusToPrisma,
  mapPrismaOrderTypeToDomain,
  mapPrismaStatusToDomain,
  penceToDecimal,
} from "@/modules/orders/lib/order-mappers";
import { ORDER_STATUSES } from "@/modules/orders/constants/order-status";
import type { OrderRecord } from "@/modules/orders/types/order";
import type {
  OrderItemRecord,
  OrderManagementRecord,
} from "@/modules/order-management/types/order-management-types";

function mapDomainPaymentToPrisma(
  payments: OrderRecord["payments"],
): RestaurantOrderPaymentStatus {
  if (payments.some((payment) => payment.status === "refunded")) {
    return "REFUNDED";
  }
  if (payments.some((payment) => payment.status === "paid")) {
    return "PAID";
  }
  if (payments.some((payment) => payment.status === "partial")) {
    return "PARTIALLY_PAID";
  }
  return "UNPAID";
}

function mapItemRecord(item: OrderRecord["items"][number]): OrderItemRecord {
  return {
    id: item.id,
    productId: item.productId,
    productNameSnapshot: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPricePence / 100,
    discountAmount: 0,
    taxAmount: 0,
    totalAmount: item.lineTotalPence / 100,
    specialInstructions: item.notes,
    status: "PENDING",
    modifiers: item.modifiers.map((modifier, index) => ({
      id: `${item.id}-modifier-${index}`,
      modifierOptionId: modifier,
      nameSnapshot: modifier,
      priceAdjustment: 0,
    })),
  };
}

export function mapOrderRecordToManagementRecord(record: OrderRecord): OrderManagementRecord {
  const prismaStatus = mapDomainStatusToPrisma(record.order.status);
  const paymentStatus = mapDomainPaymentToPrisma(record.payments);

  return {
    id: record.order.id,
    businessId: record.order.businessId,
    branchId: record.order.branchId,
    orderNumber: record.order.orderNumber,
    orderType: mapDomainOrderTypeToPrisma(record.order.orderType) as PrismaOrderType,
    customerId: record.order.customerId,
    customerName: record.order.customerName,
    restaurantTableId: null,
    tableLabel: record.order.tableNumber,
    reservationId: null,
    reservationNumber: null,
    staffId: null,
    staffName: null,
    status: prismaStatus as RestaurantOrderStatus,
    subtotal: record.order.subtotalPence / 100,
    discountAmount: record.order.discountTotalPence / 100,
    taxAmount: record.order.taxTotalPence / 100,
    serviceCharge: 0,
    deliveryCharge: 0,
    tipAmount: 0,
    totalAmount: record.order.totalPence / 100,
    paymentStatus,
    paymentMethod: null as PaymentMethod | null,
    notes: record.notes?.[0]?.content ?? null,
    placedAt: record.order.createdAt,
    completedAt: record.order.completedAt,
    cancelledAt: record.order.status === ORDER_STATUSES.CANCELLED ? record.order.updatedAt : null,
    items: record.items.map(mapItemRecord),
    createdAt: record.order.createdAt,
    updatedAt: record.order.updatedAt,
  };
}

export function mapManagementOrderTypeToDomain(orderType: PrismaOrderType) {
  return mapPrismaOrderTypeToDomain(orderType, null);
}

export { mapDomainOrderTypeToPrisma, mapDomainStatusToPrisma, penceToDecimal };
