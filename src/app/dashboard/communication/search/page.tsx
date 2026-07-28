import { CommunicationLists } from "@/modules/communication/components/communication-lists";
import { getCommunicationSearchContext } from "@/modules/communication/lib/get-communication-context";

export default async function CommunicationSearchPage() {
  const { conversations } = await getCommunicationSearchContext();
  return <CommunicationLists conversations={conversations} />;
}
