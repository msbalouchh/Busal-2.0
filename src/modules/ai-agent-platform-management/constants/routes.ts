export const AI_AGENT_PLATFORM_ROUTES = {
  dashboard: () => `/app/ai/agents`,
  agent: (agentId: string) => `/app/ai/agents/${agentId}`,
  agentConfig: (agentId: string) => `/app/ai/agents/${agentId}/config`,
  executions: (agentId?: string) =>
    agentId ? `/app/ai/agents/executions?agentId=${agentId}` : `/app/ai/agents/executions`,
  newAgent: () => `/app/ai/agents/new`,
} as const;

export const AGENT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "DISABLED", label: "Disabled" },
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

export const AGENT_CATEGORY_OPTIONS = [
  { value: "BUSINESS", label: "Business" },
  { value: "OPERATIONS", label: "Operations" },
  { value: "SUPPORT", label: "Support" },
  { value: "MARKETING", label: "Marketing" },
  { value: "FINANCE", label: "Finance" },
  { value: "CUSTOM", label: "Custom" },
] as const;

export const PLATFORM_NAV_ITEMS = [
  { href: AI_AGENT_PLATFORM_ROUTES.dashboard(), label: "Agents" },
  { href: AI_AGENT_PLATFORM_ROUTES.executions(), label: "Executions" },
] as const;
