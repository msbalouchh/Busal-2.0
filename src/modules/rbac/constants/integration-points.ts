/**
 * Declared future integration points for the RBAC foundation.
 * Architecture markers only — no runtime wiring.
 */
export const RBAC_INTEGRATION_POINTS = {
  prisma: "prisma",
  supabase: "supabase",
  organizations: "organizations",
  staffModule: "staff-module",
  billing: "billing",
  crm: "crm",
  pos: "pos",
  kitchen: "kitchen",
  inventory: "inventory",
  marketing: "marketing",
  finance: "finance",
  reports: "reports",
  aiAgents: "ai-agents",
  developerPlatform: "developer-platform",
  tenantFoundation: "tenant-foundation",
  authorizationModule: "authorization-module",
  iamEngine: "iam-engine",
} as const;

export type RbacIntegrationPoint =
  (typeof RBAC_INTEGRATION_POINTS)[keyof typeof RBAC_INTEGRATION_POINTS];
