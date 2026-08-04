/** Kitchen order lifecycle statuses. */
export const KITCHEN_STATUSES = {
  QUEUED: "queued",
  ACCEPTED: "accepted",
  PREPARING: "preparing",
  READY: "ready",
  SERVED: "served",
  DELAYED: "delayed",
  CANCELLED: "cancelled",
} as const;

export type KitchenStatus = (typeof KITCHEN_STATUSES)[keyof typeof KITCHEN_STATUSES];

/** Kitchen station types for routing and display. */
export const KITCHEN_STATION_TYPES = {
  GRILL: "grill",
  FRYER: "fryer",
  PIZZA: "pizza",
  DRINKS: "drinks",
  DESSERTS: "desserts",
  SALADS: "salads",
  BAR: "bar",
  CUSTOM: "custom",
} as const;

export type KitchenStationType = (typeof KITCHEN_STATION_TYPES)[keyof typeof KITCHEN_STATION_TYPES];

/** Order priority levels for queue sorting. */
export const KITCHEN_PRIORITIES = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
  VIP: "vip",
} as const;

export type KitchenPriority = (typeof KITCHEN_PRIORITIES)[keyof typeof KITCHEN_PRIORITIES];

/** Timeline event types for kitchen audit trail. */
export const KITCHEN_TIMELINE_EVENT_TYPES = {
  ORDER_RECEIVED: "order_received",
  ORDER_ACCEPTED: "order_accepted",
  STATION_ASSIGNED: "station_assigned",
  PREPARATION_STARTED: "preparation_started",
  ITEM_READY: "item_ready",
  ORDER_READY: "order_ready",
  ORDER_BUMPED: "order_bumped",
  ORDER_RECALLED: "order_recalled",
  ORDER_DELAYED: "order_delayed",
  ORDER_SERVED: "order_served",
  ORDER_CANCELLED: "order_cancelled",
  NOTE_ADDED: "note_added",
} as const;

export type KitchenTimelineEventType =
  (typeof KITCHEN_TIMELINE_EVENT_TYPES)[keyof typeof KITCHEN_TIMELINE_EVENT_TYPES];

/** Screen display modes for KDS terminals. */
export const KITCHEN_SCREEN_MODES = {
  EXPEDITE: "expedite",
  STATION: "station",
  ALL_DAY: "all_day",
  SUMMARY: "summary",
} as const;

export type KitchenScreenMode = (typeof KITCHEN_SCREEN_MODES)[keyof typeof KITCHEN_SCREEN_MODES];

/** Queue sort strategies. */
export const KITCHEN_QUEUE_SORT_STRATEGIES = {
  FIFO: "fifo",
  PRIORITY: "priority",
  PROMISED_TIME: "promised_time",
  STATION: "station",
} as const;

export type KitchenQueueSortStrategy =
  (typeof KITCHEN_QUEUE_SORT_STRATEGIES)[keyof typeof KITCHEN_QUEUE_SORT_STRATEGIES];

export const KITCHEN_AI_TOOL_IDS = {
  ROUTE_ORDER: "kitchen.route-order",
  ASSIGN_STATION: "kitchen.assign-station",
  PREDICT_DELAYS: "kitchen.predict-delays",
  OPTIMIZE_QUEUE: "kitchen.optimize-queue",
  ESTIMATE_PREP_TIME: "kitchen.estimate-prep-time",
  RECOMMEND_WORKFLOW: "kitchen.recommend-workflow",
  DETECT_BOTTLENECKS: "kitchen.detect-bottlenecks",
} as const;

export type KitchenAiToolId = (typeof KITCHEN_AI_TOOL_IDS)[keyof typeof KITCHEN_AI_TOOL_IDS];

/** Module-local permission markers (future RBAC wiring). */
export const KITCHEN_PERMISSIONS = {
  READ: "kitchen.read",
  MANAGE: "kitchen.manage",
  BUMP: "kitchen.bump",
  RECALL: "kitchen.recall",
  ANALYTICS_READ: "kitchen.analytics.read",
} as const;

export type KitchenPermission = (typeof KITCHEN_PERMISSIONS)[keyof typeof KITCHEN_PERMISSIONS];

export const KITCHEN_STATUS_LABELS: Record<KitchenStatus, string> = {
  queued: "Queued",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  delayed: "Delayed",
  cancelled: "Cancelled",
};

export const KITCHEN_STATION_LABELS: Record<KitchenStationType, string> = {
  grill: "Grill",
  fryer: "Fryer",
  pizza: "Pizza",
  drinks: "Drinks",
  desserts: "Desserts",
  salads: "Salads",
  bar: "Bar",
  custom: "Custom",
};

export const KITCHEN_PRIORITY_LABELS: Record<KitchenPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
  vip: "VIP",
};
