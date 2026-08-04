/** Inventory stock lifecycle statuses. */
export const INVENTORY_STOCK_STATUSES = {
  IN_STOCK: "in_stock",
  LOW_STOCK: "low_stock",
  OUT_OF_STOCK: "out_of_stock",
  RESERVED: "reserved",
  DAMAGED: "damaged",
  EXPIRED: "expired",
} as const;

export type InventoryStockStatus =
  (typeof INVENTORY_STOCK_STATUSES)[keyof typeof INVENTORY_STOCK_STATUSES];

/** Location types for multi-branch and warehouse support. */
export const INVENTORY_LOCATION_TYPES = {
  BRANCH: "branch",
  WAREHOUSE: "warehouse",
  COLD_STORAGE: "cold_storage",
  DRY_STORAGE: "dry_storage",
  BAR: "bar",
  KITCHEN: "kitchen",
} as const;

export type InventoryLocationType =
  (typeof INVENTORY_LOCATION_TYPES)[keyof typeof INVENTORY_LOCATION_TYPES];

/** Standard measurement units. */
export const INVENTORY_UNIT_TYPES = {
  EACH: "each",
  KG: "kg",
  G: "g",
  L: "l",
  ML: "ml",
  BOX: "box",
  CASE: "case",
  BOTTLE: "bottle",
} as const;

export type InventoryUnitType = (typeof INVENTORY_UNIT_TYPES)[keyof typeof INVENTORY_UNIT_TYPES];

/** Stock movement types. */
export const INVENTORY_MOVEMENT_TYPES = {
  RECEIPT: "receipt",
  SALE: "sale",
  TRANSFER_IN: "transfer_in",
  TRANSFER_OUT: "transfer_out",
  ADJUSTMENT: "adjustment",
  WASTE: "waste",
  RETURN: "return",
  PRODUCTION: "production",
} as const;

export type InventoryMovementType =
  (typeof INVENTORY_MOVEMENT_TYPES)[keyof typeof INVENTORY_MOVEMENT_TYPES];

/** Purchase order lifecycle statuses. */
export const PURCHASE_ORDER_STATUSES = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  ORDERED: "ordered",
  PARTIALLY_RECEIVED: "partially_received",
  RECEIVED: "received",
  CANCELLED: "cancelled",
} as const;

export type PurchaseOrderStatus =
  (typeof PURCHASE_ORDER_STATUSES)[keyof typeof PURCHASE_ORDER_STATUSES];

/** GRN (Goods Received Note) statuses. */
export const GRN_STATUSES = {
  PENDING: "pending",
  INSPECTED: "inspected",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
} as const;

export type GrnStatus = (typeof GRN_STATUSES)[keyof typeof GRN_STATUSES];

/** Stock adjustment reason codes. */
export const STOCK_ADJUSTMENT_REASONS = {
  COUNT_CORRECTION: "count_correction",
  DAMAGE: "damage",
  THEFT: "theft",
  SPOILAGE: "spoilage",
  OPENING_BALANCE: "opening_balance",
  OTHER: "other",
} as const;

export type StockAdjustmentReason =
  (typeof STOCK_ADJUSTMENT_REASONS)[keyof typeof STOCK_ADJUSTMENT_REASONS];

/** Waste reason categories. */
export const WASTE_REASONS = {
  EXPIRED: "expired",
  SPOILED: "spoiled",
  PREPARATION: "preparation",
  OVERPRODUCTION: "overproduction",
  CUSTOMER_RETURN: "customer_return",
  OTHER: "other",
} as const;

export type WasteReason = (typeof WASTE_REASONS)[keyof typeof WASTE_REASONS];

export const INVENTORY_AI_TOOL_IDS = {
  CREATE_ITEM: "inventory.create-item",
  UPDATE_STOCK: "inventory.update-stock",
  PREDICT_LOW_STOCK: "inventory.predict-low-stock",
  FORECAST_DEMAND: "inventory.forecast-demand",
  RECOMMEND_PURCHASE_ORDERS: "inventory.recommend-purchase-orders",
  DETECT_WASTE: "inventory.detect-waste",
  SUGGEST_REORDER: "inventory.suggest-reorder",
  OPTIMIZE_STOCK: "inventory.optimize-stock",
} as const;

export type InventoryAiToolId = (typeof INVENTORY_AI_TOOL_IDS)[keyof typeof INVENTORY_AI_TOOL_IDS];

/** Module-local permission markers (future RBAC wiring). */
export const INVENTORY_PERMISSIONS = {
  READ: "inventory.read",
  MANAGE: "inventory.manage",
  ADJUST: "inventory.adjust",
  TRANSFER: "inventory.transfer",
  PURCHASE: "inventory.purchase",
  WASTE: "inventory.waste",
  ANALYTICS_READ: "inventory.analytics.read",
} as const;

export type InventoryPermission =
  (typeof INVENTORY_PERMISSIONS)[keyof typeof INVENTORY_PERMISSIONS];

export const INVENTORY_STOCK_STATUS_LABELS: Record<InventoryStockStatus, string> = {
  in_stock: "In Stock",
  low_stock: "Low Stock",
  out_of_stock: "Out of Stock",
  reserved: "Reserved",
  damaged: "Damaged",
  expired: "Expired",
};

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  ordered: "Ordered",
  partially_received: "Partially Received",
  received: "Received",
  cancelled: "Cancelled",
};
