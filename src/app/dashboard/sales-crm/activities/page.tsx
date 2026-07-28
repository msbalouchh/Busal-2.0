import { SalesActivitiesList } from "@/modules/sales-crm/components/sales-crm-lists";
import { getSalesActivitiesContext } from "@/modules/sales-crm/lib/get-sales-crm-context";

export default async function SalesActivitiesPage() {
  const { activities } = await getSalesActivitiesContext();

  return <SalesActivitiesList activities={activities} />;
}
