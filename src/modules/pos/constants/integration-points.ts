/**
 * Future integration points for the Enterprise Point of Sale Platform.
 * Architecture markers only — no runtime wiring.
 */
export const POS_INTEGRATION_POINTS = {
  prisma: "prisma",
  supabase: "supabase",
  aiCore: "ai-core",
  aiToolsPlatform: "ai-tools-platform",
  rbac: "rbac",
  tenantFoundation: "tenant-foundation",
  menu: "menu",
  orders: "orders",
  kitchen: "kitchen",
  reservations: "reservations",
  tableManagement: "table-management",
  inventory: "inventory",
  finance: "finance",
  analytics: "analytics",
  crm: "crm",
  billing: "billing",
  notifications: "notifications",
  developerApis: "developer-apis",
} as const;

export type PosIntegrationPoint =
  (typeof POS_INTEGRATION_POINTS)[keyof typeof POS_INTEGRATION_POINTS];
