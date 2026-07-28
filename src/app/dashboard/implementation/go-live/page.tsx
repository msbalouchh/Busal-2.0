import { GoLiveChecklistList } from "@/modules/implementation/components/implementation-lists";
import { getGoLiveChecklistContext } from "@/modules/implementation/lib/get-implementation-context";

export default async function GoLiveChecklistPage() {
  const { checklist } = await getGoLiveChecklistContext();

  return <GoLiveChecklistList checklist={checklist} />;
}
