import { BUILTIN_TOOLS } from "@/modules/ai/tools/builtin-tools";
import type { RegisteredAiTool, AiToolExecutionResult } from "@/modules/ai/types/tool";

const tools = new Map<string, RegisteredAiTool>();

function seedBuiltinTools(): void {
  for (const tool of BUILTIN_TOOLS) {
    tools.set(tool.slug, tool);
  }
}

seedBuiltinTools();

/** Central registry for AI tools. Supports future module registration. */
export class ToolRegistry {
  register(tool: RegisteredAiTool): void {
    tools.set(tool.slug, tool);
  }

  replace(slug: string, tool: RegisteredAiTool): void {
    if (!tools.has(slug)) {
      throw new Error(`Tool "${slug}" is not registered.`);
    }

    tools.set(slug, { ...tool, slug });
  }

  get(slug: string): RegisteredAiTool | undefined {
    return tools.get(slug);
  }

  getOrThrow(slug: string): RegisteredAiTool {
    const tool = tools.get(slug);

    if (!tool) {
      throw new Error(`Tool "${slug}" is not registered.`);
    }

    return tool;
  }

  list(): RegisteredAiTool[] {
    return Array.from(tools.values()).sort((left, right) => left.name.localeCompare(right.name));
  }

  listEnabled(): RegisteredAiTool[] {
    return this.list().filter((tool) => tool.isEnabled);
  }

  listByCategory(category: string): RegisteredAiTool[] {
    return this.list().filter((tool) => tool.category === category);
  }

  async execute(slug: string, input: Record<string, unknown>): Promise<AiToolExecutionResult> {
    const tool = this.getOrThrow(slug);

    if (!tool.isEnabled) {
      return {
        toolSlug: slug,
        success: false,
        output: `Tool "${slug}" is disabled.`,
      };
    }

    if (!tool.handler) {
      return {
        toolSlug: slug,
        success: false,
        output: `Tool "${slug}" has no handler registered.`,
      };
    }

    const result = await tool.handler(input);
    return { ...result, toolSlug: slug };
  }

  unregister(slug: string): boolean {
    return tools.delete(slug);
  }
}

export const toolRegistry = new ToolRegistry();

export function registerTool(tool: RegisteredAiTool): void {
  toolRegistry.register(tool);
}

export function listTools(): RegisteredAiTool[] {
  return toolRegistry.list();
}
