import { SalesTasksList } from "@/modules/sales-crm/components/sales-crm-lists";
import { getSalesTasksContext } from "@/modules/sales-crm/lib/get-sales-crm-context";

export default async function SalesTasksPage() {
  const { tasks } = await getSalesTasksContext();

  return <SalesTasksList tasks={tasks} />;
}
