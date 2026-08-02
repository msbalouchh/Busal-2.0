export const CONTROL_CENTER_SUPPORT_ROUTES = {
  overview: "/control-center/support",
  incidents: "/control-center/incidents",
} as const;

export const CONTROL_CENTER_SUPPORT_PAGE_SIZE = 25;

export const TICKET_STATUS_OPTIONS = [
  "OPEN",
  "WAITING_CUSTOMER",
  "WAITING_STAFF",
  "AI_HANDLED",
  "CLOSED",
] as const;

export const TICKET_PRIORITY_OPTIONS = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export const TICKET_CATEGORY_OPTIONS = [
  "BILLING",
  "TECHNICAL",
  "ACCOUNT",
  "MARKETPLACE",
  "AI",
  "GENERAL",
] as const;

export const INCIDENT_SEVERITY_OPTIONS = [
  "EXCEPTION",
  "API_ERROR",
  "DATABASE_ERROR",
  "QUEUE_FAILURE",
  "JOB_FAILURE",
  "INTEGRATION_FAILURE",
  "AI_FAILURE",
  "NOTIFICATION_FAILURE",
] as const;

export const KNOWLEDGE_ARTICLE_STATUS_OPTIONS = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export const SUPPORT_KANBAN_COLUMNS = [
  { key: "OPEN", label: "Open" },
  { key: "WAITING_STAFF", label: "Pending" },
  { key: "WAITING_CUSTOMER", label: "Awaiting Customer" },
  { key: "AI_HANDLED", label: "Escalated" },
  { key: "CLOSED", label: "Resolved" },
] as const;
