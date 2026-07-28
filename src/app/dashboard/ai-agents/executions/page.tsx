import { AiAgentsLists } from "@/modules/ai-agents/components/ai-agents-lists";
import { getAiAgentsExecutionsContext } from "@/modules/ai-agents/lib/get-ai-agents-context";

export default async function AiAgentsExecutionsPage() {
  const { executions } = await getAiAgentsExecutionsContext();

  return <AiAgentsLists executions={executions} />;
}
