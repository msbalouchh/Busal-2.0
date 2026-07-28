import { NotificationsLists } from "@/modules/notifications/components/notifications-lists";
import { getNotificationsTemplatesContext } from "@/modules/notifications/lib/get-notifications-context";

export default async function NotificationsTemplatesPage() {
  const { templates } = await getNotificationsTemplatesContext();
  return <NotificationsLists templates={templates} />;
}
