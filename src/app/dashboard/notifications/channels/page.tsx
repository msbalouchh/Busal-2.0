import { NotificationsLists } from "@/modules/notifications/components/notifications-lists";
import { getNotificationsChannelsContext } from "@/modules/notifications/lib/get-notifications-context";

export default async function NotificationsChannelsPage() {
  const { channels } = await getNotificationsChannelsContext();
  return <NotificationsLists channels={channels} />;
}
