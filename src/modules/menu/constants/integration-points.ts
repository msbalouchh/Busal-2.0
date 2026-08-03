/**
 * Future integration points for the Enterprise Menu Management Platform.
 * Architecture markers only — no runtime wiring.
 */
export const MENU_INTEGRATION_POINTS = {
  prisma: "prisma",
  supabase: "supabase",
  aiCore: "ai-core",
  aiToolsPlatform: "ai-tools-platform",
  rbac: "rbac",
  tenantFoundation: "tenant-foundation",
  orders: "orders",
  pos: "pos",
  qrOrdering: "qr-ordering",
  kitchen: "kitchen",
  delivery: "delivery",
  inventory: "inventory",
  analytics: "analytics",
  mediaPlatform: "media-platform",
} as const;

export type MenuIntegrationPoint =
  (typeof MENU_INTEGRATION_POINTS)[keyof typeof MENU_INTEGRATION_POINTS];
