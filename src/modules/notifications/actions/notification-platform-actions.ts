"use server";

import { revalidatePath } from "next/cache";

import { NOTIFICATION_MODULE_PERMISSIONS } from "@/modules/notifications/constants/permissions";
import { NOTIFICATION_PLATFORM_ROUTES } from "@/modules/notifications/constants/platform-routes";
import { resolveNotificationScope, toNotificationPlatformContext } from "@/modules/notifications/lib/notification-scope";
import { notificationService } from "@/modules/notifications/services/notification.service";
import {
  bulkNotificationSchema,
  createCampaignSchema,
  createRuleSchema,
  createTemplateSchema,
  retryDeliverySchema,
  sendNotificationSchema,
  updatePreferenceSchema,
  webhookPayloadSchema,
} from "@/modules/notifications/validation/notification-schemas";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";

function revalidateNotificationPaths() {
  Object.values(NOTIFICATION_PLATFORM_ROUTES).forEach((path) => revalidatePath(path));
}

export async function sendNotificationAction(input: unknown) {
  return protectedAction(NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_SEND, async ({ platform }) => {
    const body = sendNotificationSchema.parse(input);
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const notification = await notificationService.sendNotification(context, body);
    revalidateNotificationPaths();
    return notification;
  });
}

export async function sendBulkNotificationsAction(input: unknown) {
  return protectedAction(NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_SEND, async ({ platform }) => {
    const body = bulkNotificationSchema.parse(input);
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const count = await notificationService.sendBulkNotifications(context, body);
    revalidateNotificationPaths();
    return { count };
  });
}

export async function markNotificationReadAction(notificationId: string) {
  return protectedAction(NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_READ, async ({ platform }) => {
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const notification = await notificationService.markAsRead(context, notificationId);
    revalidateNotificationPaths();
    return notification;
  });
}

export async function createNotificationTemplateAction(input: unknown) {
  return protectedAction(NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_CREATE, async ({ platform }) => {
    const body = createTemplateSchema.parse(input);
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const template = await notificationService.createTemplate(context, body);
    revalidateNotificationPaths();
    return template;
  });
}

export async function createNotificationRuleAction(input: unknown) {
  return protectedAction(NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_MANAGE, async ({ platform }) => {
    const body = createRuleSchema.parse(input);
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const rule = await notificationService.createRule(context, body);
    revalidateNotificationPaths();
    return rule;
  });
}

export async function createNotificationCampaignAction(input: unknown) {
  return protectedAction(NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_SEND, async ({ platform }) => {
    const body = createCampaignSchema.parse(input);
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const campaign = await notificationService.createCampaign(context, body);
    revalidateNotificationPaths();
    return campaign;
  });
}

export async function updateNotificationPreferenceAction(input: unknown) {
  return protectedAction(NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_MANAGE, async ({ platform }) => {
    const body = updatePreferenceSchema.parse(input);
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const preference = await notificationService.updatePreference(context, body);
    revalidateNotificationPaths();
    return preference;
  });
}

export async function retryNotificationDeliveryAction(input: unknown) {
  return protectedAction(NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_MANAGE, async ({ platform }) => {
    const body = retryDeliverySchema.parse(input);
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const retried = await notificationService.retryDelivery(context, body);
    revalidateNotificationPaths();
    return { retried };
  });
}

export async function handleNotificationWebhookAction(input: unknown) {
  return protectedAction(NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_MANAGE, async ({ platform }) => {
    const body = webhookPayloadSchema.parse(input);
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const handled = await notificationService.handleWebhook(context, body);
    revalidateNotificationPaths();
    return { handled };
  });
}
