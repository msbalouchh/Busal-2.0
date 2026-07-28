import { ImplementationProjectsList } from "@/modules/implementation/components/implementation-lists";
import { getImplementationProjectsContext } from "@/modules/implementation/lib/get-implementation-context";

export default async function ImplementationProjectsPage() {
  const { projects } = await getImplementationProjectsContext();

  return <ImplementationProjectsList projects={projects} />;
}
