export const POS_ROUTES = {
  overview: "/dashboard/pos",
} as const;

export const POS_HELD_ORDER_PREFIX = "POS_HELD:" as const;
export const POS_ORDER_TYPE_PREFIX = "POS_TYPE:" as const;

export const POS_ORDER_TYPES = ["DINE_IN", "TAKEAWAY", "DELIVERY"] as const;

export type PosOrderType = (typeof POS_ORDER_TYPES)[number];

export const POS_TERMINAL_QR_SLUG = "pos-terminal" as const;
export const POS_HOLD_PARKING_QR_SLUG = "pos-hold-parking" as const;
export const POS_DEVICE_INFO = "POS" as const;
export const POS_HOLD_DEVICE_INFO = "POS_HOLD" as const;

export const POS_DEFAULT_ORDER_TYPE: PosOrderType = "DINE_IN";
