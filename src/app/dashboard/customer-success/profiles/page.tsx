import { Customer360ProfilesList } from "@/modules/customer-success/components/customer-success-lists";
import { getCustomer360ProfilesContext } from "@/modules/customer-success/lib/get-customer-success-context";

export default async function Customer360ProfilesPage() {
  const { profiles } = await getCustomer360ProfilesContext();

  return <Customer360ProfilesList profiles={profiles} />;
}
