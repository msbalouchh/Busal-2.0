import type {
  NotificationCategory,
  NotificationChannel,
  NotificationDeliveryMode,
  NotificationDigestFrequency,
  NotificationInboxStatus,
  NotificationPriority,
  NotificationTemplateType,
} from "@prisma/client";

export interface ChannelDefinition {
  channel: NotificationChannel;
  name: string;
  description: string;
  isIntegrated: boolean;
}

export interface TemplateVariableDefinition {
  key: string;
  description: string;
  required: boolean;
}

export interface RenderedTemplate {
  subject: string | null;
  body: string;
}

export interface PublishNotificationInput {
  businessId: string;
  branchId?: string | null;
  category: NotificationCategory;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
  triggeredByUserId?: string | null;
  triggeredByModule: string;
  templateSlug?: string;
  templateVariables?: Record<string, string>;
  priority?: NotificationPriority;
  recipientUserIds?: string[];
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  channels?: NotificationChannel[];
}

export interface PublishNotificationResult {
  notificationId: string;
  deliveryIds: string[];
}

export interface CreateTemplateInput {
  slug: string;
  templateType: NotificationTemplateType;
  category: NotificationCategory;
  name: string;
  subject?: string | null;
  body: string;
  variables?: TemplateVariableDefinition[];
  locale?: string;
}

export interface CreateDeliveryRuleInput {
  name: string;
  mode: NotificationDeliveryMode;
  priority?: NotificationPriority;
  category?: NotificationCategory | null;
  channel?: NotificationChannel | null;
  silent?: boolean;
  businessHoursOnly?: boolean;
  retryCount?: number;
  retryDelayMinutes?: number;
  digestFrequency?: NotificationDigestFrequency;
}

export interface UpdateUserPreferencesInput {
  enabledChannels?: NotificationChannel[];
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  language?: string;
  disabledCategories?: NotificationCategory[];
  digestFrequency?: NotificationDigestFrequency;
}

export interface InboxFilterInput {
  status?: NotificationInboxStatus;
  category?: NotificationCategory;
  search?: string;
}

export interface BulkInboxActionInput {
  inboxItemIds: string[];
  action: "read" | "archive" | "pin" | "unpin";
}

export interface NotificationDashboardMetrics {
  totalNotifications: number;
  unreadInbox: number;
  queuedDeliveries: number;
  failedDeliveries: number;
  templates: number;
  deliveryRules: number;
  channelsConfigured: number;
}

export interface DeliveryRuleEvaluationContext {
  category: NotificationCategory;
  priority: NotificationPriority;
  now: Date;
  businessHoursOnly?: boolean;
}

export interface UserPreferenceContext {
  userId: string;
  enabledChannels: NotificationChannel[];
  disabledCategories: NotificationCategory[];
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  language: string;
  digestFrequency: NotificationDigestFrequency;
}
