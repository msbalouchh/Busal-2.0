"use client";

import { DeliveryStatusBadge } from "@/modules/notifications/components/delivery-status-badge";
import { NotificationChannelBadge } from "@/modules/notifications/components/notification-channel-badge";
import { NotificationManagementEmpty } from "@/modules/notifications/components/notification-management-empty";
import { NotificationManagementError } from "@/modules/notifications/components/notification-management-error";
import { NotificationManagementLoading } from "@/modules/notifications/components/notification-management-loading";
import { NotificationPriorityBadge } from "@/modules/notifications/components/notification-priority-badge";
import { useNotifications } from "@/modules/notifications/hooks/use-notifications";

export function NotificationPlatformOverview() {
  const { record, unreadCount, refresh, isRefreshing, error } = useNotifications();

  if (isRefreshing && record.notifications.length === 0) {
    return <NotificationManagementLoading />;
  }

  if (error && record.notifications.length === 0) {
    return <NotificationManagementError message={error} onRetry={refresh} />;
  }

  if (record.notifications.length === 0) {
    return <NotificationManagementEmpty />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Unread</p>
          <p className="text-2xl font-semibold">{unreadCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Queue</p>
          <p className="text-2xl font-semibold">{record.queue.length}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Failed</p>
          <p className="text-2xl font-semibold">{record.analytics.totalFailed}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Delivery Rate</p>
          <p className="text-2xl font-semibold">{(record.analytics.deliveryRateBps / 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Notifications</h3>
          <button type="button" className="text-primary text-sm font-medium" onClick={refresh} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <div className="space-y-3">
          {record.notifications.slice(0, 10).map((notification) => (
            <div key={notification.id} className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div>
                <p className="font-medium">{notification.title}</p>
                <p className="text-muted-foreground mt-1 text-sm">{notification.body}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <NotificationChannelBadge channel={notification.channel} />
                <NotificationPriorityBadge priority={notification.priority} />
                <DeliveryStatusBadge status={notification.status === "failed" ? "failed" : notification.isRead ? "delivered" : "pending"} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
