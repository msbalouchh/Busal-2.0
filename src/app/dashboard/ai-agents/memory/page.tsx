import { AiAgentsLists } from "@/modules/ai-agents/components/ai-agents-lists";
import { getAiAgentsMemoryContext } from "@/modules/ai-agents/lib/get-ai-agents-context";

export default async function AiAgentsMemoryPage() {
  const { memories } = await getAiAgentsMemoryContext();

  return <AiAgentsLists memories={memories} />;
}
