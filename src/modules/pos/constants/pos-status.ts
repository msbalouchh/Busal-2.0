/** POS order lifecycle statuses. */
export const POS_ORDER_STATUSES = {
  DRAFT: "draft",
  OPEN: "open",
  HELD: "held",
  PAID: "paid",
  PARTIALLY_PAID: "partially_paid",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "partially_refunded",
  VOID: "void",
  MERGED: "merged",
  TRANSFERRED: "transferred",
} as const;

export type PosOrderStatus = (typeof POS_ORDER_STATUSES)[keyof typeof POS_ORDER_STATUSES];

/** Supported payment methods. */
export const POS_PAYMENT_TYPES = {
  CASH: "cash",
  CARD: "card",
  APPLE_PAY: "apple_pay",
  GOOGLE_PAY: "google_pay",
  GIFT_CARD: "gift_card",
  STORE_CREDIT: "store_credit",
  ONLINE: "online",
  MIXED: "mixed",
} as const;

export type PosPaymentType = (typeof POS_PAYMENT_TYPES)[keyof typeof POS_PAYMENT_TYPES];

/** Discount application types. */
export const POS_DISCOUNT_TYPES = {
  PERCENTAGE: "percentage",
  FIXED: "fixed",
  BOGO: "bogo",
  PROMO_CODE: "promo_code",
  EMPLOYEE: "employee",
  LOYALTY: "loyalty",
} as const;

export type PosDiscountType = (typeof POS_DISCOUNT_TYPES)[keyof typeof POS_DISCOUNT_TYPES];

/** Shift lifecycle statuses. */
export const POS_SHIFT_STATUSES = {
  OPEN: "open",
  CLOSED: "closed",
  RECONCILING: "reconciling",
} as const;

export type PosShiftStatus = (typeof POS_SHIFT_STATUSES)[keyof typeof POS_SHIFT_STATUSES];

/** Cash drawer event types. */
export const POS_CASH_DRAWER_EVENT_TYPES = {
  OPEN: "open",
  CLOSE: "close",
  PAID_IN: "paid_in",
  PAID_OUT: "paid_out",
  NO_SALE: "no_sale",
  DROP: "drop",
} as const;

export type PosCashDrawerEventType =
  (typeof POS_CASH_DRAWER_EVENT_TYPES)[keyof typeof POS_CASH_DRAWER_EVENT_TYPES];

/** Receipt delivery channels. */
export const POS_RECEIPT_CHANNELS = {
  PRINT: "print",
  EMAIL: "email",
  SMS: "sms",
  NONE: "none",
} as const;

export type PosReceiptChannel = (typeof POS_RECEIPT_CHANNELS)[keyof typeof POS_RECEIPT_CHANNELS];

/** Refund reason categories. */
export const POS_REFUND_REASONS = {
  CUSTOMER_REQUEST: "customer_request",
  WRONG_ORDER: "wrong_order",
  QUALITY_ISSUE: "quality_issue",
  OVERCHARGE: "overcharge",
  FRAUD_SUSPECTED: "fraud_suspected",
  OTHER: "other",
} as const;

export type PosRefundReason = (typeof POS_REFUND_REASONS)[keyof typeof POS_REFUND_REASONS];

/** Order source channels. */
export const POS_ORDER_SOURCES = {
  DINE_IN: "dine_in",
  TAKEAWAY: "takeaway",
  DELIVERY: "delivery",
  BAR: "bar",
  ONLINE: "online",
  KIOSK: "kiosk",
} as const;

export type PosOrderSource = (typeof POS_ORDER_SOURCES)[keyof typeof POS_ORDER_SOURCES];

export const POS_AI_TOOL_IDS = {
  CREATE_SALE: "pos.create-sale",
  APPLY_DISCOUNT: "pos.apply-discount",
  SPLIT_BILL: "pos.split-bill",
  RECOMMEND_UPSELLS: "pos.recommend-upsells",
  PREDICT_BUSY_HOURS: "pos.predict-busy-hours",
  DETECT_SUSPICIOUS_REFUNDS: "pos.detect-suspicious-refunds",
  SUGGEST_PROMOTIONS: "pos.suggest-promotions",
  FORECAST_REVENUE: "pos.forecast-revenue",
} as const;

export type PosAiToolId = (typeof POS_AI_TOOL_IDS)[keyof typeof POS_AI_TOOL_IDS];

/** Module-local permission markers (future RBAC wiring). */
export const POS_PERMISSIONS = {
  READ: "pos.read",
  MANAGE: "pos.manage",
  REFUND: "pos.refund",
  DISCOUNT: "pos.discount",
  SHIFT_MANAGE: "pos.shift.manage",
  DRAWER_MANAGE: "pos.drawer.manage",
  ANALYTICS_READ: "pos.analytics.read",
} as const;

export type PosPermission = (typeof POS_PERMISSIONS)[keyof typeof POS_PERMISSIONS];

export const POS_ORDER_STATUS_LABELS: Record<PosOrderStatus, string> = {
  draft: "Draft",
  open: "Open",
  held: "Held",
  paid: "Paid",
  partially_paid: "Partially Paid",
  refunded: "Refunded",
  partially_refunded: "Partially Refunded",
  void: "Void",
  merged: "Merged",
  transferred: "Transferred",
};

export const POS_PAYMENT_TYPE_LABELS: Record<PosPaymentType, string> = {
  cash: "Cash",
  card: "Card",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
  gift_card: "Gift Card",
  store_credit: "Store Credit",
  online: "Online",
  mixed: "Mixed",
};

export const POS_SHIFT_STATUS_LABELS: Record<PosShiftStatus, string> = {
  open: "Open",
  closed: "Closed",
  reconciling: "Reconciling",
};
