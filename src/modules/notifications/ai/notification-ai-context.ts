import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_SOURCES,
} from "@/modules/notifications/constants/notification-status";
import { DEFAULT_NOTIFICATION_SCOPE } from "@/modules/notifications/constants/mock-data";
import { notificationService } from "@/modules/notifications/services/notification.service";
import {
  getDeliveryRatePercent,
  getNotificationSummary,
  getUnreadCount,
  renderTemplatePreview,
  sortByPriority,
} from "@/modules/notifications/utils/notification-selectors";
import {
  getAverageDeliveryTimeMs,
  getDeliverySuccessRate,
} from "@/modules/notifications/utils/notification-delivery-utils";
import type { NotificationAiContext } from "@/modules/notifications/types/notification-platform";
import type {
  NotificationChannel,
  NotificationEventSource,
} from "@/modules/notifications/constants/notification-status";

export function buildNotificationAiContext(): NotificationAiContext {
  const record = notificationService.getRecord();

  return {
    ...record.aiContext,
    summary: getNotificationSummary(record),
    unreadCount: getUnreadCount(record),
    lastGeneratedAt: new Date().toISOString(),
  };
}

export function generateNotificationForAi(input: {
  title: string;
  body: string;
  channel?: NotificationChannel;
  recipientId?: string;
}): Record<string, unknown> {
  const notification = notificationService.sendNotification({
    title: input.title,
    body: input.body,
    channel: input.channel ?? NOTIFICATION_CHANNELS.IN_APP,
    recipientId: input.recipientId ?? DEFAULT_NOTIFICATION_SCOPE.userId,
  });

  return {
    notificationId: notification.id,
    status: notification.status,
    channel: notification.channel,
    mock: true,
  };
}

export function recommendChannelForAi(input?: {
  eventSource?: NotificationEventSource;
  priority?: string;
}): Record<string, unknown> {
  const record = notificationService.getRecord();
  const eventSource = input?.eventSource ?? NOTIFICATION_EVENT_SOURCES.ORDERS;

  const channelStats = record.analytics.channelBreakdown.sort(
    (a, b) => b.deliveryRateBps - a.deliveryRateBps,
  );
  const bestChannel = channelStats[0]?.channel ?? NOTIFICATION_CHANNELS.IN_APP;

  const recommendations: Record<string, NotificationChannel> = {
    [NOTIFICATION_EVENT_SOURCES.KITCHEN]: NOTIFICATION_CHANNELS.PUSH,
    [NOTIFICATION_EVENT_SOURCES.BILLING]: NOTIFICATION_CHANNELS.EMAIL,
    [NOTIFICATION_EVENT_SOURCES.RESERVATIONS]: NOTIFICATION_CHANNELS.SMS,
    [NOTIFICATION_EVENT_SOURCES.INVENTORY]: NOTIFICATION_CHANNELS.EMAIL,
  };

  const recommended = recommendations[eventSource] ?? bestChannel;

  return {
    recommendedChannel: recommended,
    reason: `Highest delivery rate for ${eventSource} events`,
    channelBreakdown: channelStats,
    mock: true,
  };
}

export function scheduleNotificationForAi(input: {
  title: string;
  body: string;
  scheduledAt: string;
  channel?: NotificationChannel;
}): Record<string, unknown> {
  const notification = notificationService.sendNotification({
    title: input.title,
    body: input.body,
    channel: input.channel ?? NOTIFICATION_CHANNELS.EMAIL,
    recipientId: DEFAULT_NOTIFICATION_SCOPE.userId,
    scheduledAt: input.scheduledAt,
  });

  return {
    notificationId: notification.id,
    scheduledAt: notification.scheduledAt,
    status: notification.status,
    mock: true,
  };
}

export function predictDeliveryForAi(input?: {
  channel?: NotificationChannel;
}): Record<string, unknown> {
  const record = notificationService.getRecord();
  const channel = input?.channel ?? NOTIFICATION_CHANNELS.EMAIL;
  const channelStats = record.analytics.channelBreakdown.find((c) => c.channel === channel);
  const deliveries = record.deliveries.filter((d) => d.channel === channel);

  return {
    channel,
    predictedDeliveryRateBps: channelStats?.deliveryRateBps ?? record.analytics.deliveryRateBps,
    averageDeliveryTimeMs: getAverageDeliveryTimeMs(deliveries),
    successRate: getDeliverySuccessRate(deliveries),
    confidenceScore: 0.85,
    mock: true,
  };
}

export function detectNotificationFailuresForAi(): Record<string, unknown> {
  const failed = notificationService.getFailedDeliveries();
  const queueRetries = notificationService.getPendingQueue().filter((q) => q.status === "retry");

  return {
    failedCount: failed.length,
    retryCount: queueRetries.length,
    failures: failed.map((d) => ({
      deliveryId: d.id,
      notificationId: d.notificationId,
      channel: d.channel,
      failureReason: d.failureReason,
    })),
    recommendedActions: ["Refresh expired push tokens", "Verify email deliverability settings"],
    mock: true,
  };
}

export function optimizeSendTimeForAi(): Record<string, unknown> {
  const record = notificationService.getRecord();

  return {
    optimalSendTime: record.aiContext.optimalSendTime ?? "09:00",
    timezone: "Europe/London",
    insights: record.aiContext.insights,
    channelRecommendations: {
      email: "09:00",
      push: "12:00",
      sms: "17:00",
    },
    mock: true,
  };
}

export function summarizeNotificationsForAi(): Record<string, unknown> {
  const record = notificationService.getRecord();
  const unread = notificationService.getUnreadNotifications();
  const sorted = sortByPriority(unread);

  return {
    summary: getNotificationSummary(record),
    unreadCount: unread.length,
    deliveryRate: getDeliveryRatePercent(record.analytics),
    topUnread: sorted.slice(0, 5).map((n) => ({
      id: n.id,
      title: n.title,
      priority: n.priority,
      channel: n.channel,
    })),
    mock: true,
  };
}

export function generateTemplatesForAi(input?: {
  eventSource?: NotificationEventSource;
  eventKey?: string;
}): Record<string, unknown> {
  const eventSource = input?.eventSource ?? NOTIFICATION_EVENT_SOURCES.ORDERS;
  const eventKey = input?.eventKey ?? "order.completed";

  const template = notificationService.createTemplate({
    name: `Auto-generated: ${eventKey}`,
    slug: `auto-${eventKey.replace(".", "-")}`,
    subject: `{{businessName}} — ${eventKey}`,
    bodyTemplate: `Event ${eventKey} occurred at {{timestamp}}. Details: {{details}}`,
    channel: NOTIFICATION_CHANNELS.IN_APP,
    eventSource,
    eventKey,
    variables: ["businessName", "timestamp", "details"],
  });

  const preview = renderTemplatePreview(template, {
    businessName: "Harbour Kitchen",
    timestamp: new Date().toISOString(),
    details: "Order #1234 completed",
  });

  return {
    templateId: template.id,
    slug: template.slug,
    preview,
    mock: true,
  };
}
