import { AiAutomationLists } from "@/modules/ai-automation/components/ai-automation-lists";
import { getAiAutomationApprovalsContext } from "@/modules/ai-automation/lib/get-ai-automation-context";

export default async function AiAutomationApprovalsPage() {
  const { approvals } = await getAiAutomationApprovalsContext();

  return <AiAutomationLists variant="approvals" approvals={approvals} />;
}
