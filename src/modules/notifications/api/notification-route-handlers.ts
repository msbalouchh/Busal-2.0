import "server-only";

import { NextResponse } from "next/server";

import { NOTIFICATION_MODULE_PERMISSIONS } from "@/modules/notifications/constants/permissions";
import { resolveNotificationScope, toNotificationPlatformContext } from "@/modules/notifications/lib/notification-scope";
import { notificationService } from "@/modules/notifications/services/notification.service";
import { buildNotificationPlatformSnapshot } from "@/modules/notifications/services/notification-platform.service";
import {
  bulkNotificationSchema,
  createCampaignSchema,
  createRuleSchema,
  createTemplateSchema,
  notificationSearchSchema,
  retryDeliverySchema,
  sendNotificationSchema,
  updatePreferenceSchema,
  webhookPayloadSchema,
} from "@/modules/notifications/validation/notification-schemas";
import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";

function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export async function handleListNotifications(request: Request) {
  try {
    const platform = await protectedRoute({ permission: NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_READ });
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const url = new URL(request.url);
    const parsed = notificationSearchSchema.parse(Object.fromEntries(url.searchParams.entries()));
    const snapshot = url.searchParams.get("snapshot") === "true";

    if (snapshot) {
      return jsonSuccess(await buildNotificationPlatformSnapshot(context));
    }

    const [notifications, record] = await Promise.all([
      notificationService.searchNotifications(context, parsed),
      notificationService.getRecord(context),
    ]);

    return jsonSuccess({
      notifications,
      templates: record.templates,
      channels: record.channels,
      queue: record.queue,
      analytics: record.analytics,
    });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleSendNotification(request: Request) {
  try {
    const platform = await protectedRoute({ permission: NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_SEND });
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const body = sendNotificationSchema.parse(await request.json());
    const notification = await notificationService.sendNotification(context, body);
    return jsonSuccess(notification, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleBulkNotifications(request: Request) {
  try {
    const platform = await protectedRoute({ permission: NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_SEND });
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const body = bulkNotificationSchema.parse(await request.json());
    const count = await notificationService.sendBulkNotifications(context, body);
    return jsonSuccess({ count }, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleMarkNotificationRead(_request: Request, notificationId: string) {
  try {
    const platform = await protectedRoute({ permission: NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_READ });
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const notification = await notificationService.markAsRead(context, notificationId);
    if (!notification) {
      return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 });
    }
    return jsonSuccess(notification);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateTemplate(request: Request) {
  try {
    const platform = await protectedRoute({ permission: NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_CREATE });
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const body = createTemplateSchema.parse(await request.json());
    const template = await notificationService.createTemplate(context, body);
    return jsonSuccess(template, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateRule(request: Request) {
  try {
    const platform = await protectedRoute({ permission: NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_MANAGE });
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const body = createRuleSchema.parse(await request.json());
    const rule = await notificationService.createRule(context, body);
    return jsonSuccess(rule, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateCampaign(request: Request) {
  try {
    const platform = await protectedRoute({ permission: NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_SEND });
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const body = createCampaignSchema.parse(await request.json());
    const campaign = await notificationService.createCampaign(context, body);
    return jsonSuccess(campaign, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleUpdatePreference(request: Request) {
  try {
    const platform = await protectedRoute({ permission: NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_MANAGE });
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const body = updatePreferenceSchema.parse(await request.json());
    const preference = await notificationService.updatePreference(context, body);
    return jsonSuccess(preference);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleRetryDelivery(request: Request) {
  try {
    const platform = await protectedRoute({ permission: NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_MANAGE });
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const body = retryDeliverySchema.parse(await request.json());
    const retried = await notificationService.retryDelivery(context, body);
    return jsonSuccess({ retried });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleWebhook(request: Request) {
  try {
    const platform = await protectedRoute({ permission: NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_MANAGE });
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const body = webhookPayloadSchema.parse(await request.json());
    const handled = await notificationService.handleWebhook(context, body);
    return jsonSuccess({ handled });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleNotificationQueue(_request: Request) {
  try {
    const platform = await protectedRoute({ permission: NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_READ });
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const [queue, failed] = await Promise.all([
      notificationService.getPendingQueue(context),
      notificationService.getFailedDeliveries(context),
    ]);
    return jsonSuccess({ queue, failed });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleNotificationAnalytics(_request: Request) {
  try {
    const platform = await protectedRoute({ permission: NOTIFICATION_MODULE_PERMISSIONS.NOTIFICATION_READ });
    const context = toNotificationPlatformContext(resolveNotificationScope(platform));
    const record = await notificationService.getRecord(context);
    return jsonSuccess({
      analytics: record.analytics,
      campaigns: record.campaigns,
      history: record.history.slice(0, 50),
    });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}
