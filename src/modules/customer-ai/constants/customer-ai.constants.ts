export const CUSTOMER_AI_ROUTES = {
  controlCenter: "/dashboard/ai-platform/control-center",
  channels: "/dashboard/ai-platform/channels",
  operations: "/dashboard/ai-platform/operations",
  conversations: "/dashboard/ai-platform/control-center/conversations",
  analytics: "/dashboard/ai-platform/control-center/analytics",
} as const;

export const CUSTOMER_AI_AUDIENCE = {
  STAFF: "STAFF",
  CUSTOMER: "CUSTOMER",
} as const;

export const CUSTOMER_AI_CHANNELS = {
  WEBSITE: "website",
  EMBED: "embed",
  WHATSAPP: "whatsapp",
  INSTAGRAM: "instagram",
  FACEBOOK: "facebook",
  TIKTOK: "tiktok",
  LIVE_CHAT: "live_chat",
  PORTAL: "portal",
} as const;

export const CUSTOMER_AI_TOOL_IDS = {
  VIEW_BUSINESS_INFO: "customer.view_business_info",
  VIEW_HOURS: "customer.view_hours",
  VIEW_MENU: "customer.view_menu",
  VIEW_SERVICES: "customer.view_services",
  SEARCH_MENU: "customer.search_menu",
  CHECK_AVAILABILITY: "customer.check_availability",
  CREATE_RESERVATION: "customer.create_reservation",
  CANCEL_RESERVATION: "customer.cancel_reservation",
  VIEW_ORDER_STATUS: "customer.view_order_status",
  SEARCH_ORDERS: "customer.search_orders",
  CANCEL_ORDER: "customer.cancel_order",
  CREATE_ORDER: "customer.create_order",
  ORDER_HISTORY: "customer.order_history",
  RESERVATION_HISTORY: "customer.reservation_history",
  PRODUCT_DETAILS: "customer.product_details",
  PRODUCT_AVAILABILITY: "customer.product_availability",
  VIEW_RESERVATION: "customer.view_reservation",
} as const;

export const AI_BUSINESS_TOOL_IDS = {
  SEARCH_ORDERS: "business.search_orders",
  GET_ORDER: "business.get_order",
  CANCEL_ORDER: "business.cancel_order",
  ORDERS_SUMMARY_TODAY: "business.orders_summary_today",
  PENDING_ORDERS: "business.pending_orders",
  DELAYED_ORDERS: "business.delayed_orders",
  SEARCH_RESERVATIONS: "business.search_reservations",
  RESERVATIONS_TOMORROW: "business.reservations_tomorrow",
  CANCEL_RESERVATION: "business.cancel_reservation",
  INVENTORY_LOW_STOCK: "business.inventory_low_stock",
  INVENTORY_SUMMARY: "business.inventory_summary",
  OPERATIONAL_SUMMARY: "business.operational_summary",
  AI_ACTIVITY_SUMMARY: "business.ai_activity_summary",
  CUSTOMER_ISSUES: "business.customer_issues",
  REVENUE_SUMMARY: "business.revenue_summary",
} as const;

export const CUSTOMER_AI_EVENT_TYPES = {
  CONVERSATION_STARTED: "conversation_started",
  QUESTION_ANSWERED: "question_answered",
  UNRESOLVED: "unresolved",
  ESCALATED: "escalated",
  RESERVATION_ASSISTED: "reservation_assisted",
  ORDER_ASSISTED: "order_assisted",
  TOOL_EXECUTED: "tool_executed",
  CONFIRMATION_REQUIRED: "confirmation_required",
} as const;

export const CUSTOMER_AI_SETTINGS_KEYS = [
  "ai.customer.enabled",
  "ai.customer.greeting",
  "ai.customer.read_menu",
  "ai.customer.read_hours",
  "ai.customer.read_reservations",
  "ai.customer.read_orders",
  "ai.customer.create_reservation",
  "ai.customer.create_order",
  "ai.customer.require_confirmation",
  "ai.embedding.provider",
  "ai.ops.orders.cancel",
  "ai.ops.orders.create",
  "ai.ops.reservations.cancel",
  "ai.ops.reservations.update",
  "ai.ops.inventory.read",
  "ai.ops.analytics.read",
] as const;

export const CUSTOMER_AI_TONE_OPTIONS = [
  "Professional",
  "Friendly",
  "Premium",
  "Casual",
  "Concise",
  "Warm",
] as const;

export const CUSTOMER_AI_MODULE = "customer-ai" as const;
