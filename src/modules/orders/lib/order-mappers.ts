import {
  Prisma,
  type OrderPayment as PrismaOrderPayment,
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderType as PrismaOrderType,
  RestaurantOrder,
  RestaurantOrderItem,
  RestaurantOrderItemModifier,
  RestaurantOrderPaymentStatus,
  RestaurantOrderStatus,
} from "@prisma/client";

import {
  FULFILLMENT_STATUSES,
  ORDER_SOURCES,
  ORDER_STATUSES,
  ORDER_TIMELINE_EVENT_TYPES,
  ORDER_TYPES,
  PAYMENT_STATUSES,
  type FulfillmentStatus,
  type OrderSource,
  type OrderStatus,
  type OrderTimelineEventType,
  type OrderType,
  type PaymentStatus,
} from "@/modules/orders/constants/order-status";
import type { OrderTenantScope } from "@/modules/orders/lib/order-scope";
import type {
  OrderAiContext,
  OrderAnalytics,
  OrderDiscount,
  OrderFulfillment,
  OrderHistoryEntry,
  OrderItem,
  OrderNote,
  OrderPayment,
  OrderRecord,
  OrderSourceRecord,
  OrderTax,
  OrderTimelineEvent,
} from "@/modules/orders/types/order";

export const ORDER_META_DELIMITER = "\n---BUSAL_ORDER_META---\n";

export interface StoredOrderMeta {
  archived?: boolean;
  archivedAt?: string;
  domainStatus?: OrderStatus;
  source?: OrderSource;
  scheduledFor?: string | null;
  discounts?: OrderDiscount[];
  taxes?: OrderTax[];
  notes?: OrderNote[];
  timeline?: OrderTimelineEvent[];
  history?: OrderHistoryEntry[];
  transferHistory?: Array<{ branchId: string; transferredAt: string }>;
}

export type RestaurantOrderWithRelations = Prisma.RestaurantOrderGetPayload<{
  include: {
    items: { include: { modifiers: true } };
    payments: true;
    customer: { select: { id: true; firstName: true; lastName: true } };
    restaurantTable: { select: { id: true; tableNumber: true; tableName: true } };
    staff: { select: { id: true; firstName: true; lastName: true } };
  };
}>;

export function decimalToPence(value: Prisma.Decimal | number): number {
  return Math.round(Number(value) * 100);
}

export function penceToDecimal(pence: number): Prisma.Decimal {
  return new Prisma.Decimal(pence / 100);
}

export function splitOrderNotes(raw: string | null): {
  guestNotes: string | null;
  meta: StoredOrderMeta;
} {
  if (!raw) {
    return { guestNotes: null, meta: {} };
  }

  const delimiterIndex = raw.indexOf(ORDER_META_DELIMITER);
  if (delimiterIndex === -1) {
    return { guestNotes: raw, meta: {} };
  }

  const guestNotes = raw.slice(0, delimiterIndex).trim() || null;
  const metaRaw = raw.slice(delimiterIndex + ORDER_META_DELIMITER.length).trim();

  try {
    return { guestNotes, meta: JSON.parse(metaRaw) as StoredOrderMeta };
  } catch {
    return { guestNotes: raw, meta: {} };
  }
}

export function composeOrderNotes(guestNotes: string | null, meta: StoredOrderMeta): string | null {
  const hasMeta =
    meta.archived ||
    meta.domainStatus ||
    meta.source ||
    meta.scheduledFor ||
    (meta.discounts?.length ?? 0) > 0 ||
    (meta.taxes?.length ?? 0) > 0 ||
    (meta.notes?.length ?? 0) > 0 ||
    (meta.timeline?.length ?? 0) > 0 ||
    (meta.history?.length ?? 0) > 0;

  if (!guestNotes && !hasMeta) {
    return null;
  }

  if (!hasMeta) {
    return guestNotes;
  }

  return `${guestNotes ?? ""}${ORDER_META_DELIMITER}${JSON.stringify(meta)}`;
}

