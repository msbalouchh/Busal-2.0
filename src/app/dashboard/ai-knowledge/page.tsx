import { AiKnowledgeDashboard } from "@/modules/ai-knowledge/components/ai-knowledge-dashboard";
import { getAiKnowledgeOverviewContext } from "@/modules/ai-knowledge/lib/get-ai-knowledge-context";

export default async function AiKnowledgeOverviewPage() {
  const { dashboard, recentSearches } = await getAiKnowledgeOverviewContext();

  return <AiKnowledgeDashboard dashboard={dashboard} recentSearches={recentSearches} />;
}
