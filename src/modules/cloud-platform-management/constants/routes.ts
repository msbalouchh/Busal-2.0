export const CLOUD_PLATFORM_ROUTES = {
  dashboard: () => `/app/cloud`,
  tenants: () => `/app/cloud/tenants`,
  subscriptions: () => `/app/cloud/subscriptions`,
  plans: () => `/app/cloud/plans`,
  featureFlags: () => `/app/cloud/feature-flags`,
  usage: () => `/app/cloud/usage`,
  quotas: () => `/app/cloud/quotas`,
  licensing: () => `/app/cloud/licensing`,
  settings: () => `/app/cloud/settings`,
} as const;

export const CLOUD_PLATFORM_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: CLOUD_PLATFORM_ROUTES.dashboard() },
  { id: "tenants", label: "Tenants", href: CLOUD_PLATFORM_ROUTES.tenants() },
  { id: "subscriptions", label: "Subscriptions", href: CLOUD_PLATFORM_ROUTES.subscriptions() },
  { id: "plans", label: "Plans", href: CLOUD_PLATFORM_ROUTES.plans() },
  { id: "flags", label: "Feature Flags", href: CLOUD_PLATFORM_ROUTES.featureFlags() },
  { id: "usage", label: "Usage", href: CLOUD_PLATFORM_ROUTES.usage() },
  { id: "quotas", label: "Quotas", href: CLOUD_PLATFORM_ROUTES.quotas() },
  { id: "licensing", label: "Licensing", href: CLOUD_PLATFORM_ROUTES.licensing() },
  { id: "settings", label: "Settings", href: CLOUD_PLATFORM_ROUTES.settings() },
] as const;
