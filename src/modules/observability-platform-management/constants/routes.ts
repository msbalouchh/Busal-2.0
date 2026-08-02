export const OBSERVABILITY_PLATFORM_ROUTES = {
  dashboard: () => `/app/observability`,
  metrics: () => `/app/observability/metrics`,
  logs: () => `/app/observability/logs`,
  incidents: () => `/app/observability/incidents`,
  alerts: () => `/app/observability/alerts`,
  health: () => `/app/observability/health`,
  performance: () => `/app/observability/performance`,
  traces: () => `/app/observability/traces`,
  audit: () => `/app/observability/audit`,
  search: () => `/app/observability/search`,
} as const;

export const OBSERVABILITY_PLATFORM_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: OBSERVABILITY_PLATFORM_ROUTES.dashboard() },
  { id: "metrics", label: "Metrics", href: OBSERVABILITY_PLATFORM_ROUTES.metrics() },
  { id: "logs", label: "Logs", href: OBSERVABILITY_PLATFORM_ROUTES.logs() },
  { id: "incidents", label: "Incidents", href: OBSERVABILITY_PLATFORM_ROUTES.incidents() },
  { id: "alerts", label: "Alerts", href: OBSERVABILITY_PLATFORM_ROUTES.alerts() },
  { id: "health", label: "Health", href: OBSERVABILITY_PLATFORM_ROUTES.health() },
  { id: "performance", label: "Performance", href: OBSERVABILITY_PLATFORM_ROUTES.performance() },
  { id: "traces", label: "Traces", href: OBSERVABILITY_PLATFORM_ROUTES.traces() },
  { id: "audit", label: "Audit", href: OBSERVABILITY_PLATFORM_ROUTES.audit() },
  { id: "search", label: "Search", href: OBSERVABILITY_PLATFORM_ROUTES.search() },
] as const;

export const LOG_LEVEL_OPTIONS = [
  { value: "DEBUG", label: "Debug" },
  { value: "INFO", label: "Info" },
  { value: "WARNING", label: "Warning" },
  { value: "ERROR", label: "Error" },
  { value: "CRITICAL", label: "Critical" },
] as const;

export const SEVERITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
] as const;

export const INCIDENT_STATUS_OPTIONS = [
  { value: "OPEN", label: "Open" },
  { value: "INVESTIGATING", label: "Investigating" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
] as const;

export const ALERT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "ACKNOWLEDGED", label: "Acknowledged" },
  { value: "RESOLVED", label: "Resolved" },
] as const;
