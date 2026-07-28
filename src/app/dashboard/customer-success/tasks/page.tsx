import { CustomerSuccessTasksList } from "@/modules/customer-success/components/customer-success-lists";
import { getCustomerSuccessTasksContext } from "@/modules/customer-success/lib/get-customer-success-context";

export default async function CustomerSuccessTasksPage() {
  const { tasks } = await getCustomerSuccessTasksContext();

  return <CustomerSuccessTasksList tasks={tasks} />;
}
