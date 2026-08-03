import { platformToolRegistry } from "@/modules/ai-tools/registry/platform-tool-registry";
import type { PlatformToolMetadata } from "@/modules/ai-tools/types/platform-tool";

/** Reads and resolves tool metadata from the platform registry. */
export class ToolMetadataService {
  getMetadata(toolId: string): PlatformToolMetadata | null {
    return platformToolRegistry.get(toolId)?.metadata ?? null;
  }

  listByCategory(category: string): Array<{ toolId: string; metadata: PlatformToolMetadata }> {
    return platformToolRegistry
      .listEnabled()
      .filter((tool) => tool.metadata.category === category)
      .map((tool) => ({ toolId: tool.id, metadata: tool.metadata }));
  }

  listByTag(tag: string): Array<{ toolId: string; metadata: PlatformToolMetadata }> {
    return platformToolRegistry
      .listEnabled()
      .filter((tool) => tool.metadata.tags.includes(tag))
      .map((tool) => ({ toolId: tool.id, metadata: tool.metadata }));
  }

  summarize(toolId: string): string {
    const tool = platformToolRegistry.get(toolId);

    if (!tool) {
      return `Tool "${toolId}" not found.`;
    }

    return [
      `${tool.name} (${tool.id})`,
      tool.description,
      `Category: ${tool.metadata.category}`,
      `Risk: ${tool.metadata.riskLevel}`,
      `Agents: ${tool.supportedAgents.join(", ")}`,
    ].join("\n");
  }
}

export const toolMetadataService = new ToolMetadataService();
