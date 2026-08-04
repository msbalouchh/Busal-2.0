/**
 * Production integration points for the Enterprise CRM Platform.
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

export const CRM_INTEGRATION_STATUS = {
  prisma: "connected",
  supabase: "connected",
  aiCore: "connected",
  aiToolsPlatform: "connected",
  rbac: "connected",
  tenantFoundation: "connected",
  marketing: "partial",
  reservations: "connected",
  pos: "connected",
  finance: "partial",
  notifications: "partial",
  loyalty: "connected",
  wallet: "partial",
} as const;
