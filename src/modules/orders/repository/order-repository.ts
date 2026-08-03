import {
  FULFILLMENT_STATUSES,
  ORDER_STATUSES,
  ORDER_STATUS_TRANSITIONS,
  ORDER_TIMELINE_EVENT_TYPES,
  PAYMENT_STATUSES,
} from "@/modules/orders/constants/order-status";
import { DEFAULT_OMS_SCOPE, MOCK_ORDER_RECORDS } from "@/modules/orders/constants/mock-data";
import type {
  CreateOrderInput,
  ModifyOrderInput,
  OrderRecord,
  OrderSearchQuery,
} from "@/modules/orders/types/order";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function computeTotals(items: CreateOrderInput["items"]) {
  const subtotalPence = items.reduce((sum, item) => sum + item.quantity * item.unitPricePence, 0);
  const taxPence = Math.round(subtotalPence * 0.2);
  return { subtotalPence, taxPence, totalPence: subtotalPence + taxPence };
}

/** In-memory order repository (mock only, no backend). */
export class OrderRepository {
  private records: OrderRecord[] = [...MOCK_ORDER_RECORDS];

  list(): OrderRecord[] {
    return [...this.records];
  }

  findById(orderId: string): OrderRecord | undefined {
    return this.records.find((record) => record.order.id === orderId);
  }

  findByOrderNumber(orderNumber: string): OrderRecord | undefined {
    return this.records.find((record) => record.order.orderNumber === orderNumber);
  }

  search(query: OrderSearchQuery = {}): OrderRecord[] {
    let results = this.records;

    if (query.tenantId) {
      results = results.filter((record) => record.order.tenantId === query.tenantId);
    }

    if (query.businessId) {
      results = results.filter((record) => record.order.businessId === query.businessId);
    }

    if (query.branchId) {
      results = results.filter((record) => record.order.branchId === query.branchId);
    }

    if (query.status) {
      results = results.filter((record) => record.order.status === query.status);
    }

    if (query.orderType) {
      results = results.filter((record) => record.order.orderType === query.orderType);
    }

    if (query.customerId) {
      results = results.filter((record) => record.order.customerId === query.customerId);
    }

    if (query.query) {
      const normalized = query.query.toLowerCase();

      results = results.filter((record) => {
        const haystack = [
          record.order.orderNumber,
          record.order.customerName ?? "",
          ...record.items.map((item) => item.productName),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalized);
      });
    }

    const limit = query.limit ?? results.length;
    return results.slice(0, limit);
  }

