/** Platform module keys enforced by subscription feature access. */
export const PLATFORM_MODULE_KEYS = {
  CRM: "crm",
  MENU: "menu",
  TABLES: "tables",
  RESERVATIONS: "reservations",
  ORDERS: "orders",
  KITCHEN: "kitchen",
  POS: "pos",
  INVENTORY: "inventory",
  STAFF: "staff",
  FINANCE: "finance",
  BILLING: "billing",
  ANALYTICS: "analytics",
  NOTIFICATIONS: "notifications",
  AI: "ai",
  API_PLATFORM: "api_platform",
  LOYALTY: "loyalty",
  QR_MENU: "qr_menu",
  DELIVERY: "delivery",
  MARKETING: "marketing",
} as const;

export type PlatformModuleKey = (typeof PLATFORM_MODULE_KEYS)[keyof typeof PLATFORM_MODULE_KEYS];

export const ALL_PLATFORM_MODULE_KEYS: PlatformModuleKey[] = Object.values(PLATFORM_MODULE_KEYS);

export const PLATFORM_MODULE_LABELS: Record<PlatformModuleKey, string> = {
  crm: "CRM",
  menu: "Menu",
  tables: "Tables",
  reservations: "Reservations",
  orders: "Orders",
  kitchen: "Kitchen",
  pos: "POS",
  inventory: "Inventory",
  staff: "Staff",
  finance: "Finance",
  billing: "Billing",
  analytics: "Analytics",
  notifications: "Notifications",
  ai: "AI",
  api_platform: "API Platform",
  loyalty: "Loyalty",
  qr_menu: "QR Menu",
  delivery: "Delivery",
  marketing: "Marketing",
};

/** Registry of platform modules and metadata for billing reuse. */
export const FEATURE_REGISTRY = ALL_PLATFORM_MODULE_KEYS.map((key) => ({
  key,
  label: PLATFORM_MODULE_LABELS[key],
  category: "module" as const,
}));
