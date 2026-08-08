import "server-only";

import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_SOURCES,
} from "@/modules/notifications/constants/notification-status";
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
import type { NotificationAiContext, NotificationPlatformContext } from "@/modules/notifications/types/notification-platform";
import type {
  NotificationChannel,
  NotificationEventSource,
} from "@/modules/notifications/constants/notification-status";
import {
  resolveBusinessContextFromModule,
  runModuleAiJsonTask,
  type ModulePlatformContext,
} from "@/services/ai-engine-bridge.service";

const MODULE_NAME = "notifications";

function toModulePlatform(context: NotificationPlatformContext): ModulePlatformContext {
  return {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  };
}

async function runNotificationAiInference<T extends Record<string, unknown>>(
  context: NotificationPlatformContext,
  task: string,
  data: Record<string, unknown>,
  instructions?: string,
): Promise<T | null> {
  const platform = await resolveBusinessContextFromModule(toModulePlatform(context));
  return runModuleAiJsonTask<T>(platform, {
    module: MODULE_NAME,
    task,
    context: data,
    instructions,
  });
}

export async function buildNotificationAiContext(context: NotificationPlatformContext): Promise<NotificationAiContext> {
  const record = await notificationService.getRecord(context);
  return {
    ...record.aiContext,
    summary: getNotificationSummary(record),
    unreadCount: getUnreadCount(record),
    lastGeneratedAt: new Date().toISOString(),
  };
}

export async function generateNotificationForAi(
  context: NotificationPlatformContext,
  input: { title: string; body: string; channel?: NotificationChannel; recipientId?: string },
): Promise<Record<string, unknown>> {
  const notification = await notificationService.sendNotification(context, {
    title: input.title,
    body: input.body,
    channel: input.channel ?? NOTIFICATION_CHANNELS.IN_APP,
    recipientId: input.recipientId ?? context.userId,
  });

  return { notificationId: notification.id, status: notification.status, channel: notification.channel };
}

export async function recommendChannelForAi(
  context: NotificationPlatformContext,
  input?: { eventSource?: NotificationEventSource; priority?: string },
): Promise<Record<string, unknown>> {
  const record = await notificationService.getRecord(context);
  const eventSource = input?.eventSource ?? NOTIFICATION_EVENT_SOURCES.ORDERS;
  const channelStats = [...record.analytics.channelBreakdown].sort((a, b) => b.deliveryRateBps - a.deliveryRateBps);
  const dataContext = {
    eventSource,
    priority: input?.priority,
    channelBreakdown: channelStats,
    recommendedChannel: record.aiContext.recommendedChannel,
  };

  const aiResult = await runNotificationAiInference<Record<string, unknown>>(
    context,
    "recommendChannel",
    dataContext,
    "Recommend notification channel. Return JSON with recommendedChannel, reason, and channelBreakdown.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    eventSource,
    channelBreakdown: channelStats,
    recommendedChannel: record.aiContext.recommendedChannel ?? channelStats[0]?.channel,
  };
}

export async function scheduleNotificationForAi(
  context: NotificationPlatformContext,
  input: { title: string; body: string; scheduledAt: string; channel?: NotificationChannel },
): Promise<Record<string, unknown>> {
  const notification = await notificationService.sendNotification(context, {
    title: input.title,
    body: input.body,
    channel: input.channel ?? NOTIFICATION_CHANNELS.EMAIL,
    recipientId: context.userId,
    scheduledAt: input.scheduledAt,
  });

  return { notificationId: notification.id, scheduledAt: notification.scheduledAt, status: notification.status };
}

