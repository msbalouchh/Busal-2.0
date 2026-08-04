import type {
  DeliveryStatus,
  NotificationChannel,
  NotificationEventSource,
  NotificationPriority,
  NotificationScope,
  NotificationStatus,
  QueueStatus,
  ScheduleType,
} from "@/modules/notifications/constants/notification-status";

/** Individual notification record. */
export interface Notification {
  id: string;
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string | null;
  templateId: string | null;
  title: string;
  body: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  priority: NotificationPriority;
  scope: NotificationScope;
  eventSource: NotificationEventSource;
  eventKey: string;
  recipientId: string;
  isRead: boolean;
  readAt: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

/** Reusable notification template. */
export interface NotificationTemplate {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  subject: string;
  bodyTemplate: string;
  channel: NotificationChannel;
  eventSource: NotificationEventSource;
  eventKey: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Channel configuration. */
export interface NotificationChannelConfig {
  id: string;
  tenantId: string;
  channel: NotificationChannel;
  label: string;
  isEnabled: boolean;
  providerName: string | null;
  config: Record<string, string>;
  rateLimitPerHour: number;
  createdAt: string;
}

/** User/role notification preferences. */
export interface NotificationPreference {
  id: string;
  tenantId: string;
  userId: string;
  channel: NotificationChannel;
  eventSource: NotificationEventSource;
  eventKey: string;
  isEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  updatedAt: string;
}

/** Queued notification awaiting delivery. */
export interface NotificationQueue {
  id: string;
  tenantId: string;
  notificationId: string;
  channel: NotificationChannel;
  status: QueueStatus;
  priority: NotificationPriority;
  retryCount: number;
  maxRetries: number;
  nextAttemptAt: string;
  lastAttemptAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

/** Delivery attempt record. */
export interface NotificationDelivery {
  id: string;
  tenantId: string;
  notificationId: string;
  queueId: string;
  channel: NotificationChannel;
  status: DeliveryStatus;
  attemptNumber: number;
  providerMessageId: string | null;
  deliveredAt: string | null;
  failureReason: string | null;
  createdAt: string;
}

/** Historical notification log. */
export interface NotificationHistory {
  id: string;
  tenantId: string;
  notificationId: string;
  action: "created" | "queued" | "sent" | "delivered" | "read" | "failed" | "retried" | "cancelled";
  channel: NotificationChannel;
  actorUserId: string | null;
  details: string;
  occurredAt: string;
}

/** Rule for automated notification triggers. */
export interface NotificationRule {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string | null;
  name: string;
  eventSource: NotificationEventSource;
  eventKey: string;
  templateId: string;
  channels: NotificationChannel[];
  scope: NotificationScope;
  targetRoleIds: string[];
  isActive: boolean;
  conditions: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

/** Event that triggers notifications. */
export interface NotificationEvent {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string | null;
  eventSource: NotificationEventSource;
  eventKey: string;
  payload: Record<string, string>;
  processedAt: string | null;
  ruleIds: string[];
  occurredAt: string;
}

/** Scheduled notification delivery. */
export interface NotificationSchedule {
  id: string;
  tenantId: string;
  notificationId: string;
  scheduleType: ScheduleType;
  scheduledAt: string;
  cronExpression: string | null;
  timezone: string;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string;
  createdAt: string;
}

/** Notification recipient target. */
export interface NotificationRecipient {
  id: string;
  tenantId: string;
  userId: string | null;
  roleId: string | null;
  email: string | null;
  phone: string | null;
  pushToken: string | null;
  slackUserId: string | null;
  preferredChannels: NotificationChannel[];
  scope: NotificationScope;
  businessId: string | null;
  branchId: string | null;
}

/** Notification performance metrics. */
export interface NotificationAnalytics {
  tenantId: string;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalRead: number;
  deliveryRateBps: number;
  readRateBps: number;
  averageDeliveryTimeMs: number;
  channelBreakdown: Array<{ channel: NotificationChannel; count: number; deliveryRateBps: number }>;
  periodStart: string;
  periodEnd: string;
}

/** AI-enriched notification context. */
export interface NotificationAiContext {
  tenantId: string;
  summary: string;
  unreadCount: number;
  failedDeliveryCount: number;
  recommendedChannel: NotificationChannel | null;
  optimalSendTime: string | null;
  insights: string[];
  recommendedActions: string[];
  lastGeneratedAt: string;
}

/** Full notification aggregate — single source of truth. */
export interface NotificationRecord {
  notifications: Notification[];
  templates: NotificationTemplate[];
  channels: NotificationChannelConfig[];
  preferences: NotificationPreference[];
  queue: NotificationQueue[];
  deliveries: NotificationDelivery[];
  history: NotificationHistory[];
  rules: NotificationRule[];
  events: NotificationEvent[];
  schedules: NotificationSchedule[];
  recipients: NotificationRecipient[];
  analytics: NotificationAnalytics;
  aiContext: NotificationAiContext;
}

export interface NotificationSearchQuery {
  query?: string;
  tenantId?: string;
  businessId?: string;
  branchId?: string;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  eventSource?: NotificationEventSource;
  isRead?: boolean;
  limit?: number;
}

export interface SendNotificationInput {
  title: string;
  body: string;
  channel: NotificationChannel;
  recipientId: string;
  templateId?: string;
  priority?: NotificationPriority;
  scheduledAt?: string;
}

export interface CreateTemplateInput {
  name: string;
  slug: string;
  subject: string;
  bodyTemplate: string;
  channel: NotificationChannel;
  eventSource: NotificationEventSource;
  eventKey: string;
  variables: string[];
}

export interface NotificationPlatformContext {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
}

export interface NotificationContextValue {
  context: NotificationPlatformContext;
  record: NotificationRecord;
  unreadCount: number;
  selectedNotificationId: string | null;
  selectedNotification: Notification | null;
  selectNotification: (notificationId: string | null) => void;
  refresh: () => void;
}

export interface NotificationPreferencesContextValue {
  preferences: NotificationPreference[];
  channels: NotificationChannelConfig[];
  refresh: () => void;
}

export interface NotificationQueueContextValue {
  queue: NotificationQueue[];
  pendingCount: number;
  failedCount: number;
  refresh: () => void;
}
