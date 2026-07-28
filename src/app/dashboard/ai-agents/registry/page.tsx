import { AiAgentsLists } from "@/modules/ai-agents/components/ai-agents-lists";
import { getAiAgentsRegistryContext } from "@/modules/ai-agents/lib/get-ai-agents-context";

export default async function AiAgentsRegistryPage() {
  const { agents } = await getAiAgentsRegistryContext();

  return <AiAgentsLists agents={agents} />;
}
