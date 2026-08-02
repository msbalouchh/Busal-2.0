import type { IntegrationCategory, IntegrationStatus } from "@prisma/client";

export const INTEGRATION_PLATFORM_ROUTES = {
  dashboard: () => `/app/integrations`,
  providers: () => `/app/integrations/providers`,
  connections: () => `/app/integrations/connections`,
  connectionNew: () => `/app/integrations/connections/new`,
  connectionDetail: (connectionId: string) => `/app/integrations/connections/${connectionId}`,
  webhooks: () => `/app/integrations/webhooks`,
  sync: () => `/app/integrations/sync`,
  logs: () => `/app/integrations/logs`,
  health: () => `/app/integrations/health`,
  search: () => `/app/integrations/search`,
} as const;

export const INTEGRATION_STATUS_OPTIONS: Array<{
  value: IntegrationStatus | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ERROR", label: "Error" },
  { value: "DISCONNECTED", label: "Disconnected" },
];

export const INTEGRATION_CATEGORY_OPTIONS: Array<{
  value: IntegrationCategory | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "All categories" },
  { value: "PAYMENT", label: "Payment" },
  { value: "MESSAGING", label: "Messaging" },
  { value: "EMAIL", label: "Email" },
  { value: "ACCOUNTING", label: "Accounting" },
  { value: "ECOMMERCE", label: "E-commerce" },
  { value: "MARKETING", label: "Marketing" },
  { value: "AUTOMATION", label: "Automation" },
  { value: "COMMUNICATION", label: "Communication" },
  { value: "CRM", label: "CRM" },
  { value: "PRODUCTIVITY", label: "Productivity" },
  { value: "OTHER", label: "Other" },
];

export const INTEGRATION_PLATFORM_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: INTEGRATION_PLATFORM_ROUTES.dashboard() },
  { id: "providers", label: "Providers", href: INTEGRATION_PLATFORM_ROUTES.providers() },
  { id: "connections", label: "Connections", href: INTEGRATION_PLATFORM_ROUTES.connections() },
  { id: "webhooks", label: "Webhooks", href: INTEGRATION_PLATFORM_ROUTES.webhooks() },
  { id: "sync", label: "Sync", href: INTEGRATION_PLATFORM_ROUTES.sync() },
  { id: "logs", label: "Logs", href: INTEGRATION_PLATFORM_ROUTES.logs() },
  { id: "health", label: "Health", href: INTEGRATION_PLATFORM_ROUTES.health() },
  { id: "search", label: "Search", href: INTEGRATION_PLATFORM_ROUTES.search() },
] as const;
