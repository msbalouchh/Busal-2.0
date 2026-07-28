import { NotificationsLists } from "@/modules/notifications/components/notifications-lists";
import { getNotificationsPreferencesContext } from "@/modules/notifications/lib/get-notifications-context";

export default async function NotificationsPreferencesPage() {
  const { preference } = await getNotificationsPreferencesContext();
  return <NotificationsLists preference={preference} />;
}
