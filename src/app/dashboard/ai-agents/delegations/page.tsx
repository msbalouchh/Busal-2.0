import { AiAgentsLists } from "@/modules/ai-agents/components/ai-agents-lists";
import { getAiAgentsDelegationsContext } from "@/modules/ai-agents/lib/get-ai-agents-context";

export default async function AiAgentsDelegationsPage() {
  const { delegations } = await getAiAgentsDelegationsContext();

  return <AiAgentsLists delegations={delegations} />;
}
