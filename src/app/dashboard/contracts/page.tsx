import { ContractsDashboard } from "@/modules/contracts/components/contracts-dashboard";
import { getContractsOverviewContext } from "@/modules/contracts/lib/get-contracts-context";

export default async function ContractsOverviewPage() {
  const { dashboard } = await getContractsOverviewContext();

  return <ContractsDashboard dashboard={dashboard} />;
}