export function mapPrismaOrderTypeToDomain(type: PrismaOrderType, qrSessionId: string | null): OrderType {
  if (qrSessionId) {
    return ORDER_TYPES.QR_ORDERING;
  }

  switch (type) {
    case "DINE_IN":
      return ORDER_TYPES.DINE_IN;
    case "TAKEAWAY":
      return ORDER_TYPES.TAKEAWAY;
    case "DELIVERY":
      return ORDER_TYPES.DELIVERY;
    default:
      return ORDER_TYPES.DINE_IN;
  }
}

export function mapDomainOrderTypeToPrisma(type: OrderType): PrismaOrderType {
  switch (type) {
    case ORDER_TYPES.TAKEAWAY:
      return "TAKEAWAY";
    case ORDER_TYPES.DELIVERY:
    case ORDER_TYPES.FUTURE:
      return "DELIVERY";
    case ORDER_TYPES.QR_ORDERING:
    case ORDER_TYPES.DINE_IN:
    case ORDER_TYPES.PHONE:
    default:
      return "DINE_IN";
  }
}

export function mapPrismaStatusToDomain(
  status: RestaurantOrderStatus,
  paymentStatus: RestaurantOrderPaymentStatus,
  meta: StoredOrderMeta,
): OrderStatus {
  if (meta.domainStatus) {
    return meta.domainStatus;
  }

  if (paymentStatus === "REFUNDED") {
    return ORDER_STATUSES.REFUNDED;
  }

  switch (status) {
    case "PENDING":
      return ORDER_STATUSES.PENDING;
    case "CONFIRMED":
      return ORDER_STATUSES.CONFIRMED;
    case "PREPARING":
      return ORDER_STATUSES.PREPARING;
    case "READY":
      return ORDER_STATUSES.READY;
    case "SERVED":
      return ORDER_STATUSES.SERVED;
    case "COMPLETED":
      return ORDER_STATUSES.COMPLETED;
    case "CANCELLED":
      return ORDER_STATUSES.CANCELLED;
    default:
      return ORDER_STATUSES.PENDING;
  }
}

export function mapDomainStatusToPrisma(status: OrderStatus): RestaurantOrderStatus {
  switch (status) {
    case ORDER_STATUSES.CONFIRMED:
      return "CONFIRMED";
    case ORDER_STATUSES.PREPARING:
      return "PREPARING";
    case ORDER_STATUSES.READY:
      return "READY";
    case ORDER_STATUSES.SERVED:
      return "SERVED";
    case ORDER_STATUSES.COMPLETED:
    case ORDER_STATUSES.REFUNDED:
      return "COMPLETED";
    case ORDER_STATUSES.CANCELLED:
      return "CANCELLED";
    case ORDER_STATUSES.DRAFT:
    case ORDER_STATUSES.PENDING:
    case ORDER_STATUSES.OUT_FOR_DELIVERY:
    default:
      return "PENDING";
  }
}

function mapPaymentMethod(method: OrderPaymentMethod): OrderPayment["method"] {
  switch (method) {
    case "CASH":
      return "cash";
    case "CARD":
    case "CONTACTLESS":
    case "APPLE_PAY":
    case "GOOGLE_PAY":
      return "card";
    case "GIFT_CARD":
    case "STORE_CREDIT":
      return "gift_card";
    default:
      return "wallet";
  }
}

function mapPaymentStatus(status: OrderPaymentStatus): PaymentStatus {
  switch (status) {
    case "PAID":
      return PAYMENT_STATUSES.PAID;
    case "PARTIALLY_PAID":
      return PAYMENT_STATUSES.PARTIAL;
    case "REFUNDED":
      return PAYMENT_STATUSES.REFUNDED;
    case "FAILED":
      return PAYMENT_STATUSES.FAILED;
    case "PENDING":
    case "VOIDED":
    default:
      return PAYMENT_STATUSES.UNPAID;
  }
}

function mapPrismaPaymentToDomain(payment: PrismaOrderPayment): OrderPayment {
  return {
    id: payment.id,
    orderId: payment.orderId,
    method: mapPaymentMethod(payment.paymentMethod),
    status: mapPaymentStatus(payment.status),
    amountPence: decimalToPence(payment.amountPaid),
    reference: payment.transactionReference ?? payment.gatewayReference ?? null,
    processedAt: payment.paidAt?.toISOString() ?? null,
  };
}

