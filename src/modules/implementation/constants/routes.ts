export const IMPLEMENTATION_ROUTES = {
  overview: "/dashboard/implementation",
  projects: "/dashboard/implementation/projects",
  templates: "/dashboard/implementation/templates",
  milestones: "/dashboard/implementation/milestones",
  tasks: "/dashboard/implementation/tasks",
  risks: "/dashboard/implementation/risks",
  issues: "/dashboard/implementation/issues",
  changeRequests: "/dashboard/implementation/change-requests",
  goLive: "/dashboard/implementation/go-live",
  hypercare: "/dashboard/implementation/hypercare",
} as const;

export const IMPLEMENTATION_NAV_ITEMS = [
  { label: "Dashboard", href: IMPLEMENTATION_ROUTES.overview },
  { label: "Projects", href: IMPLEMENTATION_ROUTES.projects },
  { label: "Templates", href: IMPLEMENTATION_ROUTES.templates },
  { label: "Milestones", href: IMPLEMENTATION_ROUTES.milestones },
  { label: "Tasks", href: IMPLEMENTATION_ROUTES.tasks },
  { label: "Risks", href: IMPLEMENTATION_ROUTES.risks },
  { label: "Issues", href: IMPLEMENTATION_ROUTES.issues },
  { label: "Change Requests", href: IMPLEMENTATION_ROUTES.changeRequests },
  { label: "Go-Live", href: IMPLEMENTATION_ROUTES.goLive },
  { label: "Hypercare", href: IMPLEMENTATION_ROUTES.hypercare },
] as const;

export const IMPLEMENTATION_STATUS_LABELS = {
  PLANNED: "Planned",
  IN_PROGRESS: "In progress",
  LIVE: "Live",
  HYPERCARE: "Hypercare",
  COMPLETED: "Completed",
  ON_HOLD: "On hold",
  CLOSED: "Closed",
} as const;

export const IMPLEMENTATION_TASK_STATUS_LABELS = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  BLOCKED: "Blocked",
  CANCELLED: "Cancelled",
} as const;

export const IMPLEMENTATION_RISK_SEVERITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
} as const;

export const IMPLEMENTATION_PORTAL_ROUTE = "/implementation" as const;
