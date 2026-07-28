import { ContractTypesList } from "@/modules/contracts/components/contracts-lists";
import { getContractTypesContext } from "@/modules/contracts/lib/get-contracts-context";

export default async function ContractTypesPage() {
  const { types } = await getContractTypesContext();

  return <ContractTypesList types={types} />;
}
