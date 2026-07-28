import type { NotificationDashboardView } from "@/modules/notifications/utils/notification-utils";

interface NotificationsDashboardProps {
  dashboard: NotificationDashboardView;
}

export function NotificationsDashboard({ dashboard }: NotificationsDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Total Notifications</p>
        <p className="text-2xl font-semibold">{dashboard.totalNotifications}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Unread Inbox</p>
        <p className="text-2xl font-semibold">{dashboard.unreadInbox}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Queued Deliveries</p>
        <p className="text-2xl font-semibold">{dashboard.queuedDeliveries}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Failed Deliveries</p>
        <p className="text-2xl font-semibold">{dashboard.failedDeliveries}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Templates</p>
        <p className="text-2xl font-semibold">{dashboard.templates}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Delivery Rules</p>
        <p className="text-2xl font-semibold">{dashboard.deliveryRules}</p>
      </div>
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">Channels Enabled</p>
        <p className="text-2xl font-semibold">{dashboard.channelsConfigured}</p>
      </div>
    </div>
  );
}
