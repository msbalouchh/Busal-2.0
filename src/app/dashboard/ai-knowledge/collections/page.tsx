import { AiKnowledgeLists } from "@/modules/ai-knowledge/components/ai-knowledge-lists";
import { getAiKnowledgeCollectionsContext } from "@/modules/ai-knowledge/lib/get-ai-knowledge-context";

export default async function AiKnowledgeCollectionsPage() {
  const { collections } = await getAiKnowledgeCollectionsContext();

  return <AiKnowledgeLists variant="collections" collections={collections} />;
}
