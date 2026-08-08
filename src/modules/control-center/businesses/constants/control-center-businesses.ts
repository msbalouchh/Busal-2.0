export const CONTROL_CENTER_BUSINESS_ROUTES = {
  directory: "/control-center/businesses",
  detail: (businessId: string) => `/control-center/businesses/${businessId}`,
} as const;

export const CONTROL_CENTER_BUSINESS_PAGE_SIZE = 20;

export const BUSINESS_STATUS_FILTER_OPTIONS = [
  "ACTIVE",
  "SUSPENDED",
  "ARCHIVED",
  "PENDING",
  "DELETED",
] as const;

export const BUSINESS_HEALTH_FILTER_OPTIONS = ["HEALTHY", "DEGRADED", "CRITICAL"] as const;

export const BUSINESS_SORT_OPTIONS = [
  "createdAt",
  "businessName",
  "lastActivity",
  "branchCount",
  "staffCount",
  "status",
] as const;

export const BUSINESS_PLAN_FILTER_OPTIONS = ["free", "starter", "growth", "enterprise"] as const;

export const BUSINESS_TYPE_FILTER_OPTIONS = [
  "RESTAURANT",
  "CAFE",
  "RETAIL",
  "HOTEL",
  "SERVICES",
  "OTHER",
] as const;

export const BUSINESS_CSV_HEADERS = [
  "Business ID",
  "Business Name",
  "Business Code",
  "Owner Email",
  "Status",
  "Health",
  "Plan",
  "Branches",
  "Staff",
  "MRR (pence)",
  "AI Tokens",
  "Storage (bytes)",
  "Country",
  "Created At",
  "Last Activity",
] as const;
