import { ContractDocumentsList } from "@/modules/contracts/components/contracts-lists";
import { getContractDocumentsContext } from "@/modules/contracts/lib/get-contracts-context";

export default async function ContractDocumentsPage() {
  const { documents } = await getContractDocumentsContext();

  return <ContractDocumentsList documents={documents} />;
}