function mapItemToDomain(item: RestaurantOrderItem & { modifiers: RestaurantOrderItemModifier[] }): OrderItem {
  return {
    id: item.id,
    orderId: item.orderId,
    productId: item.productId,
    productName: item.productNameSnapshot,
    sku: null,
    quantity: item.quantity,
    unitPricePence: decimalToPence(item.unitPrice),
    lineTotalPence: decimalToPence(item.totalAmount),
    modifiers: item.modifiers.map((modifier) => modifier.nameSnapshot),
    notes: item.specialInstructions,
  };
}

function buildFulfillment(order: RestaurantOrder, domainStatus: OrderStatus): OrderFulfillment {
  let status: FulfillmentStatus = FULFILLMENT_STATUSES.QUEUED;

  if (domainStatus === ORDER_STATUSES.PREPARING) {
    status = FULFILLMENT_STATUSES.IN_PROGRESS;
  } else if (domainStatus === ORDER_STATUSES.READY || domainStatus === ORDER_STATUSES.SERVED) {
    status = FULFILLMENT_STATUSES.READY;
  } else if (domainStatus === ORDER_STATUSES.OUT_FOR_DELIVERY) {
    status = FULFILLMENT_STATUSES.DISPATCHED;
  } else if (domainStatus === ORDER_STATUSES.COMPLETED) {
    status = FULFILLMENT_STATUSES.DELIVERED;
  }

  return {
    orderId: order.id,
    status,
    assignedTo: order.staffId,
    stationId: null,
    estimatedReadyAt: order.kitchenReadyAt?.toISOString() ?? null,
    dispatchedAt: order.kitchenReadyAt?.toISOString() ?? null,
    deliveredAt: order.completedAt?.toISOString() ?? null,
    deliveryAddress: null,
    trackingReference: null,
  };
}

function buildAnalytics(order: RestaurantOrderWithRelations, domainStatus: OrderStatus): OrderAnalytics {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const prepStart = order.kitchenPreparingAt ?? order.kitchenAcceptedAt;
  const prepEnd = order.kitchenReadyAt ?? order.completedAt;
  const prepTimeMinutes =
    prepStart && prepEnd ? Math.max(1, Math.round((prepEnd.getTime() - prepStart.getTime()) / 60000)) : null;

  return {
    orderId: order.id,
    itemCount,
    prepTimeMinutes,
    fulfillmentTimeMinutes: prepTimeMinutes,
    marginEstimatePence: Math.round(decimalToPence(order.subtotal) * 0.6),
    upsellPotentialPence: itemCount < 3 ? 650 : 250,
    delayRiskScore: domainStatus === ORDER_STATUSES.PREPARING && itemCount > 6 ? 0.45 : 0.15,
  };
}

function buildAiContext(order: RestaurantOrderWithRelations, analytics: OrderAnalytics): OrderAiContext {
  return {
    orderId: order.id,
    summary: `${order.orderNumber} · ${mapPrismaOrderTypeToDomain(order.orderType, order.qrSessionId).replace("_", " ")}`,
    insights: [
      analytics.delayRiskScore > 0.3 ? "Elevated delay risk" : "Normal kitchen load",
      `Items: ${analytics.itemCount}`,
    ],
    recommendedActions:
      order.paymentStatus === "UNPAID" ? ["Collect payment before serve"] : ["Monitor kitchen progress"],
    upsellSuggestions: analytics.upsellPotentialPence > 500 ? ["Side dish", "Beverage upgrade"] : [],
    delayPredictionMinutes: analytics.delayRiskScore > 0.4 ? 12 : null,
    lastGeneratedAt: new Date().toISOString(),
  };
}

function buildDefaultTimeline(
  order: RestaurantOrder,
  meta: StoredOrderMeta,
  actorId: string | null,
): OrderTimelineEvent[] {
  if (meta.timeline?.length) {
    return meta.timeline;
  }

  return [
    {
      id: `${order.id}-created`,
      orderId: order.id,
      type: ORDER_TIMELINE_EVENT_TYPES.CREATED,
      title: "Order created",
      description: "Order submitted to OMS",
      fromStatus: null,
      toStatus: ORDER_STATUSES.PENDING,
      metadata: {},
      occurredAt: order.placedAt.toISOString(),
      createdBy: actorId,
    },
  ];
}

