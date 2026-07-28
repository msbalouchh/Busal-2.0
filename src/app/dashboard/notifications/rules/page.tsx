import { NotificationsLists } from "@/modules/notifications/components/notifications-lists";
import { getNotificationsRulesContext } from "@/modules/notifications/lib/get-notifications-context";

export default async function NotificationsRulesPage() {
  const { rules } = await getNotificationsRulesContext();
  return <NotificationsLists rules={rules} />;
}
