export const TENANT_PLATFORM_ROUTES = {
  overview: "/dashboard/tenant-platform",
  lifecycle: "/dashboard/tenant-platform/lifecycle",
  business: "/dashboard/tenant-platform/business",
  resources: "/dashboard/tenant-platform/resources",
  settings: "/dashboard/tenant-platform/settings",
  whiteLabel: "/dashboard/tenant-platform/white-label",
  health: "/dashboard/tenant-platform/health",
  security: "/dashboard/tenant-platform/security",
  analytics: "/dashboard/tenant-platform/analytics",
  activity: "/dashboard/tenant-platform/activity",
  audit: "/dashboard/tenant-platform/audit",
} as const;

export const TENANT_PLATFORM_NAV_ITEMS = [
  { label: "Overview", href: TENANT_PLATFORM_ROUTES.overview },
  { label: "Lifecycle", href: TENANT_PLATFORM_ROUTES.lifecycle },
  { label: "Business", href: TENANT_PLATFORM_ROUTES.business },
  { label: "Resources", href: TENANT_PLATFORM_ROUTES.resources },
  { label: "Settings", href: TENANT_PLATFORM_ROUTES.settings },
  { label: "White Label", href: TENANT_PLATFORM_ROUTES.whiteLabel },
  { label: "Health", href: TENANT_PLATFORM_ROUTES.health },
  { label: "Security", href: TENANT_PLATFORM_ROUTES.security },
  { label: "Analytics", href: TENANT_PLATFORM_ROUTES.analytics },
  { label: "Activity", href: TENANT_PLATFORM_ROUTES.activity },
  { label: "Audit", href: TENANT_PLATFORM_ROUTES.audit },
] as const;

export const DEFAULT_SUBSCRIPTION_PLANS = [
  "busal-core",
  "busal-growth",
  "busal-pro",
  "busal-enterprise",
] as const;

export const DEFAULT_TENANT_FEATURES = [
  "pos",
  "crm",
  "ai",
  "marketplace",
  "reporting",
  "api_gateway",
] as const;

export const COMPLIANCE_MODES = ["standard", "gdpr", "hipaa", "pci"] as const;
