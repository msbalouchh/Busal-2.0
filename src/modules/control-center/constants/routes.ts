export const CONTROL_CENTER_ROUTES = {
  overview: "/control-center",
  tenants: "/control-center/tenants",
  subscriptions: "/control-center/subscriptions",
  revenue: "/control-center/revenue",
  marketplace: "/control-center/marketplace",
  aiPlatform: "/control-center/ai-platform",
  monitoring: "/control-center/monitoring",
  support: "/control-center/support",
  incidents: "/control-center/incidents",
  audit: "/control-center/audit-logs",
  settings: "/control-center/platform-settings",
  maintenance: "/control-center/system-maintenance",
  releases: "/control-center/release-management",
  staff: "/control-center/staff",
  analytics: "/control-center/analytics",
  featureFlags: "/control-center/feature-flags",
  unauthorized: "/control-center/unauthorized",
} as const;

export const CONTROL_CENTER_ENVIRONMENT =
  process.env.BUSAL_ENVIRONMENT ?? process.env.NODE_ENV ?? "development";

export const CONTROL_CENTER_OPERATOR_ENV_KEY = "BUSAL_CONTROL_CENTER_OPERATORS";
