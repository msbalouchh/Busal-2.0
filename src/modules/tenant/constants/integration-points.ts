/**
 * Declared future integration points for the tenant foundation.
 * Architecture markers only — no runtime wiring.
 */
export const TENANT_INTEGRATION_POINTS = {
  prisma: "prisma",
  supabase: "supabase",
  rbac: "rbac",
  billing: "billing",
  aiAgents: "ai-agents",
  crm: "crm",
  pos: "pos",
  inventory: "inventory",
  reservations: "reservations",
  marketing: "marketing",
  finance: "finance",
  authentication: "authentication",
  businessProvisioning: "business-provisioning",
  workspaceShell: "workspace-shell",
} as const;

export type TenantIntegrationPoint =
  (typeof TENANT_INTEGRATION_POINTS)[keyof typeof TENANT_INTEGRATION_POINTS];
