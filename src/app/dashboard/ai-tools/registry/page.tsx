import { AiToolsLists } from "@/modules/ai-tools/components/ai-tools-lists";
import { getAiToolsRegistryContext } from "@/modules/ai-tools/lib/get-ai-tools-context";

export default async function AiToolsRegistryPage() {
  const { tools } = await getAiToolsRegistryContext();

  return <AiToolsLists variant="registry" tools={tools} />;
}
