import type {
  ExecutionStatus,
  PlatformAutomationTriggerType,
  PlatformWorkflowStatus,
} from "@prisma/client";

export const AUTOMATION_PLATFORM_ROUTES = {
  dashboard: () => `/app/automation`,
  workflows: () => `/app/automation/workflows`,
  workflowNew: () => `/app/automation/workflows/new`,
  workflowDetail: (workflowId: string) => `/app/automation/workflows/${workflowId}`,
  executions: () => `/app/automation/executions`,
  triggers: () => `/app/automation/triggers`,
  actions: () => `/app/automation/actions`,
  templates: () => `/app/automation/templates`,
  logs: () => `/app/automation/logs`,
  search: () => `/app/automation/search`,
} as const;

export const AUTOMATION_PLATFORM_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: AUTOMATION_PLATFORM_ROUTES.dashboard() },
  { id: "workflows", label: "Workflows", href: AUTOMATION_PLATFORM_ROUTES.workflows() },
  { id: "executions", label: "Executions", href: AUTOMATION_PLATFORM_ROUTES.executions() },
  { id: "triggers", label: "Triggers", href: AUTOMATION_PLATFORM_ROUTES.triggers() },
  { id: "actions", label: "Actions", href: AUTOMATION_PLATFORM_ROUTES.actions() },
  { id: "templates", label: "Templates", href: AUTOMATION_PLATFORM_ROUTES.templates() },
  { id: "logs", label: "Logs", href: AUTOMATION_PLATFORM_ROUTES.logs() },
  { id: "search", label: "Search", href: AUTOMATION_PLATFORM_ROUTES.search() },
] as const;

export const WORKFLOW_STATUS_OPTIONS: Array<{
  value: PlatformWorkflowStatus | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "ARCHIVED", label: "Archived" },
];

export const EXECUTION_STATUS_OPTIONS: Array<{ value: ExecutionStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "RUNNING", label: "Running" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const TRIGGER_TYPE_OPTIONS: Array<{ value: PlatformAutomationTriggerType; label: string }> =
  [
    { value: "EVENT", label: "Event" },
    { value: "SCHEDULE", label: "Schedule" },
    { value: "MANUAL", label: "Manual" },
    { value: "WEBHOOK", label: "Webhook" },
    { value: "API", label: "API" },
  ];
