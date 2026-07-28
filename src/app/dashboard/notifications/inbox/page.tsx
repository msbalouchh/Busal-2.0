import { NotificationsLists } from "@/modules/notifications/components/notifications-lists";
import { getNotificationsInboxContext } from "@/modules/notifications/lib/get-notifications-context";

export default async function NotificationsInboxPage() {
  const { inbox } = await getNotificationsInboxContext();
  return <NotificationsLists inbox={inbox} />;
}
