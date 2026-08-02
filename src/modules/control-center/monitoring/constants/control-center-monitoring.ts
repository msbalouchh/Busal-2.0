export const CONTROL_CENTER_MONITORING_ROUTES = {
  overview: "/control-center/monitoring",
} as const;

export const CONTROL_CENTER_MONITORING_PAGE_SIZE = 25;

export const CONTROL_CENTER_MONITORING_REFRESH_MS = 30_000;

export const PLATFORM_SERVICE_TARGETS = [
  { key: "api-gateway", name: "API Gateway", checkKey: "api.gateway", category: "API" },
  { key: "authentication", name: "Authentication", checkKey: "platform.core", category: "API" },
  { key: "database", name: "Database", checkKey: "database.primary", category: "DATABASE" },
  { key: "ai-platform", name: "AI Platform", checkKey: "ai.platform", category: "AI" },
  { key: "marketplace", name: "Marketplace", checkKey: "platform.core", category: "SERVICE" },
  {
    key: "notification-hub",
    name: "Notification Hub",
    checkKey: "platform.core",
    category: "SERVICE",
  },
  { key: "file-platform", name: "File Platform", checkKey: "storage.files", category: "STORAGE" },
  { key: "search", name: "Search", checkKey: "cache.redis", category: "CACHE" },
  { key: "billing", name: "Billing", checkKey: "platform.core", category: "SERVICE" },
  {
    key: "background-jobs",
    name: "Background Jobs",
    checkKey: "worker.background",
    category: "WORKER",
  },
] as const;

export const LOG_LEVEL_OPTIONS = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] as const;

export const ALERT_STATUS_OPTIONS = ["OPEN", "ACKNOWLEDGED", "RESOLVED"] as const;
