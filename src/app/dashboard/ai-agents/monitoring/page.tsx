import { AiAgentsDashboard } from "@/modules/ai-agents/components/ai-agents-dashboard";
import { AiAgentsLists } from "@/modules/ai-agents/components/ai-agents-lists";
import { getAiAgentsMonitoringContext } from "@/modules/ai-agents/lib/get-ai-agents-context";

export default async function AiAgentsMonitoringPage() {
  const { dashboard, executions } = await getAiAgentsMonitoringContext();

  return (
    <div className="space-y-6">
      <AiAgentsDashboard dashboard={dashboard} />
      <AiAgentsLists executions={executions} />
    </div>
  );
}
