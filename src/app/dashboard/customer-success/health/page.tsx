import { CustomerHealthScoresList } from "@/modules/customer-success/components/customer-success-lists";
import { getCustomerHealthContext } from "@/modules/customer-success/lib/get-customer-success-context";

export default async function CustomerHealthPage() {
  const { profiles } = await getCustomerHealthContext();

  return <CustomerHealthScoresList profiles={profiles} />;
}
