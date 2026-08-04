/**
 * Future integration points for the Enterprise Staff Management Platform.
 * Architecture markers only — no runtime wiring.
 */
export const STAFF_INTEGRATION_POINTS = {
  prisma: "prisma",
  supabase: "supabase",
  aiCore: "ai-core",
  aiToolsPlatform: "ai-tools-platform",
  rbac: "rbac",
  tenantFoundation: "tenant-foundation",
  pos: "pos",
  kitchen: "kitchen",
  reservations: "reservations",
  crm: "crm",
  inventory: "inventory",
  finance: "finance",
  analytics: "analytics",
  notifications: "notifications",
  billing: "billing",
  developerApis: "developer-apis",
} as const;

export type StaffIntegrationPoint =
  (typeof STAFF_INTEGRATION_POINTS)[keyof typeof STAFF_INTEGRATION_POINTS];
