import { CommunicationLists } from "@/modules/communication/components/communication-lists";
import { getCommunicationAuditContext } from "@/modules/communication/lib/get-communication-context";

export default async function CommunicationAuditPage() {
  const { auditLogs } = await getCommunicationAuditContext();
  return <CommunicationLists auditLogs={auditLogs} />;
}
