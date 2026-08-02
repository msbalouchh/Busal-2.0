export const CONTROL_CENTER_TENANT_ROUTES = {
  directory: "/control-center/tenants",
  detail: (businessId: string) => `/control-center/tenants/${businessId}`,
} as const;

export const CONTROL_CENTER_TENANT_PAGE_SIZE = 20;

export const TENANT_LIFECYCLE_FILTER_OPTIONS = [
  "ACTIVE",
  "SUSPENDED",
  "ARCHIVED",
  "PENDING",
  "DELETED",
] as const;

export const TENANT_HEALTH_FILTER_OPTIONS = ["HEALTHY", "DEGRADED", "CRITICAL"] as const;

export const TENANT_SORT_OPTIONS = [
  "createdAt",
  "businessName",
  "lastActivity",
  "lifecycleStatus",
] as const;

export const TENANT_PLAN_FILTER_OPTIONS = ["free", "starter", "growth", "enterprise"] as const;

export const TENANT_MAINTENANCE_MODES = ["NONE", "READ_ONLY", "FULL_LOCK", "SCHEDULED"] as const;