export async function predictDeliveryForAi(
  context: NotificationPlatformContext,
  input?: { channel?: NotificationChannel },
): Promise<Record<string, unknown>> {
  const record = await notificationService.getRecord(context);
  const channel = input?.channel ?? NOTIFICATION_CHANNELS.EMAIL;
  const channelStats = record.analytics.channelBreakdown.find((c) => c.channel === channel);
  const deliveries = record.deliveries.filter((d) => d.channel === channel);
  const dataContext = {
    channel,
    predictedDeliveryRateBps: channelStats?.deliveryRateBps ?? record.analytics.deliveryRateBps,
    averageDeliveryTimeMs: getAverageDeliveryTimeMs(deliveries),
    successRate: getDeliverySuccessRate(deliveries),
    deliveryCount: deliveries.length,
  };

  const aiResult = await runNotificationAiInference<Record<string, unknown>>(
    context,
    "predictDelivery",
    dataContext,
    "Predict notification delivery. Return JSON with channel, predictedDeliveryRateBps, averageDeliveryTimeMs, successRate, and confidenceScore.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function detectNotificationFailuresForAi(
  context: NotificationPlatformContext,
): Promise<Record<string, unknown>> {
  const failed = await notificationService.getFailedDeliveries(context);
  const queueRetries = (await notificationService.getPendingQueue(context)).filter((q) => q.status === "retry");
  const dataContext = {
    failedCount: failed.length,
    retryCount: queueRetries.length,
    failures: failed.map((d) => ({
      deliveryId: d.id,
      notificationId: d.notificationId,
      channel: d.channel,
      failureReason: d.failureReason,
    })),
  };

  const aiResult = await runNotificationAiInference<Record<string, unknown>>(
    context,
    "detectNotificationFailures",
    dataContext,
    "Detect notification failures. Return JSON with failedCount, retryCount, failures, and recommendedActions.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function optimizeSendTimeForAi(context: NotificationPlatformContext): Promise<Record<string, unknown>> {
  const record = await notificationService.getRecord(context);
  return {
    optimalSendTime: record.aiContext.optimalSendTime ?? "09:00",
    timezone: "Europe/London",
    insights: record.aiContext.insights,
    channelRecommendations: { email: "09:00", push: "12:00", sms: "17:00" },
  };
}

export async function summarizeNotificationsForAi(context: NotificationPlatformContext): Promise<Record<string, unknown>> {
  const record = await notificationService.getRecord(context);
  const unread = await notificationService.getUnreadNotifications(context);
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
  };
}

export async function generateTemplatesForAi(
  context: NotificationPlatformContext,
  input?: { eventSource?: NotificationEventSource; eventKey?: string },
): Promise<Record<string, unknown>> {
  const eventSource = input?.eventSource ?? NOTIFICATION_EVENT_SOURCES.ORDERS;
  const eventKey = input?.eventKey ?? "order.completed";
  const record = await notificationService.getRecord(context);

  const dataContext = {
    eventSource,
    eventKey,
    existingTemplates: record.templates.slice(0, 5).map((t) => ({ slug: t.slug, channel: t.channel })),
  };

  const aiResult = await runNotificationAiInference<Record<string, unknown>>(
    context,
    "generateTemplates",
    dataContext,
    "Generate notification template. Return JSON with templateId or draft (name, slug, subject, bodyTemplate, channel, variables), and preview.",
  );

  if (aiResult) {
    return aiResult;
  }

  const template = await notificationService.createTemplate(context, {
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
    businessName: "Business",
    timestamp: new Date().toISOString(),
    details: "Order completed",
  });

  return { templateId: template.id, slug: template.slug, preview };
}

export async function predictCustomerEngagementForAi(
  context: NotificationPlatformContext,
): Promise<Record<string, unknown>> {
  const record = await notificationService.getRecord(context);
  const dataContext = {
    readRateBps: record.analytics.readRateBps,
    deliveryRateBps: record.analytics.deliveryRateBps,
    notificationCount: record.notifications.length,
  };

  const aiResult = await runNotificationAiInference<Record<string, unknown>>(
    context,
    "predictCustomerEngagement",
    dataContext,
    "Predict customer engagement. Return JSON with readRateBps, deliveryRateBps, engagementScore, and recommendation.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function recommendNotificationPriorityForAi(
  context: NotificationPlatformContext,
  input?: { eventSource?: NotificationEventSource },
): Promise<Record<string, unknown>> {
  const eventSource = input?.eventSource ?? NOTIFICATION_EVENT_SOURCES.SYSTEM;
  const record = await notificationService.getRecord(context);
  const dataContext = {
    eventSource,
    recentNotifications: record.notifications.slice(0, 10).map((n) => ({
      priority: n.priority,
      channel: n.channel,
      eventSource: n.eventSource,
    })),
  };

  const aiResult = await runNotificationAiInference<Record<string, unknown>>(
    context,
    "recommendNotificationPriority",
    dataContext,
    "Recommend notification priority. Return JSON with eventSource, recommendedPriority, and rationale.",
  );

  if (aiResult) {
    return aiResult;
  }

  return { eventSource };
}

export async function optimizeCampaignForAi(context: NotificationPlatformContext): Promise<Record<string, unknown>> {
  const record = await notificationService.getRecord(context);
  const campaigns = record.campaigns;
  return {
    campaignCount: campaigns.length,
    recommendations: campaigns.length > 0
      ? ["Segment recipients by channel preference", "Schedule during optimal send windows"]
      : ["Create a campaign to reach inactive customers"],
    bestChannel: record.aiContext.recommendedChannel,
  };
}

export async function analyzeDeliveryFailuresForAi(context: NotificationPlatformContext): Promise<Record<string, unknown>> {
  return detectNotificationFailuresForAi(context);
}
