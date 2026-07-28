import { NotificationsLists } from "@/modules/notifications/components/notifications-lists";
import { getNotificationsAuditContext } from "@/modules/notifications/lib/get-notifications-context";

export default async function NotificationsAuditPage() {
  const { auditLogs } = await getNotificationsAuditContext();
  return <NotificationsLists auditLogs={auditLogs} />;
}
