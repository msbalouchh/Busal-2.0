import { ExpansionOpportunitiesList } from "@/modules/customer-success/components/customer-success-lists";
import { getExpansionOpportunitiesContext } from "@/modules/customer-success/lib/get-customer-success-context";

export default async function ExpansionOpportunitiesPage() {
  const { expansions } = await getExpansionOpportunitiesContext();

  return <ExpansionOpportunitiesList expansions={expansions} />;
}
