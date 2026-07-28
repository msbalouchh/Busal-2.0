import { ImplementationTasksList } from "@/modules/implementation/components/implementation-lists";
import { getImplementationTasksContext } from "@/modules/implementation/lib/get-implementation-context";

export default async function ImplementationTasksPage() {
  const { tasks } = await getImplementationTasksContext();

  return <ImplementationTasksList tasks={tasks} />;
}
