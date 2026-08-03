/**
 * Future integration points for the Enterprise CRM Platform.
 * Architecture markers only — no runtime wiring.
 */
export const CRM_INTEGRATION_POINTS = {
  prisma: "prisma",
  supabase: "supabase",
  aiCore: "ai-core",
  aiToolsPlatform: "ai-tools-platform",
  rbac: "rbac",
  tenantFoundation: "tenant-foundation",
  marketing: "marketing",
  reservations: "reservations",
  pos: "pos",
  finance: "finance",
  notifications: "notifications",
  loyalty: "loyalty",
  wallet: "wallet",
} as const;

export type CrmIntegrationPoint =
  (typeof CRM_INTEGRATION_POINTS)[keyof typeof CRM_INTEGRATION_POINTS];
