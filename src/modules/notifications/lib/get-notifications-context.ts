import { cache } from "react";

import { NOTIFICATION_MODULE_PERMISSIONS } from "@/modules/notifications/constants/permissions";
import { resolveNotificationScope, toNotificationPlatformContext } from "@/modules/notifications/lib/notification-scope";
import { buildNotificationPlatformSnapshot } from "@/modules/notifications/services/notification-platform.service";
import { notificationService } from "@/modules/notifications/services/notification.service";
import {
  NOTIFICATION_EVENT_SOURCES,
  type NotificationEventSource,
} from "@/modules/notifications/constants/notification-status";
import { serializeNotificationDashboard } from "@/modules/notifications/utils/notification-utils";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";

export const getNotificationsOverviewContext = cache(async () => {
  const platform = await protectedPage({ permission: NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_READ });
  const context = toNotificationPlatformContext(resolveNotificationScope(platform));
  const snapshot = await buildNotificationPlatformSnapshot(context);

  const dashboard = {
    totalNotifications: snapshot.record.notifications.length,
    unreadInbox: snapshot.unreadCount,
    queuedDeliveries: snapshot.pendingQueueCount,
    failedDeliveries: snapshot.failedDeliveryCount,
    templates: snapshot.templateCount,
    deliveryRules: snapshot.activeRuleCount,
    channelsConfigured: snapshot.record.channels.filter((c) => c.isEnabled).length,
  };

  return { context: platform, dashboard: serializeNotificationDashboard(dashboard) };
});

export const getNotificationsPlatformModuleContext = cache(async () => {
  const platform = await protectedPage({ permission: NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_READ });
  const context = toNotificationPlatformContext(resolveNotificationScope(platform));
  return buildNotificationPlatformSnapshot(context);
});

export const getNotificationsInboxContext = cache(async () => {
  const platform = await protectedPage({ permission: NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_READ });
  const context = toNotificationPlatformContext(resolveNotificationScope(platform));
  const record = await notificationService.getRecord(context);

  return {
    context: platform,
    inbox: record.notifications.map((notification) => ({
      id: notification.id,
      notificationId: notification.id,
      title: notification.title,
      body: notification.body,
      category: notification.eventSource,
      status: notification.isRead ? "READ" : "UNREAD",
      createdAt: notification.createdAt,
      readAt: notification.readAt,
    })),
  };
});

export const getNotificationsTemplatesContext = cache(async () => {
  const platform = await protectedPage({ permission: NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_READ });
  const context = toNotificationPlatformContext(resolveNotificationScope(platform));
  const templates = await notificationService.getTemplates(context);

  return {
    context: platform,
    templates: templates.map((template) => ({
      id: template.id,
      slug: template.slug,
      templateType: template.channel.toUpperCase(),
      category: template.eventSource.toUpperCase(),
      name: template.name,
      subject: template.subject,
      locale: "en",
      version: 1,
      isActive: template.isActive,
    })),
  };
});

export const getNotificationsRulesContext = cache(async () => {
  const platform = await protectedPage({ permission: NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_READ });
  const context = toNotificationPlatformContext(resolveNotificationScope(platform));
  const record = await notificationService.getRecord(context);

  return {
    context: platform,
    rules: record.rules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      mode: "IMMEDIATE",
      priority: rule.channels.length > 0 ? "NORMAL" : "NORMAL",
      category: rule.eventSource.toUpperCase(),
      channel: rule.channels[0]?.toUpperCase() ?? null,
      isActive: rule.isActive,
    })),
  };
});

export const getNotificationsChannelsContext = cache(async () => {
  const platform = await protectedPage({ permission: NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_READ });
  const context = toNotificationPlatformContext(resolveNotificationScope(platform));
  const record = await notificationService.getRecord(context);

  return {
    context: platform,
    channels: record.channels.map((channel) => ({
      id: channel.id,
      channel: channel.channel.toUpperCase(),
      name: channel.label,
      isEnabled: channel.isEnabled,
    })),
  };
});

export const getNotificationsDeliveriesContext = cache(async () => {
  const platform = await protectedPage({ permission: NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_READ });
  const context = toNotificationPlatformContext(resolveNotificationScope(platform));
  const record = await notificationService.getRecord(context);

  return {
    context: platform,
    deliveries: record.deliveries.map((delivery) => ({
      id: delivery.id,
      channel: delivery.channel.toUpperCase(),
      status: delivery.status.toUpperCase(),
      recipientUserId: null,
      queuedAt: delivery.createdAt,
      sentAt: delivery.deliveredAt,
      deliveredAt: delivery.deliveredAt,
      retryCount: delivery.attemptNumber - 1,
      deliveryTimeMs: null,
    })),
  };
});

export const getNotificationsPreferencesContext = cache(async () => {
  const platform = await protectedPage({ permission: NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_READ });
  const context = toNotificationPlatformContext(resolveNotificationScope(platform));
  const record = await notificationService.getRecord(context);
  const preference = record.preferences.find((p) => p.userId === context.userId);

  return {
    context: platform,
    preference: preference
      ? {
          id: preference.id,
          enabledChannels: [preference.channel.toUpperCase()],
          quietHoursStart: preference.quietHoursStart,
          quietHoursEnd: preference.quietHoursEnd,
          language: "en",
          disabledCategories: preference.isEnabled ? [] : ["SYSTEM"],
          digestFrequency: "DAILY",
        }
      : {
          id: "default",
          enabledChannels: ["IN_APP", "EMAIL"],
          quietHoursStart: null,
          quietHoursEnd: null,
          language: "en",
          disabledCategories: [],
          digestFrequency: "DAILY",
        },
  };
});

export const getNotificationsAuditContext = cache(async () => {
  const platform = await protectedPage({ permission: NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_READ });
  const context = toNotificationPlatformContext(resolveNotificationScope(platform));
  const record = await notificationService.getRecord(context);

  return {
    context: platform,
    auditLogs: record.history.map((entry) => ({
      id: entry.id,
      eventType: entry.action.toUpperCase(),
      channel: entry.channel.toUpperCase(),
      createdAt: entry.occurredAt,
    })),
  };
});
