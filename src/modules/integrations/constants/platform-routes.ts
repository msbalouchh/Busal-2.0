/** Architecture route markers for the Integration platform. */
export const INTEGRATION_PLATFORM_ROUTES = {
  overview: "/app/integrations",
  providers: "/app/integrations/providers",
  connections: "/app/integrations/connections",
  apiKeys: "/app/developer/keys",
  webhooks: "/app/integrations/webhooks",
  oauth: "/app/integrations/providers",
  syncJobs: "/app/integrations/sync",
  developer: "/app/developer",
  logs: "/app/integrations/logs",
  analytics: "/app/integrations/health",
} as const;

export const INTEGRATION_PLATFORM_NAV_ITEMS = [
  { label: "Overview", href: INTEGRATION_PLATFORM_ROUTES.overview },
  { label: "Providers", href: INTEGRATION_PLATFORM_ROUTES.providers },
  { label: "Connections", href: INTEGRATION_PLATFORM_ROUTES.connections },
  { label: "API Keys", href: INTEGRATION_PLATFORM_ROUTES.apiKeys },
  { label: "Webhooks", href: INTEGRATION_PLATFORM_ROUTES.webhooks },
  { label: "OAuth", href: INTEGRATION_PLATFORM_ROUTES.oauth },
  { label: "Sync Jobs", href: INTEGRATION_PLATFORM_ROUTES.syncJobs },
  { label: "Developer", href: INTEGRATION_PLATFORM_ROUTES.developer },
  { label: "Logs", href: INTEGRATION_PLATFORM_ROUTES.logs },
  { label: "Analytics", href: INTEGRATION_PLATFORM_ROUTES.analytics },
] as const;
