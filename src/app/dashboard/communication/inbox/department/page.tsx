import { CommunicationLists } from "@/modules/communication/components/communication-lists";
import { getCommunicationInboxContext } from "@/modules/communication/lib/get-communication-context";

export default async function CommunicationDepartmentInboxPage() {
  const { conversations } = await getCommunicationInboxContext("DEPARTMENT");
  return <CommunicationLists conversations={conversations} />;
}
