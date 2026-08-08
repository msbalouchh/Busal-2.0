"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_SOURCES,
  type NotificationChannel,
  type NotificationEventSource,
} from "@/modules/notifications/constants/notification-status";
import { NOTIFICATION_PLATFORM_ROUTES } from "@/modules/notifications/constants/platform-routes";
import {
  resolveNotificationScope,
  toNotificationPlatformContext,
} from "@/modules/notifications/lib/notification-scope";
import { fromPrismaChannel } from "@/modules/notifications/lib/notification-mappers";
import { notificationService } from "@/modules/notifications/services/notification.service";
import type {
  BulkInboxActionInput,
  CreateDeliveryRuleInput,
  CreateTemplateInput,
  PublishNotificationInput,
  UpdateUserPreferencesInput,
} from "@/modules/notifications/types/notification-types";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import type { NotificationCategory, NotificationChannel as PrismaChannel } from "@prisma/client";

function revalidateNotificationPaths() {
  Object.values(NOTIFICATION_PLATFORM_ROUTES).forEach((path) => revalidatePath(path));
}

function mapCategoryToEventSource(category: NotificationCategory): NotificationEventSource {
  const mapping: Partial<Record<NotificationCategory, NotificationEventSource>> = {
    ORDERS: NOTIFICATION_EVENT_SOURCES.ORDERS,
    RESERVATIONS: NOTIFICATION_EVENT_SOURCES.RESERVATIONS,
    INVENTORY: NOTIFICATION_EVENT_SOURCES.INVENTORY,
    REVENUE: NOTIFICATION_EVENT_SOURCES.FINANCE,
    COMMERCIAL: NOTIFICATION_EVENT_SOURCES.BILLING,
    CRM: NOTIFICATION_EVENT_SOURCES.CRM,
    SYSTEM: NOTIFICATION_EVENT_SOURCES.SYSTEM,
    SECURITY: NOTIFICATION_EVENT_SOURCES.AUTH,
    AI: NOTIFICATION_EVENT_SOURCES.ANALYTICS,
    MARKETING: NOTIFICATION_EVENT_SOURCES.CRM,
    SUPPORT: NOTIFICATION_EVENT_SOURCES.SYSTEM,
    MARKETPLACE: NOTIFICATION_EVENT_SOURCES.SYSTEM,
  };

  return mapping[category] ?? NOTIFICATION_EVENT_SOURCES.SYSTEM;
}

function mapPrismaPriority(priority: PublishNotificationInput["priority"]): "low" | "normal" | "high" | "urgent" | undefined {
  if (!priority) return undefined;
  return priority.toLowerCase() as "low" | "normal" | "high" | "urgent";
}

function mapPrismaChannel(channel: PrismaChannel): NotificationChannel {
  return fromPrismaChannel(channel);
}

export async function publishNotificationAction(
  input: Omit<PublishNotificationInput, "businessId" | "triggeredByUserId">,
) {
  return protectedAction(PERMISSION_CODES.NOTIFICATIONS_PUBLISH, async ({ platform }) => {
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const recipientId = input.recipientUserIds?.[0] ?? context.userId;
    const channel =
      input.channels?.[0] !== undefined
        ? mapPrismaChannel(input.channels[0])
        : NOTIFICATION_CHANNELS.IN_APP;

    const notification = await notificationService.sendNotification(context, {
      title: input.title,
      body: input.body,
      channel,
      recipientId,
      priority: mapPrismaPriority(input.priority),
      eventSource: mapCategoryToEventSource(input.category),
      templateId: undefined,
    });

    revalidateNotificationPaths();
    return { notificationId: notification.id, deliveryIds: [] };
  });
}

export async function createNotificationTemplateAction(input: CreateTemplateInput) {
  return protectedAction(PERMISSION_CODES.NOTIFICATIONS_MANAGE_TEMPLATES, async ({ platform }) => {
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const template = await notificationService.createTemplate(context, {
      name: input.name,
      slug: input.slug,
      subject: input.subject ?? "",
      bodyTemplate: input.body,
      channel: NOTIFICATION_CHANNELS.EMAIL,
      eventSource: mapCategoryToEventSource(input.category),
      eventKey: input.slug,
      variables: input.variables?.map((variable) => variable.key) ?? [],
    });

    revalidateNotificationPaths();
    return template;
  });
}

export async function createNotificationDeliveryRuleAction(input: CreateDeliveryRuleInput) {
  return protectedAction(PERMISSION_CODES.NOTIFICATIONS_MANAGE_RULES, async ({ platform }) => {
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const rule = await notificationService.createRule(context, {
      name: input.name,
      eventSource: input.category
        ? mapCategoryToEventSource(input.category)
        : NOTIFICATION_EVENT_SOURCES.SYSTEM,
      eventKey: input.name.toLowerCase().replace(/\s+/g, "."),
      channels: input.channel ? [mapPrismaChannel(input.channel)] : [NOTIFICATION_CHANNELS.IN_APP],
      isActive: true,
    });

    revalidateNotificationPaths();
    return rule;
  });
}

export async function updateNotificationPreferencesAction(input: UpdateUserPreferencesInput) {
  return protectedAction(PERMISSION_CODES.NOTIFICATIONS_MANAGE_PREFERENCES, async ({ platform }) => {
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const channel = input.enabledChannels?.[0] ?? "IN_APP";

    const preference = await notificationService.updatePreference(context, {
      channel: mapPrismaChannel(channel),
      eventSource: NOTIFICATION_EVENT_SOURCES.SYSTEM,
      eventKey: "global",
      isEnabled: true,
      quietHoursStart: input.quietHoursStart ?? null,
      quietHoursEnd: input.quietHoursEnd ?? null,
    });

    revalidateNotificationPaths();
    return preference;
  });
}

export async function markInboxItemReadAction(inboxItemId: string) {
  return protectedAction(PERMISSION_CODES.NOTIFICATIONS_VIEW, async ({ platform }) => {
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    await notificationService.markAsRead(context, inboxItemId);
    revalidateNotificationPaths();
    return { success: true };
  });
}

export async function bulkInboxActionAction(input: BulkInboxActionInput) {
  return protectedAction(PERMISSION_CODES.NOTIFICATIONS_VIEW, async ({ platform }) => {
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));

    if (input.action === "read") {
      let count = 0;
      for (const notificationId of input.inboxItemIds) {
        const updated = await notificationService.markAsRead(context, notificationId);
        if (updated) count += 1;
      }
      revalidateNotificationPaths();
      return { count };
    }

    return { count: 0 };
  });
}

export async function trackDeliveryEngagementAction(deliveryId: string, action: "open" | "click") {
  const delivery = await prisma.notificationDelivery.findUnique({
    where: { id: deliveryId },
    select: { businessId: true, notificationId: true, channel: true },
  });

  if (!delivery) {
    return { success: false };
  }

  await prisma.notificationAuditLog.create({
    data: {
      businessId: delivery.businessId,
      notificationId: delivery.notificationId,
      deliveryId,
      eventType: action === "open" ? "OPENED" : "CLICKED",
      channel: delivery.channel,
    },
  });

  return { success: true };
}
