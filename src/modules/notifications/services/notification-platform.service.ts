import "server-only";

import type { NotificationPlatformContext, NotificationRecord } from "@/modules/notifications/types/notification-platform";
import { notificationRepository } from "@/modules/notifications/repository/notification-repository";
import type { NotificationTenantScope } from "@/modules/notifications/lib/notification-scope";
import { getNotificationSummary } from "@/modules/notifications/utils/notification-selectors";

export interface NotificationPlatformSnapshot {
  context: NotificationPlatformContext;
  record: NotificationRecord;
  unreadCount: number;
  pendingQueueCount: number;
  failedDeliveryCount: number;
  templateCount: number;
  activeRuleCount: number;
  deliveryRateBps: number;
}

export interface NotificationPlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId: string;
  branchId: string;
  userId?: string;
}

export function buildNotificationPlatformContext(input: NotificationPlatformInput): NotificationPlatformContext {
  return {
    tenantId: input.tenantId ?? input.businessId,
    workspaceId: input.workspaceId ?? input.businessId,
    businessId: input.businessId,
    branchId: input.branchId,
    userId: input.userId ?? "system",
  };
}

export async function buildNotificationPlatformSnapshot(
  context: NotificationPlatformContext,
): Promise<NotificationPlatformSnapshot> {
  const scope: NotificationTenantScope = {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  };

  const record = await notificationRepository.getRecord(scope);
  const unread = record.notifications.filter((n) => !n.isRead);
  const pending = record.queue.filter((q) => q.status === "pending" || q.status === "retry");
  const failed = record.deliveries.filter((d) => d.status === "failed" || d.status === "bounced");

  return {
    context,
    record,
    unreadCount: unread.length,
    pendingQueueCount: pending.length,
    failedDeliveryCount: failed.length,
    templateCount: record.templates.length,
    activeRuleCount: record.rules.filter((r) => r.isActive).length,
    deliveryRateBps: record.analytics.deliveryRateBps,
  };
}

export async function getNotificationPlatformSummary(context: NotificationPlatformContext): Promise<string> {
  const snapshot = await buildNotificationPlatformSnapshot(context);
  return getNotificationSummary(snapshot.record);
}
