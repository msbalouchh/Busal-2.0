import { ImplementationChangeRequestsList } from "@/modules/implementation/components/implementation-lists";
import { getImplementationChangeRequestsContext } from "@/modules/implementation/lib/get-implementation-context";

export default async function ImplementationChangeRequestsPage() {
  const { changeRequests } = await getImplementationChangeRequestsContext();

  return <ImplementationChangeRequestsList changeRequests={changeRequests} />;
}
