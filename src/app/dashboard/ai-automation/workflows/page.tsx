import { AiAutomationLists } from "@/modules/ai-automation/components/ai-automation-lists";
import { getAiAutomationWorkflowsContext } from "@/modules/ai-automation/lib/get-ai-automation-context";

export default async function AiAutomationWorkflowsPage() {
  const { workflows } = await getAiAutomationWorkflowsContext();

  return <AiAutomationLists variant="workflows" workflows={workflows} />;
}
