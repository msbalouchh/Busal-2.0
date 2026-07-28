import { AiToolsDashboard } from "@/modules/ai-tools/components/ai-tools-dashboard";
import { getAiToolsOverviewContext } from "@/modules/ai-tools/lib/get-ai-tools-context";

export default async function AiToolsOverviewPage() {
  const { dashboard, recentExecutions } = await getAiToolsOverviewContext();

  return <AiToolsDashboard dashboard={dashboard} recentExecutions={recentExecutions} />;
}
