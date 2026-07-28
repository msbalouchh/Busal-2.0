import { AiAutomationLists } from "@/modules/ai-automation/components/ai-automation-lists";
import { getAiAutomationTemplatesContext } from "@/modules/ai-automation/lib/get-ai-automation-context";

export default async function AiAutomationTemplatesPage() {
  const { templates } = await getAiAutomationTemplatesContext();

  return <AiAutomationLists variant="templates" templates={templates} />;
}
