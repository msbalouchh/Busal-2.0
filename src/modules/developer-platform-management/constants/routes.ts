export const DEVELOPER_PLATFORM_ROUTES = {
  dashboard: () => `/app/developer`,
  applications: () => `/app/developer/applications`,
  keys: () => `/app/developer/keys`,
  webhooks: () => `/app/developer/webhooks`,
  explorer: () => `/app/developer/explorer`,
  analytics: () => `/app/developer/analytics`,
  logs: () => `/app/developer/logs`,
  settings: () => `/app/developer/settings`,
  docs: () => `/app/developer/docs`,
  search: () => `/app/developer/search`,
} as const;

export const DEVELOPER_PLATFORM_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: DEVELOPER_PLATFORM_ROUTES.dashboard() },
  { id: "applications", label: "Applications", href: DEVELOPER_PLATFORM_ROUTES.applications() },
  { id: "keys", label: "API Keys", href: DEVELOPER_PLATFORM_ROUTES.keys() },
  { id: "docs", label: "API Docs", href: DEVELOPER_PLATFORM_ROUTES.docs() },
  { id: "webhooks", label: "Webhooks", href: DEVELOPER_PLATFORM_ROUTES.webhooks() },
  { id: "explorer", label: "API Explorer", href: DEVELOPER_PLATFORM_ROUTES.explorer() },
  { id: "analytics", label: "Analytics", href: DEVELOPER_PLATFORM_ROUTES.analytics() },
  { id: "logs", label: "Request Logs", href: DEVELOPER_PLATFORM_ROUTES.logs() },
  { id: "settings", label: "Settings", href: DEVELOPER_PLATFORM_ROUTES.settings() },
  { id: "search", label: "Search", href: DEVELOPER_PLATFORM_ROUTES.search() },
] as const;

export const WEBHOOK_EVENT_OPTIONS = [
  "order.created",
  "order.updated",
  "customer.created",
  "payment.completed",
  "document.created",
  "media.uploaded",
  "automation.executed",
  "communication.sent",
] as const;

export const API_VERSION_OPTIONS = [
  { value: "V1", label: "Version 1" },
  { value: "V2", label: "Version 2" },
] as const;
