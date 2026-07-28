import { AiAutomationLists } from "@/modules/ai-automation/components/ai-automation-lists";
import { getAiAutomationMonitoringContext } from "@/modules/ai-automation/lib/get-ai-automation-context";

export default async function AiAutomationMonitoringPage() {
  const { dashboard, executions } = await getAiAutomationMonitoringContext();

  return (
    <AiAutomationLists
      variant="monitoring"
      executions={executions}
      dashboard={{ retries: dashboard.retries, totalAiTokens: dashboard.totalAiTokens }}
    />
  );
}
