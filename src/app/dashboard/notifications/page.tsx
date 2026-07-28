import { NotificationsDashboard } from "@/modules/notifications/components/notifications-dashboard";
import { getNotificationsOverviewContext } from "@/modules/notifications/lib/get-notifications-context";

export default async function NotificationsOverviewPage() {
  const { dashboard } = await getNotificationsOverviewContext();
  return <NotificationsDashboard dashboard={dashboard} />;
}
