/** Architecture route markers for the Integration platform. */
export const INTEGRATION_PLATFORM_ROUTES = {
  overview: "/app/settings/integrations",
  providers: "/app/settings/integrations/providers",
  connections: "/app/settings/integrations/connections",
  apiKeys: "/app/settings/integrations/api-keys",
  webhooks: "/app/settings/integrations/webhooks",
  oauth: "/app/settings/integrations/oauth",
  syncJobs: "/app/settings/integrations/sync",
  developer: "/app/settings/integrations/developer",
  logs: "/app/settings/integrations/logs",
  analytics: "/app/settings/integrations/analytics",
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
