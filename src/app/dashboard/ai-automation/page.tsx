import { AiAutomationDashboard } from "@/modules/ai-automation/components/ai-automation-dashboard";
import { getAiAutomationOverviewContext } from "@/modules/ai-automation/lib/get-ai-automation-context";

export default async function AiAutomationOverviewPage() {
  const { dashboard } = await getAiAutomationOverviewContext();

  return <AiAutomationDashboard dashboard={dashboard} />;
}
