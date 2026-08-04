/**
 * Future integration points for the Enterprise Billing & Subscription Platform.
 * Architecture markers only — no runtime wiring.
 */
export const BILLING_INTEGRATION_POINTS = {
  prisma: "prisma",
  supabase: "supabase",
  stripe: "stripe",
  aiCore: "ai-core",
  aiToolsPlatform: "ai-tools-platform",
  rbac: "rbac",
  tenantFoundation: "tenant-foundation",
  workspace: "workspace",
  businessProvisioning: "business-provisioning",
  finance: "finance",
  crm: "crm",
  analytics: "analytics",
  notifications: "notifications",
  developerApis: "developer-apis",
} as const;

export type BillingIntegrationPoint =
  (typeof BILLING_INTEGRATION_POINTS)[keyof typeof BILLING_INTEGRATION_POINTS];
