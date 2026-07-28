import { ImplementationIssuesList } from "@/modules/implementation/components/implementation-lists";
import { getImplementationIssuesContext } from "@/modules/implementation/lib/get-implementation-context";

export default async function ImplementationIssuesPage() {
  const { issues } = await getImplementationIssuesContext();

  return <ImplementationIssuesList issues={issues} />;
}
