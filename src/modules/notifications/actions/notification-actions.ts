"use server";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import type {
  BulkInboxActionInput,
  CreateDeliveryRuleInput,
  CreateTemplateInput,
  PublishNotificationInput,
  UpdateUserPreferencesInput,
} from "@/modules/notifications/types/notification-types";
import {
  bulkInboxAction,
  createNotificationDeliveryRule,
  createNotificationTemplate,
  markInboxItemRead,
  publishNotificationFromPlatform,
  trackDeliveryEngagement,
  updateNotificationUserPreferences,
} from "@/services/notifications.service";

export async function publishNotificationAction(
  input: Omit<PublishNotificationInput, "businessId" | "triggeredByUserId">,
) {
  return protectedAction(PERMISSION_CODES.NOTIFICATIONS_PUBLISH, async ({ platform }) =>
    publishNotificationFromPlatform(platform, input),
  );
}

export async function createNotificationTemplateAction(input: CreateTemplateInput) {
  return protectedAction(PERMISSION_CODES.NOTIFICATIONS_MANAGE_TEMPLATES, async ({ platform }) =>
    createNotificationTemplate(platform, input),
  );
}

export async function createNotificationDeliveryRuleAction(input: CreateDeliveryRuleInput) {
  return protectedAction(PERMISSION_CODES.NOTIFICATIONS_MANAGE_RULES, async ({ platform }) =>
    createNotificationDeliveryRule(platform, input),
  );
}

export async function updateNotificationPreferencesAction(input: UpdateUserPreferencesInput) {
  return protectedAction(PERMISSION_CODES.NOTIFICATIONS_MANAGE_PREFERENCES, async ({ platform }) =>
    updateNotificationUserPreferences(platform, input),
  );
}

export async function markInboxItemReadAction(inboxItemId: string) {
  return protectedAction(PERMISSION_CODES.NOTIFICATIONS_VIEW, async ({ platform }) => {
    await markInboxItemRead(platform, inboxItemId);
    return { success: true };
  });
}

export async function bulkInboxActionAction(input: BulkInboxActionInput) {
  return protectedAction(PERMISSION_CODES.NOTIFICATIONS_VIEW, async ({ platform }) => {
    const count = await bulkInboxAction(platform, input);
    return { count };
  });
}

export async function trackDeliveryEngagementAction(deliveryId: string, action: "open" | "click") {
  await trackDeliveryEngagement(deliveryId, action);
  return { success: true };
}
