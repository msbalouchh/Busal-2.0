import { CommunicationLists } from "@/modules/communication/components/communication-lists";
import { getCommunicationInboxContext } from "@/modules/communication/lib/get-communication-context";

export default async function CommunicationPersonalInboxPage() {
  const { conversations } = await getCommunicationInboxContext("PERSONAL");
  return <CommunicationLists conversations={conversations} />;
}
