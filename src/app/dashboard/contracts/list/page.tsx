import { ContractsList } from "@/modules/contracts/components/contracts-lists";
import { getContractsListContext } from "@/modules/contracts/lib/get-contracts-context";

export default async function ContractsListPage() {
  const { contracts } = await getContractsListContext();

  return <ContractsList contracts={contracts} />;
}
