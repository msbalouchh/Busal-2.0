import { AiAgentsLists } from "@/modules/ai-agents/components/ai-agents-lists";
import { getAiAgentsTemplatesContext } from "@/modules/ai-agents/lib/get-ai-agents-context";

export default async function AiAgentsTemplatesPage() {
  const { templates } = await getAiAgentsTemplatesContext();

  return <AiAgentsLists agents={templates} />;
}
