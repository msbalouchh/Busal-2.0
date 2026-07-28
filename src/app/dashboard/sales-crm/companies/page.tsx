import { SalesCompaniesList } from "@/modules/sales-crm/components/sales-crm-lists";
import { getSalesCompaniesContext } from "@/modules/sales-crm/lib/get-sales-crm-context";

export default async function SalesCompaniesPage() {
  const { companies } = await getSalesCompaniesContext();

  return <SalesCompaniesList companies={companies} />;
}
