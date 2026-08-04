/** Notification delivery channels. */
export const NOTIFICATION_CHANNELS = {
  EMAIL: "email",
  SMS: "sms",
  WHATSAPP: "whatsapp",
  PUSH: "push",
  IN_APP: "in_app",
  SLACK: "slack",
  WEBHOOK: "webhook",
  CUSTOM: "custom",
} as const;

export type NotificationChannel =
  (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];

/** Notification lifecycle statuses. */
export const NOTIFICATION_STATUSES = {
  DRAFT: "draft",
  QUEUED: "queued",
  SCHEDULED: "scheduled",
  SENDING: "sending",
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[keyof typeof NOTIFICATION_STATUSES];

/** Delivery attempt statuses. */
export const DELIVERY_STATUSES = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  DELIVERED: "delivered",
  FAILED: "failed",
  BOUNCED: "bounced",
  RETRYING: "retrying",
} as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[keyof typeof DELIVERY_STATUSES];

/** Notification priority levels. */
export const NOTIFICATION_PRIORITIES = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export type NotificationPriority =
  (typeof NOTIFICATION_PRIORITIES)[keyof typeof NOTIFICATION_PRIORITIES];

/** Notification scope levels. */
export const NOTIFICATION_SCOPES = {
  USER: "user",
  ROLE: "role",
  BUSINESS: "business",
  BRANCH: "branch",
  TENANT: "tenant",
} as const;

export type NotificationScope = (typeof NOTIFICATION_SCOPES)[keyof typeof NOTIFICATION_SCOPES];

/** Cross-module event source keys. */
export const NOTIFICATION_EVENT_SOURCES = {
  AUTH: "auth",
  CRM: "crm",
  ORDERS: "orders",
  RESERVATIONS: "reservations",
  KITCHEN: "kitchen",
  POS: "pos",
  INVENTORY: "inventory",
  STAFF: "staff",
  BILLING: "billing",
  ANALYTICS: "analytics",
  SYSTEM: "system",
} as const;

export type NotificationEventSource =
  (typeof NOTIFICATION_EVENT_SOURCES)[keyof typeof NOTIFICATION_EVENT_SOURCES];

/** Queue item statuses. */
export const QUEUE_STATUSES = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  RETRY: "retry",
} as const;

export type QueueStatus = (typeof QUEUE_STATUSES)[keyof typeof QUEUE_STATUSES];

/** Schedule recurrence types. */
export const SCHEDULE_TYPES = {
  ONCE: "once",
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  CRON: "cron",
} as const;

export type ScheduleType = (typeof SCHEDULE_TYPES)[keyof typeof SCHEDULE_TYPES];

export const NOTIFICATION_AI_TOOL_IDS = {
  GENERATE_NOTIFICATION: "notifications.generate-notification",
  RECOMMEND_CHANNEL: "notifications.recommend-channel",
  SCHEDULE_NOTIFICATION: "notifications.schedule-notification",
  PREDICT_DELIVERY: "notifications.predict-delivery",
  DETECT_FAILURES: "notifications.detect-failures",
  OPTIMIZE_SEND_TIME: "notifications.optimize-send-time",
  SUMMARIZE: "notifications.summarize",
  GENERATE_TEMPLATES: "notifications.generate-templates",
} as const;

export type NotificationAiToolId =
  (typeof NOTIFICATION_AI_TOOL_IDS)[keyof typeof NOTIFICATION_AI_TOOL_IDS];

/** Module-local permission markers (future RBAC wiring). */
export const NOTIFICATION_PERMISSIONS = {
  READ: "notifications.read",
  MANAGE: "notifications.manage",
  SEND: "notifications.send",
  TEMPLATE: "notifications.template",
  PREFERENCE: "notifications.preference",
  RULE: "notifications.rule",
  ANALYTICS_READ: "notifications.analytics.read",
} as const;

export type NotificationPermission =
  (typeof NOTIFICATION_PERMISSIONS)[keyof typeof NOTIFICATION_PERMISSIONS];

export const NOTIFICATION_CHANNEL_LABELS: Record<NotificationChannel, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
  push: "Push",
  in_app: "In-App",
  slack: "Slack",
  webhook: "Webhook",
  custom: "Custom",
};

export const NOTIFICATION_STATUS_LABELS: Record<NotificationStatus, string> = {
  draft: "Draft",
  queued: "Queued",
  scheduled: "Scheduled",
  sending: "Sending",
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  failed: "Failed",
  cancelled: "Cancelled",
};

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  delivered: "Delivered",
  failed: "Failed",
  bounced: "Bounced",
  retrying: "Retrying",
};

export const NOTIFICATION_PRIORITY_LABELS: Record<NotificationPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};
