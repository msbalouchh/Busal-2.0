/** Order lifecycle statuses. */
export const ORDER_STATUSES = {
  DRAFT: "draft",
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  READY: "ready",
  OUT_FOR_DELIVERY: "out_for_delivery",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

/** Supported order channels / types. */
export const ORDER_TYPES = {
  DINE_IN: "dine_in",
  TAKEAWAY: "takeaway",
  DELIVERY: "delivery",
  QR_ORDERING: "qr_ordering",
  PHONE: "phone",
  FUTURE: "future",
} as const;

export type OrderType = (typeof ORDER_TYPES)[keyof typeof ORDER_TYPES];

export const ORDER_SOURCES = {
  POS: "pos",
  QR: "qr",
  PHONE: "phone",
  WEB: "web",
  MARKETPLACE: "marketplace",
  AI_AGENT: "ai_agent",
  STAFF: "staff",
} as const;

export type OrderSource = (typeof ORDER_SOURCES)[keyof typeof ORDER_SOURCES];

export const ORDER_TIMELINE_EVENT_TYPES = {
  CREATED: "created",
  STATUS_CHANGED: "status_changed",
  PAYMENT_RECEIVED: "payment_received",
  ITEM_MODIFIED: "item_modified",
  NOTE_ADDED: "note_added",
  FULFILLMENT_UPDATED: "fulfillment_updated",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export type OrderTimelineEventType =
  (typeof ORDER_TIMELINE_EVENT_TYPES)[keyof typeof ORDER_TIMELINE_EVENT_TYPES];

export const FULFILLMENT_STATUSES = {
  UNASSIGNED: "unassigned",
  QUEUED: "queued",
  IN_PROGRESS: "in_progress",
  READY: "ready",
  DISPATCHED: "dispatched",
  DELIVERED: "delivered",
  FAILED: "failed",
} as const;

export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[keyof typeof FULFILLMENT_STATUSES];

export const PAYMENT_STATUSES = {
  UNPAID: "unpaid",
  PARTIAL: "partial",
  PAID: "paid",
  REFUNDED: "refunded",
  FAILED: "failed",
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES];

export const ORDER_AI_TOOL_IDS = {
  CREATE: "orders.create-order",
  MODIFY: "orders.modify-order",
  CANCEL: "orders.cancel-order",
  TRACK: "orders.track-order",
  RECOMMEND_UPSELLS: "orders.recommend-upsells",
  PREDICT_DELAYS: "orders.predict-delays",
} as const;

export type OrderAiToolId = (typeof ORDER_AI_TOOL_IDS)[keyof typeof ORDER_AI_TOOL_IDS];

/** Valid status transitions for mock lifecycle enforcement. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ["pending", "cancelled"],
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["out_for_delivery", "completed", "cancelled"],
  out_for_delivery: ["completed", "cancelled"],
  completed: ["refunded"],
  cancelled: [],
  refunded: [],
};
