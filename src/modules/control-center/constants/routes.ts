export const CONTROL_CENTER_ROUTES = {
  overview: "/control-center",
  tenants: "/control-center/tenants",
  businesses: "/control-center/businesses",
  workspaces: "/control-center/workspaces",
  subscriptions: "/control-center/subscriptions",
  revenue: "/control-center/revenue",
  marketplace: "/control-center/marketplace",
  ai: "/control-center/ai",
  aiPlatform: "/control-center/ai-platform",
  monitoring: "/control-center/monitoring",
  support: "/control-center/support",
  incidents: "/control-center/incidents",
  audit: "/control-center/audit-logs",
  settings: "/control-center/platform-settings",
  platformSettings: "/control-center/settings",
  maintenance: "/control-center/system-maintenance",
  releases: "/control-center/release-management",
  staff: "/control-center/staff",
  analytics: "/control-center/analytics",
  featureFlags: "/control-center/feature-flags",
  features: "/control-center/features",
  intelligence: "/control-center/intelligence",
  ceo: "/control-center/ceo",
  security: "/control-center/security",
  operators: "/control-center/operators",
  automation: "/control-center/automation",
  unauthorized: "/control-center/unauthorized",
} as const;

export const CONTROL_CENTER_ENVIRONMENT =
  process.env.BUSAL_ENVIRONMENT ?? process.env.NODE_ENV ?? "development";

export const CONTROL_CENTER_OPERATOR_ENV_KEY = "BUSAL_CONTROL_CENTER_OPERATORS";
