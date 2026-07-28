import { CommunicationLists } from "@/modules/communication/components/communication-lists";
import { getCommunicationInboxContext } from "@/modules/communication/lib/get-communication-context";

export default async function CommunicationAiInboxPage() {
  const { conversations } = await getCommunicationInboxContext("AI", "ai_handled");
  return <CommunicationLists conversations={conversations} />;
}
