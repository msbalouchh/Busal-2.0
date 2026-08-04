/**
 * Future integration points for the Enterprise Analytics & BI Platform.
 * Architecture markers only — no runtime wiring.
 */
export const ANALYTICS_INTEGRATION_POINTS = {
  prisma: "prisma",
  supabase: "supabase",
  aiCore: "ai-core",
  aiToolsPlatform: "ai-tools-platform",
  rbac: "rbac",
  tenantFoundation: "tenant-foundation",
  workspace: "workspace",
  businessProvisioning: "business-provisioning",
  billing: "billing",
  finance: "finance",
  crm: "crm",
  orders: "orders",
  menu: "menu",
  tables: "tables",
  reservations: "reservations",
  kitchen: "kitchen",
  pos: "pos",
  inventory: "inventory",
  staff: "staff",
  notifications: "notifications",
  developerApis: "developer-apis",
} as const;

export type AnalyticsIntegrationPoint =
  (typeof ANALYTICS_INTEGRATION_POINTS)[keyof typeof ANALYTICS_INTEGRATION_POINTS];
