/**
 * Future integration points for the Enterprise Order Management System.
 * Architecture markers only — no runtime wiring.
 */
export const OMS_INTEGRATION_POINTS = {
  prisma: "prisma",
  supabase: "supabase",
  aiCore: "ai-core",
  aiToolsPlatform: "ai-tools-platform",
  rbac: "rbac",
  tenantFoundation: "tenant-foundation",
  crm: "crm",
  pos: "pos",
  kitchen: "kitchen",
  payments: "payments",
  delivery: "delivery",
  inventory: "inventory",
  finance: "finance",
  notifications: "notifications",
  qrOrdering: "qr-ordering",
} as const;

export type OmsIntegrationPoint =
  (typeof OMS_INTEGRATION_POINTS)[keyof typeof OMS_INTEGRATION_POINTS];
