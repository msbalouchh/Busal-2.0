import { SalesOpportunitiesList } from "@/modules/sales-crm/components/sales-crm-lists";
import { getSalesOpportunitiesContext } from "@/modules/sales-crm/lib/get-sales-crm-context";

export default async function SalesOpportunitiesPage() {
  const { opportunities } = await getSalesOpportunitiesContext();

  return <SalesOpportunitiesList opportunities={opportunities} />;
}
