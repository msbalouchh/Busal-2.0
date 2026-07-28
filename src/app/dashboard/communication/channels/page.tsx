import { CommunicationLists } from "@/modules/communication/components/communication-lists";
import { getCommunicationChannelsContext } from "@/modules/communication/lib/get-communication-context";

export default async function CommunicationChannelsPage() {
  const { channels } = await getCommunicationChannelsContext();
  return <CommunicationLists channels={channels} />;
}