  create(input: CreateOrderInput): OrderRecord {
    const id = createId("ord");
    const orderNumber = `HBR-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const { subtotalPence, taxPence, totalPence } = computeTotals(input.items);

    const record: OrderRecord = {
      order: {
        id,
        orderNumber,
        tenantId: input.tenantId,
        workspaceId: input.workspaceId,
        businessId: input.businessId,
        branchId: input.branchId,
        customerId: input.customerId ?? null,
        customerName: input.customerName ?? null,
        orderType: input.orderType,
        status: ORDER_STATUSES.PENDING,
        currency: "GBP",
        subtotalPence,
        discountTotalPence: 0,
        taxTotalPence: taxPence,
        totalPence,
        tableNumber: input.tableNumber ?? null,
        scheduledFor: input.scheduledFor ?? null,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
      },
      items: input.items.map((item, index) => ({
        id: `${id}-item-${index + 1}`,
        orderId: id,
        productId: item.productId,
        productName: item.productName,
        sku: null,
        quantity: item.quantity,
        unitPricePence: item.unitPricePence,
        lineTotalPence: item.quantity * item.unitPricePence,
        modifiers: item.modifiers ?? [],
        notes: item.notes ?? null,
      })),
      timeline: [
        {
          id: createId("tl"),
          orderId: id,
          type: ORDER_TIMELINE_EVENT_TYPES.CREATED,
          title: "Order created",
          description: "New order submitted",
          fromStatus: null,
          toStatus: ORDER_STATUSES.PENDING,
          metadata: { source: input.source },
          occurredAt: now,
          createdBy: DEFAULT_OMS_SCOPE.userId,
        },
      ],
      payments: [],
      discounts: [],
      taxes: [
        {
          id: createId("tax"),
          orderId: id,
          name: "VAT",
          rate: 20,
          amountPence: taxPence,
        },
      ],
      notes: [],
      source: {
        orderId: id,
        source: input.source,
        channel: input.orderType,
        deviceId: null,
        staffId: DEFAULT_OMS_SCOPE.userId,
        referrer: null,
      },
      fulfillment: {
        orderId: id,
        status: FULFILLMENT_STATUSES.QUEUED,
        assignedTo: null,
        stationId: "kitchen-main",
        estimatedReadyAt: null,
        dispatchedAt: null,
        deliveredAt: null,
        deliveryAddress: null,
        trackingReference: null,
      },
      history: [
        {
          id: createId("hist"),
          orderId: id,
          action: "order.created",
          snapshot: { status: ORDER_STATUSES.PENDING },
          performedBy: DEFAULT_OMS_SCOPE.userId,
          performedAt: now,
        },
      ],
      analytics: {
        orderId: id,
        itemCount: input.items.reduce((sum, item) => sum + item.quantity, 0),
        prepTimeMinutes: null,
        fulfillmentTimeMinutes: null,
        marginEstimatePence: Math.round(subtotalPence * 0.6),
        upsellPotentialPence: 650,
        delayRiskScore: 0.1,
      },
      aiContext: {
        orderId: id,
        summary: `${orderNumber} — new ${input.orderType.replace("_", " ")} order`,
        insights: ["Order just created — confirm kitchen queue"],
        recommendedActions: ["Send confirmation to customer"],
        upsellSuggestions: ["Side dish", "Beverage upgrade"],
        delayPredictionMinutes: null,
        lastGeneratedAt: now,
      },
    };

    this.records.unshift(record);
    return record;
  }

  modify(input: ModifyOrderInput): OrderRecord | undefined {
    const record = this.findById(input.orderId);

    if (!record) {
      return undefined;
    }

    const now = new Date().toISOString();

    if (input.status && input.status !== record.order.status) {
      const allowed = ORDER_STATUS_TRANSITIONS[record.order.status];

      if (!allowed.includes(input.status)) {
        return undefined;
      }

      record.timeline.unshift({
        id: createId("tl"),
        orderId: record.order.id,
        type: ORDER_TIMELINE_EVENT_TYPES.STATUS_CHANGED,
        title: "Status updated",
        description: `Order moved to ${input.status.replace("_", " ")}`,
        fromStatus: record.order.status,
        toStatus: input.status,
        metadata: {},
        occurredAt: now,
        createdBy: DEFAULT_OMS_SCOPE.userId,
      });

      record.order.status = input.status;
      record.order.completedAt =
        input.status === ORDER_STATUSES.COMPLETED ? now : record.order.completedAt;
    }

    if (input.tableNumber !== undefined) {
      record.order.tableNumber = input.tableNumber;
    }

    if (input.scheduledFor !== undefined) {
      record.order.scheduledFor = input.scheduledFor;
    }

    if (input.items) {
      const { subtotalPence, taxPence, totalPence } = computeTotals(input.items);

      record.items = input.items.map((item, index) => ({
        id: `${record.order.id}-item-${index + 1}`,
        orderId: record.order.id,
        productId: item.productId,
        productName: item.productName,
        sku: null,
        quantity: item.quantity,
        unitPricePence: item.unitPricePence,
        lineTotalPence: item.quantity * item.unitPricePence,
        modifiers: item.modifiers ?? [],
        notes: item.notes ?? null,
      }));

      record.order.subtotalPence = subtotalPence;
      record.order.taxTotalPence = taxPence;
      record.order.totalPence = totalPence - record.order.discountTotalPence;
      record.analytics.itemCount = input.items.reduce((sum, item) => sum + item.quantity, 0);

      record.timeline.unshift({
        id: createId("tl"),
        orderId: record.order.id,
        type: ORDER_TIMELINE_EVENT_TYPES.ITEM_MODIFIED,
        title: "Items updated",
        description: "Order line items were modified",
        fromStatus: null,
        toStatus: null,
        metadata: { itemCount: String(record.analytics.itemCount) },
        occurredAt: now,
        createdBy: DEFAULT_OMS_SCOPE.userId,
      });
    }

    if (input.note) {
      record.notes.unshift({
        id: createId("note"),
        orderId: record.order.id,
        content: input.note,
        isInternal: true,
        createdBy: DEFAULT_OMS_SCOPE.userId,
        createdAt: now,
      });
    }

    record.order.updatedAt = now;
    record.history.unshift({
      id: createId("hist"),
      orderId: record.order.id,
      action: "order.modified",
      snapshot: { status: record.order.status },
      performedBy: DEFAULT_OMS_SCOPE.userId,
      performedAt: now,
    });

    return record;
  }

  cancel(orderId: string, reason?: string): OrderRecord | undefined {
    const record = this.modify({ orderId, status: ORDER_STATUSES.CANCELLED });

    if (!record) {
      return undefined;
    }

    const now = new Date().toISOString();

    record.timeline.unshift({
      id: createId("tl"),
      orderId,
      type: ORDER_TIMELINE_EVENT_TYPES.CANCELLED,
      title: "Order cancelled",
      description: reason ?? "Order cancelled by request",
      fromStatus: record.order.status,
      toStatus: ORDER_STATUSES.CANCELLED,
      metadata: reason ? { reason } : {},
      occurredAt: now,
      createdBy: DEFAULT_OMS_SCOPE.userId,
    });

    return record;
  }

  refund(orderId: string): OrderRecord | undefined {
    const record = this.findById(orderId);

    if (!record || record.order.status !== ORDER_STATUSES.COMPLETED) {
      return undefined;
    }

    const now = new Date().toISOString();
    record.order.status = ORDER_STATUSES.REFUNDED;
    record.order.updatedAt = now;

    record.payments.push({
      id: createId("pay"),
      orderId,
      method: "card",
      status: PAYMENT_STATUSES.REFUNDED,
      amountPence: record.order.totalPence,
      reference: "refund_mock",
      processedAt: now,
    });

    record.timeline.unshift({
      id: createId("tl"),
      orderId,
      type: ORDER_TIMELINE_EVENT_TYPES.REFUNDED,
      title: "Order refunded",
      description: "Full refund processed",
      fromStatus: ORDER_STATUSES.COMPLETED,
      toStatus: ORDER_STATUSES.REFUNDED,
      metadata: {},
      occurredAt: now,
      createdBy: DEFAULT_OMS_SCOPE.userId,
    });

    return record;
  }
}

export const orderRepository = new OrderRepository();
