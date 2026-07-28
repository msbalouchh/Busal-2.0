import { AiKnowledgeLists } from "@/modules/ai-knowledge/components/ai-knowledge-lists";
import { getAiKnowledgeDocumentsContext } from "@/modules/ai-knowledge/lib/get-ai-knowledge-context";

export default async function AiKnowledgeDocumentsPage() {
  const { documents } = await getAiKnowledgeDocumentsContext();

  return <AiKnowledgeLists variant="documents" documents={documents} />;
}
