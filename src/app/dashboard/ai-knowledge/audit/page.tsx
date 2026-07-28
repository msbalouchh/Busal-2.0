import { AiKnowledgeLists } from "@/modules/ai-knowledge/components/ai-knowledge-lists";
import { getAiKnowledgeAuditContext } from "@/modules/ai-knowledge/lib/get-ai-knowledge-context";

export default async function AiKnowledgeAuditPage() {
  const { audits } = await getAiKnowledgeAuditContext();

  return <AiKnowledgeLists variant="audit" audits={audits} />;
}
