import { AiAutomationLists } from "@/modules/ai-automation/components/ai-automation-lists";
import { getAiAutomationExecutionsContext } from "@/modules/ai-automation/lib/get-ai-automation-context";

export default async function AiAutomationExecutionsPage() {
  const { executions } = await getAiAutomationExecutionsContext();

  return <AiAutomationLists variant="executions" executions={executions} />;
}
