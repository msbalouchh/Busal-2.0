/**
 * Future integration points for the AI Tool & Skill Platform.
 * Architecture markers only — no runtime wiring.
 */
export const AI_TOOLS_INTEGRATION_POINTS = {
  aiCore: "ai-core",
  rbac: "rbac",
  tenantFoundation: "tenant-foundation",
  prisma: "prisma",
  supabase: "supabase",
  crm: "crm",
  pos: "pos",
  reservations: "reservations",
  inventory: "inventory",
  finance: "finance",
  marketing: "marketing",
  analytics: "analytics",
  notifications: "notifications",
  openAi: "openai",
  anthropic: "anthropic",
  gemini: "gemini",
} as const;

export type AiToolsIntegrationPoint =
  (typeof AI_TOOLS_INTEGRATION_POINTS)[keyof typeof AI_TOOLS_INTEGRATION_POINTS];
