import { ProposalTemplatesList } from "@/modules/quotes/components/quotes-lists";
import { getProposalTemplatesContext } from "@/modules/quotes/lib/get-quotes-context";

export default async function ProposalTemplatesPage() {
  const { templates } = await getProposalTemplatesContext();

  return <ProposalTemplatesList templates={templates} />;
}
