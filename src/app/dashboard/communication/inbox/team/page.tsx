import { CommunicationLists } from "@/modules/communication/components/communication-lists";
import { getCommunicationInboxContext } from "@/modules/communication/lib/get-communication-context";

export default async function CommunicationTeamInboxPage() {
  const { conversations } = await getCommunicationInboxContext("TEAM");
  return <CommunicationLists conversations={conversations} />;
}
