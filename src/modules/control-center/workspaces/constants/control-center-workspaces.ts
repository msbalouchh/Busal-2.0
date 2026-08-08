export const CONTROL_CENTER_WORKSPACE_ROUTES = {
  directory: "/control-center/workspaces",
  detail: (workspaceId: string) => `/control-center/workspaces/${workspaceId}`,
} as const;

export const CONTROL_CENTER_WORKSPACE_PAGE_SIZE = 20;

export const WORKSPACE_STATUS_FILTER_OPTIONS = ["active", "provisioning", "archived"] as const;

export const WORKSPACE_LIFECYCLE_FILTER_OPTIONS = [
  "ACTIVE",
  "SUSPENDED",
  "ARCHIVED",
  "PENDING",
  "DELETED",
] as const;

export const WORKSPACE_HEALTH_FILTER_OPTIONS = ["HEALTHY", "DEGRADED", "CRITICAL"] as const;

export const WORKSPACE_SORT_OPTIONS = [
  "createdAt",
  "workspaceName",
  "lastActivity",
  "branchCount",
  "userCount",
  "status",
] as const;

export const WORKSPACE_PLAN_FILTER_OPTIONS = ["free", "starter", "growth", "enterprise"] as const;
