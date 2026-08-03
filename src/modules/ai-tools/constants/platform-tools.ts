export const PLATFORM_TOOL_IDS = {
  CUSTOMER: "tool.customer",
  RESERVATION: "tool.reservation",
  MENU: "tool.menu",
  ORDER: "tool.order",
  KITCHEN: "tool.kitchen",
  POS: "tool.pos",
  INVENTORY: "tool.inventory",
  FINANCE: "tool.finance",
  MARKETING: "tool.marketing",
  ANALYTICS: "tool.analytics",
  NOTIFICATION: "tool.notification",
} as const;

export type PlatformToolId = (typeof PLATFORM_TOOL_IDS)[keyof typeof PLATFORM_TOOL_IDS];

export const PLATFORM_MODULES = {
  CRM: "crm",
  RESERVATIONS: "reservations",
  MENU: "menu",
  ORDERS: "orders",
  KITCHEN: "kitchen",
  POS: "pos",
  INVENTORY: "inventory",
  FINANCE: "finance",
  MARKETING: "marketing",
  ANALYTICS: "analytics",
  NOTIFICATIONS: "notifications",
} as const;

export const PLATFORM_TOOL_PERMISSIONS = {
  CUSTOMERS_READ: "customers.read",
  CUSTOMERS_MANAGE: "customers.manage",
  RESERVATIONS_READ: "reservations.read",
  RESERVATIONS_MANAGE: "reservations.manage",
  MENU_READ: "menu.read",
  MENU_MANAGE: "menu.manage",
  ORDERS_READ: "orders.read",
  ORDERS_MANAGE: "orders.manage",
  KITCHEN_READ: "kitchen.read",
  KITCHEN_MANAGE: "kitchen.manage",
  POS_READ: "pos.read",
  POS_MANAGE: "pos.manage",
  INVENTORY_READ: "inventory.read",
  INVENTORY_MANAGE: "inventory.manage",
  FINANCE_READ: "finance.read",
  FINANCE_MANAGE: "finance.manage",
  MARKETING_READ: "marketing.read",
  MARKETING_MANAGE: "marketing.manage",
  ANALYTICS_READ: "analytics.read",
  REPORTS_EXPORT: "reports.export",
  NOTIFICATIONS_SEND: "notifications.send",
} as const;

export const DEFAULT_PLATFORM_TOOL_VERSION = "1.0.0";
