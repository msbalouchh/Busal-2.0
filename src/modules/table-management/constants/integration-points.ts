/**
 * Future integration points for the Enterprise Table Management Platform.
 * Architecture markers only — no runtime wiring.
 */
export const TABLE_MANAGEMENT_INTEGRATION_POINTS = {
  prisma: "prisma",
  supabase: "supabase",
  aiCore: "ai-core",
  aiToolsPlatform: "ai-tools-platform",
  rbac: "rbac",
  tenantFoundation: "tenant-foundation",
  reservations: "reservations",
  orders: "orders",
  pos: "pos",
  qrOrdering: "qr-ordering",
  floorTableManagement: "floor-table-management",
  realtime: "realtime",
  analytics: "analytics",
  notifications: "notifications",
} as const;

export type TableManagementIntegrationPoint =
  (typeof TABLE_MANAGEMENT_INTEGRATION_POINTS)[keyof typeof TABLE_MANAGEMENT_INTEGRATION_POINTS];
