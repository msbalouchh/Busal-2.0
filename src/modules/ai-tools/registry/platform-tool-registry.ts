import { MOCK_PLATFORM_TOOLS } from "@/modules/ai-tools/tools/mock-platform-tools";
import type {
  PlatformToolDefinition,
  RegisteredPlatformTool,
} from "@/modules/ai-tools/types/platform-tool";

const tools = new Map<string, RegisteredPlatformTool>();

function seedPlatformTools(): void {
  for (const tool of MOCK_PLATFORM_TOOLS) {
    tools.set(tool.id, tool);
  }
}

seedPlatformTools();

/** Platform-level tool registry with full metadata model (mock, no backend). */
export class PlatformToolRegistry {
  register(tool: RegisteredPlatformTool): void {
    tools.set(tool.id, tool);
  }

  replace(id: string, tool: RegisteredPlatformTool): void {
    if (!tools.has(id)) {
      throw new Error(`Platform tool "${id}" is not registered.`);
    }

    tools.set(id, { ...tool, id });
  }

  get(id: string): RegisteredPlatformTool | undefined {
    return tools.get(id);
  }

  getOrThrow(id: string): RegisteredPlatformTool {
    const tool = tools.get(id);

    if (!tool) {
      throw new Error(`Platform tool "${id}" is not registered.`);
    }

    return tool;
  }

  list(): PlatformToolDefinition[] {
    return Array.from(tools.values()).sort((left, right) => left.name.localeCompare(right.name));
  }

  listEnabled(): PlatformToolDefinition[] {
    return this.list().filter((tool) => tool.isEnabled);
  }

  listForAgent(agentSlug: string): PlatformToolDefinition[] {
    return this.listEnabled().filter((tool) => tool.supportedAgents.includes(agentSlug));
  }

  getHandler(id: string): RegisteredPlatformTool["handler"] | undefined {
    return tools.get(id)?.handler;
  }

  unregister(id: string): boolean {
    return tools.delete(id);
  }
}

export const platformToolRegistry = new PlatformToolRegistry();

export function registerPlatformTool(tool: RegisteredPlatformTool): void {
  platformToolRegistry.register(tool);
}

export function getPlatformTool(id: string): RegisteredPlatformTool | undefined {
  return platformToolRegistry.get(id);
}

export function listPlatformTools(): PlatformToolDefinition[] {
  return platformToolRegistry.list();
}
