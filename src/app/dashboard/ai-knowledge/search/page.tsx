import { AiKnowledgeSearchPanel } from "@/modules/ai-knowledge/components/ai-knowledge-search-panel";
import { getAiKnowledgeSearchContext } from "@/modules/ai-knowledge/lib/get-ai-knowledge-context";

export default async function AiKnowledgeSearchPage() {
  await getAiKnowledgeSearchContext();

  return <AiKnowledgeSearchPanel />;
}
