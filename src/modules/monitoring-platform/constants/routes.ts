export const MONITORING_PLATFORM_ROUTES = {
  overview: "/dashboard/monitoring-platform",
  health: "/dashboard/monitoring-platform/health",
  metrics: "/dashboard/monitoring-platform/metrics",
  performance: "/dashboard/monitoring-platform/performance",
  errors: "/dashboard/monitoring-platform/errors",
  logs: "/dashboard/monitoring-platform/logs",
  alerts: "/dashboard/monitoring-platform/alerts",
  retention: "/dashboard/monitoring-platform/retention",
  registry: "/dashboard/monitoring-platform/registry",
  audit: "/dashboard/monitoring-platform/audit",
} as const;

export const MONITORING_PLATFORM_NAV_ITEMS = [
  { label: "Overview", href: MONITORING_PLATFORM_ROUTES.overview },
  { label: "Health", href: MONITORING_PLATFORM_ROUTES.health },
  { label: "Metrics", href: MONITORING_PLATFORM_ROUTES.metrics },
  { label: "Performance", href: MONITORING_PLATFORM_ROUTES.performance },
  { label: "Errors", href: MONITORING_PLATFORM_ROUTES.errors },
  { label: "Logs", href: MONITORING_PLATFORM_ROUTES.logs },
  { label: "Alerts", href: MONITORING_PLATFORM_ROUTES.alerts },
  { label: "Retention", href: MONITORING_PLATFORM_ROUTES.retention },
  { label: "Registry", href: MONITORING_PLATFORM_ROUTES.registry },
  { label: "Audit", href: MONITORING_PLATFORM_ROUTES.audit },
] as const;

export const MONITORING_HEALTH_TARGET_TYPES = [
  "PLATFORM",
  "SERVICE",
  "DATABASE",
  "CACHE",
  "QUEUE",
  "STORAGE",
  "API",
  "AI",
  "WORKER",
] as const;

export const MONITORING_LOG_LEVELS = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] as const;

export const MONITORING_ALERT_TYPES = [
  "HIGH_CPU",
  "HIGH_MEMORY",
  "DATABASE_FAILURE",
  "API_FAILURE",
  "QUEUE_FAILURE",
  "FAILED_JOB",
  "STORAGE_ISSUE",
  "AI_FAILURE",
  "NOTIFICATION_FAILURE",
] as const;

export const MONITORING_ALERT_CHANNELS = ["EMAIL", "IN_APP", "WEBHOOK"] as const;

export const DEFAULT_LOG_RETENTION_DAYS = 30;

export const DEFAULT_METRICS_RETENTION_DAYS = 90;

export const DEFAULT_ALERT_HISTORY_DAYS = 180;

export const SLOW_REQUEST_THRESHOLD_MS = 1000;
