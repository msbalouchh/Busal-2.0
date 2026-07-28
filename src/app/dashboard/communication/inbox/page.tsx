import { CommunicationLists } from "@/modules/communication/components/communication-lists";
import { getCommunicationInboxContext } from "@/modules/communication/lib/get-communication-context";

export default async function CommunicationInboxPage() {
  const { conversations } = await getCommunicationInboxContext();
  return <CommunicationLists conversations={conversations} />;
}
