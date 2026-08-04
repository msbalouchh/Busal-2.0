/** Integration provider categories. */
export const INTEGRATION_CATEGORIES = {
  PAYMENT: "payment",
  ACCOUNTING: "accounting",
  DELIVERY: "delivery",
  MESSAGING: "messaging",
  EMAIL: "email",
  SMS: "sms",
  WHATSAPP: "whatsapp",
  MAPS: "maps",
  IDENTITY: "identity",
  STORAGE: "storage",
  AI: "ai",
  ERP: "erp",
  CUSTOM: "custom",
} as const;

export type IntegrationCategory =
  (typeof INTEGRATION_CATEGORIES)[keyof typeof INTEGRATION_CATEGORIES];

/** Integration lifecycle statuses. */
export const INTEGRATION_STATUSES = {
  DRAFT: "draft",
  PENDING: "pending",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERROR: "error",
  SUSPENDED: "suspended",
} as const;

export type IntegrationStatus = (typeof INTEGRATION_STATUSES)[keyof typeof INTEGRATION_STATUSES];

/** API key statuses. */
export const API_KEY_STATUSES = {
  ACTIVE: "active",
  REVOKED: "revoked",
  EXPIRED: "expired",
} as const;

export type ApiKeyStatus = (typeof API_KEY_STATUSES)[keyof typeof API_KEY_STATUSES];

/** Webhook delivery statuses. */
export const WEBHOOK_STATUSES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  FAILED: "failed",
  PAUSED: "paused",
} as const;

export type WebhookStatus = (typeof WEBHOOK_STATUSES)[keyof typeof WEBHOOK_STATUSES];

/** Webhook event delivery statuses. */
export const WEBHOOK_EVENT_STATUSES = {
  PENDING: "pending",
  DELIVERED: "delivered",
  FAILED: "failed",
  RETRYING: "retrying",
} as const;

export type WebhookEventStatus =
  (typeof WEBHOOK_EVENT_STATUSES)[keyof typeof WEBHOOK_EVENT_STATUSES];

/** OAuth connection statuses. */
export const OAUTH_STATUSES = {
  AUTHORIZED: "authorized",
  EXPIRED: "expired",
  REVOKED: "revoked",
  PENDING: "pending",
} as const;

export type OAuthStatus = (typeof OAUTH_STATUSES)[keyof typeof OAUTH_STATUSES];

/** External sync job statuses. */
export const SYNC_JOB_STATUSES = {
  QUEUED: "queued",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export type SyncJobStatus = (typeof SYNC_JOB_STATUSES)[keyof typeof SYNC_JOB_STATUSES];

/** API request methods. */
export const API_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
} as const;

export type ApiMethod = (typeof API_METHODS)[keyof typeof API_METHODS];

/** Integration log levels. */
export const LOG_LEVELS = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
} as const;

export type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];

/** Developer token scopes. */
export const DEVELOPER_SCOPES = {
  READ: "read",
  WRITE: "write",
  ADMIN: "admin",
  WEBHOOKS: "webhooks",
} as const;

export type DeveloperScope = (typeof DEVELOPER_SCOPES)[keyof typeof DEVELOPER_SCOPES];

export const INTEGRATION_AI_TOOL_IDS = {
  RECOMMEND_INTEGRATION: "integrations.recommend-integration",
  GENERATE_API_KEY: "integrations.generate-api-key",
  ANALYZE_API_USAGE: "integrations.analyze-api-usage",
  DETECT_FAILED_WEBHOOKS: "integrations.detect-failed-webhooks",
  SUGGEST_RETRY: "integrations.suggest-retry",
  EXPLAIN_API_ERRORS: "integrations.explain-api-errors",
  RECOMMEND_RATE_LIMITS: "integrations.recommend-rate-limits",
  GENERATE_MAPPING: "integrations.generate-mapping",
} as const;

export type IntegrationAiToolId =
  (typeof INTEGRATION_AI_TOOL_IDS)[keyof typeof INTEGRATION_AI_TOOL_IDS];

/** Module-local permission markers (future RBAC wiring). */
export const INTEGRATION_PERMISSIONS = {
  READ: "integrations.read",
  MANAGE: "integrations.manage",
  API_KEY: "integrations.api_key",
  WEBHOOK: "integrations.webhook",
  OAUTH: "integrations.oauth",
  DEVELOPER: "integrations.developer",
  SYNC: "integrations.sync",
  ANALYTICS_READ: "integrations.analytics.read",
} as const;

export type IntegrationPermission =
  (typeof INTEGRATION_PERMISSIONS)[keyof typeof INTEGRATION_PERMISSIONS];

export const INTEGRATION_CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  payment: "Payment",
  accounting: "Accounting",
  delivery: "Delivery",
  messaging: "Messaging",
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
  maps: "Maps",
  identity: "Identity",
  storage: "Storage",
  ai: "AI",
  erp: "ERP",
  custom: "Custom",
};

export const INTEGRATION_STATUS_LABELS: Record<IntegrationStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  connected: "Connected",
  disconnected: "Disconnected",
  error: "Error",
  suspended: "Suspended",
};

export const WEBHOOK_EVENT_STATUS_LABELS: Record<WebhookEventStatus, string> = {
  pending: "Pending",
  delivered: "Delivered",
  failed: "Failed",
  retrying: "Retrying",
};