export function mapTimelineTypeForStatus(status: OrderStatus): OrderTimelineEventType {
  switch (status) {
    case ORDER_STATUSES.CANCELLED:
      return ORDER_TIMELINE_EVENT_TYPES.CANCELLED;
    case ORDER_STATUSES.REFUNDED:
      return ORDER_TIMELINE_EVENT_TYPES.REFUNDED;
    case ORDER_STATUSES.COMPLETED:
      return ORDER_TIMELINE_EVENT_TYPES.STATUS_CHANGED;
    default:
      return ORDER_TIMELINE_EVENT_TYPES.STATUS_CHANGED;
  }
}

export function appendTimelineEvent(
  meta: StoredOrderMeta,
  event: Omit<OrderTimelineEvent, "id"> & { id?: string },
): StoredOrderMeta {
  const timeline = meta.timeline ?? [];
  return {
    ...meta,
    timeline: [
      {
        id: event.id ?? `${event.orderId}-${event.type}-${Date.now()}`,
        orderId: event.orderId,
        type: event.type,
        title: event.title,
        description: event.description,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        metadata: event.metadata,
        occurredAt: event.occurredAt,
        createdBy: event.createdBy,
      },
      ...timeline,
    ],
  };
}

export function mapOrderToRecord(order: RestaurantOrderWithRelations, scope: OrderTenantScope): OrderRecord {
  const { guestNotes, meta } = splitOrderNotes(order.notes);
  const domainStatus = mapPrismaStatusToDomain(order.status, order.paymentStatus, meta);
  const customerName = order.customer
    ? `${order.customer.firstName} ${order.customer.lastName}`.trim()
    : null;
  const tableNumber = order.restaurantTable
    ? String(order.restaurantTable.tableNumber ?? order.restaurantTable.tableName)
    : null;

  const discounts: OrderDiscount[] =
    meta.discounts ??
    (decimalToPence(order.discountAmount) > 0
      ? [
          {
            id: `${order.id}-discount`,
            orderId: order.id,
            code: null,
            label: "Order discount",
            type: "fixed",
            value: decimalToPence(order.discountAmount),
            amountPence: decimalToPence(order.discountAmount),
          },
        ]
      : []);

  const taxes: OrderTax[] =
    meta.taxes ??
    (decimalToPence(order.taxAmount) > 0
      ? [
          {
            id: `${order.id}-tax`,
            orderId: order.id,
            name: "VAT",
            rate: 20,
            amountPence: decimalToPence(order.taxAmount),
          },
        ]
      : []);

  const analytics = buildAnalytics(order, domainStatus);

  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      businessId: order.businessId,
      branchId: order.branchId,
      customerId: order.customerId,
      customerName,
      orderType: mapPrismaOrderTypeToDomain(order.orderType, order.qrSessionId),
      status: domainStatus,
      currency: "GBP",
      subtotalPence: decimalToPence(order.subtotal),
      discountTotalPence: decimalToPence(order.discountAmount),
      taxTotalPence: decimalToPence(order.taxAmount),
      totalPence: decimalToPence(order.totalAmount),
      tableNumber,
      scheduledFor: meta.scheduledFor ?? null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      completedAt: order.completedAt?.toISOString() ?? null,
    },
    items: order.items.map(mapItemToDomain),
    timeline: buildDefaultTimeline(order, meta, order.staffId),
    payments: order.payments.map(mapPrismaPaymentToDomain),
    discounts,
    taxes,
    notes: meta.notes ?? (guestNotes ? [{ id: `${order.id}-guest-note`, orderId: order.id, content: guestNotes, isInternal: false, createdBy: "guest", createdAt: order.createdAt.toISOString() }] : []),
    source: {
      orderId: order.id,
      source: meta.source ?? ORDER_SOURCES.POS,
      channel: mapPrismaOrderTypeToDomain(order.orderType, order.qrSessionId),
      deviceId: order.qrSessionId,
      staffId: order.staffId,
      referrer: null,
    },
    fulfillment: buildFulfillment(order, domainStatus),
    history: meta.history ?? [],
    analytics,
    aiContext: buildAiContext(order, analytics),
  };
}

export function mapDomainSourceToChannel(source: OrderSource): OrderSource {
  return source;
}
