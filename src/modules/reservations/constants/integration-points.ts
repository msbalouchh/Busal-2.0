/**
 * Future integration points for the Enterprise Reservation Management Platform.
 * Architecture markers only — no runtime wiring.
 */
export const RESERVATION_INTEGRATION_POINTS = {
  prisma: "prisma",
  supabase: "supabase",
  aiCore: "ai-core",
  aiToolsPlatform: "ai-tools-platform",
  rbac: "rbac",
  tenantFoundation: "tenant-foundation",
  crm: "crm",
  tableManagement: "table-management",
  orders: "orders",
  kitchenDisplay: "kitchen-display",
  pos: "pos",
  notifications: "notifications",
  marketing: "marketing",
  analytics: "analytics",
  billing: "billing",
  developerApis: "developer-apis",
} as const;

export type ReservationIntegrationPoint =
  (typeof RESERVATION_INTEGRATION_POINTS)[keyof typeof RESERVATION_INTEGRATION_POINTS];
