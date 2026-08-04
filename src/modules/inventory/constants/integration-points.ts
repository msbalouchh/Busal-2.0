/**
 * Future integration points for the Enterprise Inventory Management Platform.
 * Architecture markers only — no runtime wiring.
 */
export const INVENTORY_INTEGRATION_POINTS = {
  prisma: "prisma",
  supabase: "supabase",
  aiCore: "ai-core",
  aiToolsPlatform: "ai-tools-platform",
  rbac: "rbac",
  tenantFoundation: "tenant-foundation",
  menu: "menu",
  orders: "orders",
  kitchen: "kitchen",
  pos: "pos",
  finance: "finance",
  analytics: "analytics",
  crm: "crm",
  billing: "billing",
  suppliers: "suppliers",
  purchasing: "purchasing",
  notifications: "notifications",
  developerApis: "developer-apis",
} as const;

export type InventoryIntegrationPoint =
  (typeof INVENTORY_INTEGRATION_POINTS)[keyof typeof INVENTORY_INTEGRATION_POINTS];
