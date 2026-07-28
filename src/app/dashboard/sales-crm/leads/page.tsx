import { SalesLeadsList } from "@/modules/sales-crm/components/sales-crm-lists";
import { getSalesLeadsContext } from "@/modules/sales-crm/lib/get-sales-crm-context";

export default async function SalesLeadsPage() {
  const { leads } = await getSalesLeadsContext();

  return <SalesLeadsList leads={leads} />;
}
