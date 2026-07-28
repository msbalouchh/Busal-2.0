export const AI_AGENTS_ROUTES = {
  overview: "/dashboard/ai-agents",
  registry: "/dashboard/ai-agents/registry",
  templates: "/dashboard/ai-agents/templates",
  skills: "/dashboard/ai-agents/skills",
  executions: "/dashboard/ai-agents/executions",
  delegations: "/dashboard/ai-agents/delegations",
  memory: "/dashboard/ai-agents/memory",
  monitoring: "/dashboard/ai-agents/monitoring",
} as const;

export const AI_AGENTS_NAV_ITEMS = [
  { label: "Overview", href: AI_AGENTS_ROUTES.overview },
  { label: "Agents", href: AI_AGENTS_ROUTES.registry },
  { label: "Templates", href: AI_AGENTS_ROUTES.templates },
  { label: "Skills", href: AI_AGENTS_ROUTES.skills },
  { label: "Executions", href: AI_AGENTS_ROUTES.executions },
  { label: "Delegations", href: AI_AGENTS_ROUTES.delegations },
  { label: "Memory", href: AI_AGENTS_ROUTES.memory },
  { label: "Monitoring", href: AI_AGENTS_ROUTES.monitoring },
] as const;

export const AI_AGENT_DEPARTMENTS = [
  "Executive",
  "Sales",
  "Finance",
  "Marketing",
  "Support",
  "Operations",
  "Restaurant",
  "Technology",
] as const;

export const DEFAULT_AGENT_MEMORY_SETTINGS = {
  shortTermTtlHours: 24,
  longTermRetentionDays: 365,
  maxConversationEntries: 100,
  maxTaskEntries: 200,
} as const;
