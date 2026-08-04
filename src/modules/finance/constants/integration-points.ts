/**
 * Future integration points for the Enterprise Finance & Accounting Platform.
 * Architecture markers only — no runtime wiring.
 */
export const FINANCE_INTEGRATION_POINTS = {
  prisma: "prisma",
  supabase: "supabase",
  aiCore: "ai-core",
  aiToolsPlatform: "ai-tools-platform",
  rbac: "rbac",
  tenantFoundation: "tenant-foundation",
  pos: "pos",
  orders: "orders",
  inventory: "inventory",
  staff: "staff",
  crm: "crm",
  billing: "billing",
  analytics: "analytics",
  notifications: "notifications",
  developerApis: "developer-apis",
} as const;

export type FinanceIntegrationPoint =
  (typeof FINANCE_INTEGRATION_POINTS)[keyof typeof FINANCE_INTEGRATION_POINTS];
