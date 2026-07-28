import { AiToolsLists } from "@/modules/ai-tools/components/ai-tools-lists";
import { getAiToolsExecutionsContext } from "@/modules/ai-tools/lib/get-ai-tools-context";

export default async function AiToolsExecutionsPage() {
  const { executions } = await getAiToolsExecutionsContext();

  return <AiToolsLists variant="executions" executions={executions} />;
}
