export const PERMISSION_CATEGORIES = {
  DASHBOARD: "dashboard",
  BUSINESS: "business",
  BRANCHES: "branches",
  STAFF: "staff",
  CUSTOMERS: "customers",
  RESERVATIONS: "reservations",
  MENU: "menu",
  KITCHEN: "kitchen",
  POS: "pos",
  ORDERS: "orders",
  INVENTORY: "inventory",
  MARKETING: "marketing",
  FINANCE: "finance",
  REPORTS: "reports",
  ANALYTICS: "analytics",
  AI: "ai",
  BILLING: "billing",
  SETTINGS: "settings",
  DEVELOPER: "developer",
} as const;

export type PermissionCategorySlug =
  (typeof PERMISSION_CATEGORIES)[keyof typeof PERMISSION_CATEGORIES];

export const PERMISSION_CATEGORY_LABELS: Record<PermissionCategorySlug, string> = {
  dashboard: "Dashboard",
  business: "Business",
  branches: "Branches",
  staff: "Staff",
  customers: "Customers",
  reservations: "Reservations",
  menu: "Menu",
  kitchen: "Kitchen",
  pos: "POS",
  orders: "Orders",
  inventory: "Inventory",
  marketing: "Marketing",
  finance: "Finance",
  reports: "Reports",
  analytics: "Analytics",
  ai: "AI",
  billing: "Billing",
  settings: "Settings",
  developer: "Developer",
};

export const ALL_PERMISSION_CATEGORIES = Object.values(PERMISSION_CATEGORIES);
