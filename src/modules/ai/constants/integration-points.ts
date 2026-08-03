/**
 * Declared future integration points for the AI Core Platform.
 * Architecture markers only — no runtime wiring.
 */
export const AI_INTEGRATION_POINTS = {
  openAi: "openai",
  anthropic: "anthropic",
  gemini: "gemini",
  prisma: "prisma",
  supabase: "supabase",
  rbac: "rbac",
  tenantFoundation: "tenant-foundation",
  workspaceShell: "workspace-shell",
  crm: "crm",
  pos: "pos",
  reservations: "reservations",
  inventory: "inventory",
  finance: "finance",
  marketing: "marketing",
  reports: "reports",
  notifications: "notifications",
  developerPlatform: "developer-platform",
  aiAgentPlatform: "ai-agent-platform-management",
  aiOrchestratorManagement: "ai-orchestrator-management",
  aiMemoryManagement: "ai-memory-management",
} as const;

export type AiIntegrationPoint = (typeof AI_INTEGRATION_POINTS)[keyof typeof AI_INTEGRATION_POINTS];
