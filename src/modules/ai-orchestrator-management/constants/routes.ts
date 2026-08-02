import type { WorkflowStatus } from "@prisma/client";

export const AI_ORCHESTRATOR_ROUTES = {
  dashboard: () => `/app/ai/orchestrator`,
  list: () => `/app/ai/orchestrator/workflows`,
  builder: () => `/app/ai/orchestrator/builder`,
  search: () => `/app/ai/orchestrator/search`,
  executions: () => `/app/ai/orchestrator/executions`,
  monitor: () => `/app/ai/orchestrator/monitor`,
  timeline: () => `/app/ai/orchestrator/timeline`,
  workflow: (workflowId: string) => `/app/ai/orchestrator/workflows/${workflowId}`,
  execution: (executionId: string) => `/app/ai/orchestrator/executions?executionId=${executionId}`,
} as const;

export const WORKFLOW_STATUS_OPTIONS: Array<{ value: WorkflowStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "DISABLED", label: "Disabled" },
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
];

export const ORCHESTRATOR_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: AI_ORCHESTRATOR_ROUTES.dashboard() },
  { id: "workflows", label: "Workflows", href: AI_ORCHESTRATOR_ROUTES.list() },
  { id: "builder", label: "Builder", href: AI_ORCHESTRATOR_ROUTES.builder() },
  { id: "monitor", label: "Monitor", href: AI_ORCHESTRATOR_ROUTES.monitor() },
  { id: "executions", label: "Executions", href: AI_ORCHESTRATOR_ROUTES.executions() },
  { id: "timeline", label: "Timeline", href: AI_ORCHESTRATOR_ROUTES.timeline() },
  { id: "search", label: "Search", href: AI_ORCHESTRATOR_ROUTES.search() },
] as const;
