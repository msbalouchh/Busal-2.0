export const AI_AUTOMATION_ROUTES = {
  overview: "/dashboard/ai-automation",
  workflows: "/dashboard/ai-automation/workflows",
  templates: "/dashboard/ai-automation/templates",
  executions: "/dashboard/ai-automation/executions",
  approvals: "/dashboard/ai-automation/approvals",
  events: "/dashboard/ai-automation/events",
  monitoring: "/dashboard/ai-automation/monitoring",
} as const;

export const AI_AUTOMATION_NAV_ITEMS = [
  { label: "Overview", href: AI_AUTOMATION_ROUTES.overview },
  { label: "Workflows", href: AI_AUTOMATION_ROUTES.workflows },
  { label: "Templates", href: AI_AUTOMATION_ROUTES.templates },
  { label: "Executions", href: AI_AUTOMATION_ROUTES.executions },
  { label: "Approvals", href: AI_AUTOMATION_ROUTES.approvals },
  { label: "Events", href: AI_AUTOMATION_ROUTES.events },
  { label: "Monitoring", href: AI_AUTOMATION_ROUTES.monitoring },
] as const;

export const AUTOMATION_EVENT_CATEGORIES = [
  "BUSINESS",
  "STAFF",
  "CUSTOMER",
  "ORDER",
  "RESERVATION",
  "INVENTORY",
  "POS",
  "COMMERCIAL",
  "REVENUE",
  "CONTRACT",
  "IMPLEMENTATION",
  "MARKETING",
  "AI",
  "SYSTEM",
] as const;

export const DEFAULT_AUTOMATION_RETRY_POLICY = {
  maxRetries: 2,
  backoffMs: 1000,
  timeoutMs: 60_000,
} as const;
