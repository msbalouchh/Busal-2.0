import { AiAgentsDashboard } from "@/modules/ai-agents/components/ai-agents-dashboard";
import { getAiAgentsOverviewContext } from "@/modules/ai-agents/lib/get-ai-agents-context";

export default async function AiAgentsOverviewPage() {
  const { dashboard } = await getAiAgentsOverviewContext();

  return <AiAgentsDashboard dashboard={dashboard} />;
}
