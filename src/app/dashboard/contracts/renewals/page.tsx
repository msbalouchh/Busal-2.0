import { ContractRenewalsList } from "@/modules/contracts/components/contracts-lists";
import { getContractRenewalsContext } from "@/modules/contracts/lib/get-contracts-context";

export default async function ContractRenewalsPage() {
  const { renewals } = await getContractRenewalsContext();

  return <ContractRenewalsList renewals={renewals} />;
}
