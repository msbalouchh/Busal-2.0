import type {
  Notification,
  NotificationAuditLog,
  NotificationDelivery,
  NotificationDeliveryRule,
  NotificationInboxItem,
  NotificationTemplate,
  NotificationUserPreference,
} from "@prisma/client";

import type { NotificationDashboardMetrics } from "@/modules/notifications/types/notification-types";

export interface NotificationDashboardView {
  totalNotifications: number;
  unreadInbox: number;
  queuedDeliveries: number;
  failedDeliveries: number;
  templates: number;
  deliveryRules: number;
  channelsConfigured: number;
}

export interface NotificationTemplateView {
  id: string;
  slug: string;
  templateType: string;
  category: string;
  name: string;
  subject: string | null;
  locale: string;
  version: number;
  isActive: boolean;
}

export interface NotificationInboxItemView {
  id: string;
  notificationId: string;
  title: string;
  body: string;
  category: string;
  status: string;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationDeliveryView {
  id: string;
  channel: string;
  status: string;
  recipientUserId: string | null;
  queuedAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  retryCount: number;
  deliveryTimeMs: number | null;
}

export interface NotificationRuleView {
  id: string;
  name: string;
  mode: string;
  priority: string;
  category: string | null;
  channel: string | null;
  isActive: boolean;
}

export interface NotificationChannelView {
  id: string;
  channel: string;
  name: string;
  isEnabled: boolean;
}

export interface NotificationAuditView {
  id: string;
  eventType: string;
  channel: string | null;
  createdAt: string;
}

export interface NotificationPreferenceView {
  id: string;
  enabledChannels: string[];
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  language: string;
  disabledCategories: string[];
  digestFrequency: string;
}

export function serializeNotificationDashboard(
  metrics: NotificationDashboardMetrics,
): NotificationDashboardView {
  return { ...metrics };
}

export function serializeNotificationTemplate(
  template: NotificationTemplate,
): NotificationTemplateView {
  return {
    id: template.id,
    slug: template.slug,
    templateType: template.templateType,
    category: template.category,
    name: template.name,
    subject: template.subject,
    locale: template.locale,
    version: template.version,
    isActive: template.isActive,
  };
}

export function serializeInboxItem(
  item: NotificationInboxItem & { notification: Notification },
): NotificationInboxItemView {
  return {
    id: item.id,
    notificationId: item.notificationId,
    title: item.notification.title,
    body: item.notification.body,
    category: item.notification.category,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
    readAt: item.readAt?.toISOString() ?? null,
  };
}

export function serializeDelivery(delivery: NotificationDelivery): NotificationDeliveryView {
  return {
    id: delivery.id,
    channel: delivery.channel,
    status: delivery.status,
    recipientUserId: delivery.recipientUserId,
    queuedAt: delivery.queuedAt.toISOString(),
    sentAt: delivery.sentAt?.toISOString() ?? null,
    deliveredAt: delivery.deliveredAt?.toISOString() ?? null,
    retryCount: delivery.retryCount,
    deliveryTimeMs: delivery.deliveryTimeMs,
  };
}

export function serializeDeliveryRule(rule: NotificationDeliveryRule): NotificationRuleView {
  return {
    id: rule.id,
    name: rule.name,
    mode: rule.mode,
    priority: rule.priority,
    category: rule.category,
    channel: rule.channel,
    isActive: rule.isActive,
  };
}

export function serializeChannelConfig(config: {
  id: string;
  channel: string;
  name: string;
  isEnabled: boolean;
}): NotificationChannelView {
  return config;
}

export function serializeAuditLog(log: NotificationAuditLog): NotificationAuditView {
  return {
    id: log.id,
    eventType: log.eventType,
    channel: log.channel,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeUserPreference(
  preference: NotificationUserPreference,
): NotificationPreferenceView {
  return {
    id: preference.id,
    enabledChannels: preference.enabledChannels,
    quietHoursStart: preference.quietHoursStart,
    quietHoursEnd: preference.quietHoursEnd,
    language: preference.language,
    disabledCategories: preference.disabledCategories,
    digestFrequency: preference.digestFrequency,
  };
}
