import { AiAutomationLists } from "@/modules/ai-automation/components/ai-automation-lists";
import { getAiAutomationEventsContext } from "@/modules/ai-automation/lib/get-ai-automation-context";

export default async function AiAutomationEventsPage() {
  const { events } = await getAiAutomationEventsContext();

  return <AiAutomationLists variant="events" events={events} />;
}
