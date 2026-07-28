import { AiToolsLists } from "@/modules/ai-tools/components/ai-tools-lists";
import { getAiToolsDiscoveryContext } from "@/modules/ai-tools/lib/get-ai-tools-context";

export default async function AiToolsDiscoveryPage() {
  const { discovered } = await getAiToolsDiscoveryContext();

  return <AiToolsLists variant="discovery" discovered={discovered} />;
}
