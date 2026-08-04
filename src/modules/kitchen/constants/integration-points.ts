/**
 * Future integration points for the Enterprise Kitchen Display System.
 * Architecture markers only — no runtime wiring.
 */
export const KITCHEN_INTEGRATION_POINTS = {
  prisma: "prisma",
  supabase: "supabase",
  aiCore: "ai-core",
  aiToolsPlatform: "ai-tools-platform",
  rbac: "rbac",
  tenantFoundation: "tenant-foundation",
  orders: "orders",
  menu: "menu",
  pos: "pos",
  inventory: "inventory",
  reservations: "reservations",
  tableManagement: "table-management",
  notifications: "notifications",
  analytics: "analytics",
  finance: "finance",
  developerApis: "developer-apis",
} as const;

export type KitchenIntegrationPoint =
  (typeof KITCHEN_INTEGRATION_POINTS)[keyof typeof KITCHEN_INTEGRATION_POINTS];
