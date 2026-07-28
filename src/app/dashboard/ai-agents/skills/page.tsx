import { AiAgentsLists } from "@/modules/ai-agents/components/ai-agents-lists";
import { getAiAgentsSkillsContext } from "@/modules/ai-agents/lib/get-ai-agents-context";

export default async function AiAgentsSkillsPage() {
  const { skills } = await getAiAgentsSkillsContext();

  return <AiAgentsLists skills={skills} />;
}
