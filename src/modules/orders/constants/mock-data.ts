import {
  FULFILLMENT_STATUSES,
  ORDER_SOURCES,
  ORDER_STATUSES,
  ORDER_TIMELINE_EVENT_TYPES,
  ORDER_TYPES,
  PAYMENT_STATUSES,
} from "@/modules/orders/constants/order-status";
import type { OrderRecord } from "@/modules/orders/types/order";

export const DEFAULT_OMS_SCOPE = {
  tenantId: "tenant-harbour",
  workspaceId: "ws-harbour-kitchen",
  businessId: "biz-harbour-kitchen",
  branchId: "branch-harbour-main",
  userId: "user-harbour-owner",
} as const;

function buildOrderRecord(partial: {
  id: string;
  orderNumber: string;
  orderType: (typeof ORDER_TYPES)[keyof typeof ORDER_TYPES];
  status: (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];
  customerName: string | null;
  customerId?: string | null;
  tableNumber?: string | null;
  scheduledFor?: string | null;
  source: (typeof ORDER_SOURCES)[keyof typeof ORDER_SOURCES];
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPricePence: number;
  }>;
  subtotalPence: number;
  discountPence?: number;
  taxPence: number;
  prepTimeMinutes?: number | null;
  delayRiskScore?: number;
}): OrderRecord {
  const now = "2026-02-15T18:30:00.000Z";
  const discountPence = partial.discountPence ?? 0;
  const totalPence = partial.subtotalPence - discountPence + partial.taxPence;

  const orderItems = partial.items.map((item, index) => ({
    id: `${partial.id}-item-${index + 1}`,
    orderId: partial.id,
    productId: item.productId,
    productName: item.productName,
    sku: null,
    quantity: item.quantity,
    unitPricePence: item.unitPricePence,
    lineTotalPence: item.quantity * item.unitPricePence,
    modifiers: [],
    notes: null,
  }));

  return {
    order: {
      id: partial.id,
      orderNumber: partial.orderNumber,
      tenantId: DEFAULT_OMS_SCOPE.tenantId,
      workspaceId: DEFAULT_OMS_SCOPE.workspaceId,
      businessId: DEFAULT_OMS_SCOPE.businessId,
      branchId: DEFAULT_OMS_SCOPE.branchId,
      customerId: partial.customerId ?? null,
      customerName: partial.customerName,
      orderType: partial.orderType,
      status: partial.status,
      currency: "GBP",
      subtotalPence: partial.subtotalPence,
      discountTotalPence: discountPence,
      taxTotalPence: partial.taxPence,
      totalPence,
      tableNumber: partial.tableNumber ?? null,
      scheduledFor: partial.scheduledFor ?? null,
      createdAt: "2026-02-15T18:00:00.000Z",
      updatedAt: now,
      completedAt: partial.status === ORDER_STATUSES.COMPLETED ? now : null,
    },
    items: orderItems,
    timeline: [
      {
        id: `${partial.id}-tl-1`,
        orderId: partial.id,
        type: ORDER_TIMELINE_EVENT_TYPES.CREATED,
        title: "Order created",
        description: `${partial.orderType.replace("_", " ")} order received`,
        fromStatus: null,
        toStatus: ORDER_STATUSES.PENDING,
        metadata: { source: partial.source },
        occurredAt: "2026-02-15T18:00:00.000Z",
        createdBy: "system",
      },
      {
        id: `${partial.id}-tl-2`,
        orderId: partial.id,
        type: ORDER_TIMELINE_EVENT_TYPES.STATUS_CHANGED,
        title: "Status updated",
        description: `Order moved to ${partial.status.replace("_", " ")}`,
        fromStatus: ORDER_STATUSES.PENDING,
        toStatus: partial.status,
        metadata: {},
        occurredAt: now,
        createdBy: "staff-kitchen-1",
      },
    ],
    payments:
      partial.status === ORDER_STATUSES.COMPLETED
        ? [
            {
              id: `${partial.id}-pay-1`,
              orderId: partial.id,
              method: "card" as const,
              status: PAYMENT_STATUSES.PAID,
              amountPence: totalPence,
              reference: "pi_mock_001",
              processedAt: now,
            },
          ]
        : [],
    discounts:
      discountPence > 0
        ? [
            {
              id: `${partial.id}-disc-1`,
              orderId: partial.id,
              code: "WELCOME10",
              label: "Welcome 10%",
              type: "percentage" as const,
              value: 10,
              amountPence: discountPence,
            },
          ]
        : [],
    taxes: [
      {
        id: `${partial.id}-tax-1`,
        orderId: partial.id,
        name: "VAT",
        rate: 20,
        amountPence: partial.taxPence,
      },
    ],
    notes: [],
    source: {
      orderId: partial.id,
      source: partial.source,
      channel: partial.orderType,
      deviceId: partial.source === ORDER_SOURCES.QR ? "qr-table-12" : null,
      staffId: partial.source === ORDER_SOURCES.STAFF ? "staff-pos-1" : null,
      referrer: null,
    },
    fulfillment: {
      orderId: partial.id,
      status:
        partial.status === ORDER_STATUSES.OUT_FOR_DELIVERY
          ? FULFILLMENT_STATUSES.DISPATCHED
          : partial.status === ORDER_STATUSES.READY
            ? FULFILLMENT_STATUSES.READY
            : partial.status === ORDER_STATUSES.PREPARING
              ? FULFILLMENT_STATUSES.IN_PROGRESS
              : FULFILLMENT_STATUSES.QUEUED,
      assignedTo: partial.status === ORDER_STATUSES.PREPARING ? "chef-line-1" : null,
      stationId: "kitchen-main",
      estimatedReadyAt: "2026-02-15T18:45:00.000Z",
      dispatchedAt:
        partial.status === ORDER_STATUSES.OUT_FOR_DELIVERY ? "2026-02-15T18:50:00.000Z" : null,
      deliveredAt: null,
      deliveryAddress:
        partial.orderType === ORDER_TYPES.DELIVERY ? "14 Harbour Lane, London E1 8QS" : null,
      trackingReference: partial.status === ORDER_STATUSES.OUT_FOR_DELIVERY ? "DEL-HBR-2841" : null,
    },
    history: [
      {
        id: `${partial.id}-hist-1`,
        orderId: partial.id,
        action: "order.created",
        snapshot: { status: ORDER_STATUSES.PENDING },
        performedBy: "system",
        performedAt: "2026-02-15T18:00:00.000Z",
      },
    ],
    analytics: {
      orderId: partial.id,
      itemCount: orderItems.reduce((sum, item) => sum + item.quantity, 0),
      prepTimeMinutes: partial.prepTimeMinutes ?? 18,
      fulfillmentTimeMinutes: partial.status === ORDER_STATUSES.COMPLETED ? 32 : null,
      marginEstimatePence: Math.round(partial.subtotalPence * 0.62),
      upsellPotentialPence: 850,
      delayRiskScore: partial.delayRiskScore ?? 0.15,
    },
    aiContext: {
      orderId: partial.id,
      summary: `${partial.orderNumber} — ${partial.customerName ?? "Walk-in"} (${partial.orderType.replace("_", " ")})`,
      insights: [
        `Current status: ${partial.status.replace("_", " ")}`,
        `Prep estimate: ${partial.prepTimeMinutes ?? 18} minutes`,
      ],
      recommendedActions: [
        "Confirm kitchen queue priority",
        "Send ready notification when complete",
      ],
      upsellSuggestions: ["Garlic bread", "Dessert special", "Premium drink upgrade"],
      delayPredictionMinutes: partial.delayRiskScore && partial.delayRiskScore > 0.4 ? 12 : null,
      lastGeneratedAt: now,
    },
  };
}

