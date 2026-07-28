import { NotificationsLists } from "@/modules/notifications/components/notifications-lists";
import { getNotificationsDeliveriesContext } from "@/modules/notifications/lib/get-notifications-context";

export default async function NotificationsDeliveriesPage() {
  const { deliveries } = await getNotificationsDeliveriesContext();
  return <NotificationsLists deliveries={deliveries} />;
}
