import { AiKnowledgeLists } from "@/modules/ai-knowledge/components/ai-knowledge-lists";
import { getAiKnowledgeConnectorsContext } from "@/modules/ai-knowledge/lib/get-ai-knowledge-context";

export default async function AiKnowledgeConnectorsPage() {
  const { connectors } = await getAiKnowledgeConnectorsContext();

  return <AiKnowledgeLists variant="connectors" connectors={connectors} />;
}