export const MOCK_ORDER_RECORDS: OrderRecord[] = [
  buildOrderRecord({
    id: "ord-1001",
    orderNumber: "HBR-1001",
    orderType: ORDER_TYPES.DINE_IN,
    status: ORDER_STATUSES.PREPARING,
    customerName: "James Mitchell",
    customerId: "cust-001",
    tableNumber: "12",
    source: ORDER_SOURCES.POS,
    items: [
      { productId: "prod-steak", productName: "Harbour Ribeye", quantity: 2, unitPricePence: 3200 },
      { productId: "prod-wine", productName: "House Red", quantity: 1, unitPricePence: 650 },
    ],
    subtotalPence: 7050,
    taxPence: 1410,
    prepTimeMinutes: 22,
    delayRiskScore: 0.25,
  }),
  buildOrderRecord({
    id: "ord-1002",
    orderNumber: "HBR-1002",
    orderType: ORDER_TYPES.DELIVERY,
    status: ORDER_STATUSES.OUT_FOR_DELIVERY,
    customerName: "Sarah Chen",
    customerId: "cust-002",
    source: ORDER_SOURCES.WEB,
    items: [
      {
        productId: "prod-burger",
        productName: "Classic Burger",
        quantity: 2,
        unitPricePence: 1450,
      },
      { productId: "prod-fries", productName: "Truffle Fries", quantity: 2, unitPricePence: 595 },
    ],
    subtotalPence: 4090,
    taxPence: 818,
    delayRiskScore: 0.55,
  }),
  buildOrderRecord({
    id: "ord-1003",
    orderNumber: "HBR-1003",
    orderType: ORDER_TYPES.QR_ORDERING,
    status: ORDER_STATUSES.READY,
    customerName: null,
    tableNumber: "7",
    source: ORDER_SOURCES.QR,
    items: [
      {
        productId: "prod-pizza",
        productName: "Margherita Pizza",
        quantity: 1,
        unitPricePence: 1295,
      },
      { productId: "prod-soda", productName: "Sparkling Water", quantity: 2, unitPricePence: 350 },
    ],
    subtotalPence: 1995,
    taxPence: 399,
  }),
  buildOrderRecord({
    id: "ord-1004",
    orderNumber: "HBR-1004",
    orderType: ORDER_TYPES.TAKEAWAY,
    status: ORDER_STATUSES.COMPLETED,
    customerName: "David Okonkwo",
    customerId: "cust-003",
    source: ORDER_SOURCES.STAFF,
    items: [
      { productId: "prod-curry", productName: "Lamb Curry", quantity: 1, unitPricePence: 1650 },
      { productId: "prod-rice", productName: "Basmati Rice", quantity: 1, unitPricePence: 450 },
    ],
    subtotalPence: 2100,
    discountPence: 210,
    taxPence: 378,
    prepTimeMinutes: 15,
  }),
  buildOrderRecord({
    id: "ord-1005",
    orderNumber: "HBR-1005",
    orderType: ORDER_TYPES.PHONE,
    status: ORDER_STATUSES.CONFIRMED,
    customerName: "Emma Walsh",
    source: ORDER_SOURCES.PHONE,
    items: [
      {
        productId: "prod-pasta",
        productName: "Seafood Linguine",
        quantity: 2,
        unitPricePence: 1895,
      },
    ],
    subtotalPence: 3790,
    taxPence: 758,
  }),
  buildOrderRecord({
    id: "ord-1006",
    orderNumber: "HBR-1006",
    orderType: ORDER_TYPES.FUTURE,
    status: ORDER_STATUSES.PENDING,
    customerName: "Corporate Event — Apex Ltd",
    scheduledFor: "2026-02-20T19:00:00.000Z",
    source: ORDER_SOURCES.STAFF,
    items: [
      {
        productId: "prod-platter",
        productName: "Sharing Platter x4",
        quantity: 4,
        unitPricePence: 4500,
      },
    ],
    subtotalPence: 18000,
    taxPence: 3600,
    delayRiskScore: 0.1,
  }),
];
