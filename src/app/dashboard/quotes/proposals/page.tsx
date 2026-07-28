import { ProposalsList } from "@/modules/quotes/components/quotes-lists";
import { getProposalsListContext } from "@/modules/quotes/lib/get-quotes-context";

export default async function ProposalsListPage() {
  const { proposals } = await getProposalsListContext();

  return <ProposalsList proposals={proposals} />;
}
