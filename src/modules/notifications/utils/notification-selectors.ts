import type {
  NotificationChannel,
  NotificationPriority,
} from "@/modules/notifications/constants/notification-status";
import type {
  Notification,
  NotificationAnalytics,
  NotificationPreference,
  NotificationRecord,
  NotificationTemplate,
} from "@/modules/notifications/types/notification-platform";

export function getNotificationSummary(record: NotificationRecord): string {
  const unread = record.notifications.filter((n) => !n.isRead).length;
  return `${record.analytics.totalDelivered} delivered — ${unread} unread`;
}

export function getNotificationLabel(notification: Notification): string {
  return `${notification.title} (${notification.channel})`;
}

export function isUnread(notification: Notification): boolean {
  return !notification.isRead;
}

export function getUnreadCount(record: NotificationRecord): number {
  return record.notifications.filter((n) => !n.isRead).length;
}

export function getNotificationsByChannel(
  record: NotificationRecord,
  channel: NotificationChannel,
): Notification[] {
  return record.notifications.filter((n) => n.channel === channel);
}

export function getDeliveryRatePercent(analytics: NotificationAnalytics): number {
  return analytics.deliveryRateBps / 100;
}

export function getReadRatePercent(analytics: NotificationAnalytics): number {
  return analytics.readRateBps / 100;
}

export function isPreferenceEnabled(
  preferences: NotificationPreference[],
  channel: NotificationChannel,
  eventKey: string,
): boolean {
  const pref = preferences.find((p) => p.channel === channel && p.eventKey === eventKey);
  return pref?.isEnabled ?? true;
}

export function renderTemplatePreview(
  template: NotificationTemplate,
  variables: Record<string, string>,
): { subject: string; body: string } {
  let subject = template.subject;
  let body = template.bodyTemplate;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    subject = subject.replaceAll(placeholder, value);
    body = body.replaceAll(placeholder, value);
  }

  return { subject, body };
}

export function sortByPriority(notifications: Notification[]): Notification[] {
  const order: Record<NotificationPriority, number> = {
    urgent: 0,
    high: 1,
    normal: 2,
    low: 3,
  };

  return [...notifications].sort((a, b) => order[a.priority] - order[b.priority]);
}

export function getFailedNotificationCount(record: NotificationRecord): number {
  return record.notifications.filter((n) => n.status === "failed").length;
}
