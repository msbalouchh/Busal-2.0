export const API_GATEWAY_ROUTES = {
  overview: "/dashboard/api-gateway",
  routes: "/dashboard/api-gateway/routes",
  registry: "/dashboard/api-gateway/registry",
  rateLimits: "/dashboard/api-gateway/rate-limits",
  webhooks: "/dashboard/api-gateway/webhooks",
  monitoring: "/dashboard/api-gateway/monitoring",
  audit: "/dashboard/api-gateway/audit",
  openapi: "/dashboard/api-gateway/openapi",
} as const;

export const API_GATEWAY_NAV_ITEMS = [
  { label: "Overview", href: API_GATEWAY_ROUTES.overview },
  { label: "Routes", href: API_GATEWAY_ROUTES.routes },
  { label: "Registry", href: API_GATEWAY_ROUTES.registry },
  { label: "Rate Limits", href: API_GATEWAY_ROUTES.rateLimits },
  { label: "Webhooks", href: API_GATEWAY_ROUTES.webhooks },
  { label: "Monitoring", href: API_GATEWAY_ROUTES.monitoring },
  { label: "OpenAPI", href: API_GATEWAY_ROUTES.openapi },
  { label: "Audit", href: API_GATEWAY_ROUTES.audit },
] as const;

export const API_ROUTE_TYPES = [
  "INTERNAL",
  "PUBLIC",
  "PARTNER",
  "MARKETPLACE",
  "AI",
  "WEBHOOK",
] as const;

export const API_AUTH_METHODS = ["JWT", "OAUTH2", "API_KEY", "SERVICE_ACCOUNT"] as const;

export const API_VERSION_STRATEGIES = ["URI", "HEADER"] as const;

export const API_RATE_LIMIT_SCOPES = [
  "API_KEY",
  "USER",
  "BUSINESS",
  "IP",
  "SERVICE_ACCOUNT",
] as const;

export const DEFAULT_MAX_PAYLOAD_BYTES = 1048576;

export const DEFAULT_RATE_LIMIT_RPM = 60;

export const DEFAULT_BURST_LIMIT = 10;
