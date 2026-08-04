import { DEFAULT_NOTIFICATION_SCOPE } from "@/modules/notifications/constants/mock-data";
import { notificationRepository } from "@/modules/notifications/repository/notification-repository";
import type {
  NotificationPlatformContext,
  NotificationRecord,
} from "@/modules/notifications/types/notification-platform";
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
  businessId?: string;
  branchId?: string;
  userId?: string;
}

export function buildNotificationPlatformContext(
  input: NotificationPlatformInput = {},
): NotificationPlatformContext {
  return {
    tenantId: input.tenantId ?? DEFAULT_NOTIFICATION_SCOPE.tenantId,
    workspaceId: input.workspaceId ?? DEFAULT_NOTIFICATION_SCOPE.workspaceId,
    businessId: input.businessId ?? DEFAULT_NOTIFICATION_SCOPE.businessId,
    branchId: input.branchId ?? DEFAULT_NOTIFICATION_SCOPE.branchId,
    userId: input.userId ?? DEFAULT_NOTIFICATION_SCOPE.userId,
  };
}

export function buildNotificationPlatformSnapshot(
  input: NotificationPlatformInput = {},
): NotificationPlatformSnapshot {
  const context = buildNotificationPlatformContext(input);
  const record = notificationRepository.getRecord();
  const unread = notificationRepository.getUnreadNotifications();
  const pending = notificationRepository.getPendingQueue();
  const failed = notificationRepository.getFailedDeliveries();

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

export function getDefaultNotificationSnapshot(): NotificationPlatformSnapshot {
  return buildNotificationPlatformSnapshot();
}

export function getNotificationPlatformSummary(input: NotificationPlatformInput = {}): string {
  const snapshot = buildNotificationPlatformSnapshot(input);
  return getNotificationSummary(snapshot.record);
}
