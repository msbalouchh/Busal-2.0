export const TOOL_CATEGORIES = {
  CRM: "crm",
  POS: "pos",
  RESERVATIONS: "reservations",
  INVENTORY: "inventory",
  FINANCE: "finance",
  MARKETING: "marketing",
  REPORTS: "reports",
  NOTIFICATIONS: "notifications",
  DEVELOPER: "developer",
} as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[keyof typeof TOOL_CATEGORIES];

export const TOOL_CATEGORY_LABELS: Record<ToolCategory, string> = {
  crm: "CRM",
  pos: "POS",
  reservations: "Reservations",
  inventory: "Inventory",
  finance: "Finance",
  marketing: "Marketing",
  reports: "Reports",
  notifications: "Notifications",
  developer: "Developer APIs",
};

export const ALL_TOOL_CATEGORIES = Object.values(TOOL_CATEGORIES);
