import { LegalClausesList } from "@/modules/contracts/components/contracts-lists";
import { getLegalClausesContext } from "@/modules/contracts/lib/get-contracts-context";

export default async function LegalClausesPage() {
  const { clauses } = await getLegalClausesContext();

  return <LegalClausesList clauses={clauses} />;
}
