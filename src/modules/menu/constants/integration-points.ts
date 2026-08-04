/**
 * Production integration points for the Menu Management Platform.
 */
export const MENU_INTEGRATION_POINTS = {
  prisma: "prisma",
  supabase: "supabase",
  aiCore: "ai-core",
  aiToolsPlatform: "ai-tools-platform",
  rbac: "rbac",
  tenantFoundation: "tenant-foundation",
  pos: "pos",
  kitchen: "kitchen",
  inventory: "inventory",
  analytics: "analytics",
  orders: "orders",
} as const;

export type MenuIntegrationPoint =
  (typeof MENU_INTEGRATION_POINTS)[keyof typeof MENU_INTEGRATION_POINTS];

export const MENU_INTEGRATION_STATUS = {
  prisma: "connected",
  supabase: "connected",
  aiCore: "connected",
  aiToolsPlatform: "connected",
  rbac: "connected",
  tenantFoundation: "connected",
  pos: "partial",
  kitchen: "partial",
  inventory: "partial",
  analytics: "partial",
  orders: "connected",
} as const;
