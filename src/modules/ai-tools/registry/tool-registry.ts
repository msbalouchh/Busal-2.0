import type { ToolDefinition, ToolHandler } from "@/modules/ai-tools/types/tool-types";

const definitions = new Map<string, ToolDefinition>();
const handlers = new Map<string, ToolHandler>();

export function registerTool(definition: ToolDefinition, handler: ToolHandler): void {
  if (definitions.has(definition.toolId)) {
    throw new Error(`Tool already registered: ${definition.toolId}`);
  }

  definitions.set(definition.toolId, definition);
  handlers.set(definition.toolId, handler);
}

export function getRegisteredTool(toolId: string): ToolDefinition | undefined {
  return definitions.get(toolId);
}

export function getToolHandler(toolId: string): ToolHandler | undefined {
  return handlers.get(toolId);
}

export function listRegisteredTools(): ToolDefinition[] {
  return Array.from(definitions.values());
}

export function isToolRegistered(toolId: string): boolean {
  return definitions.has(toolId);
}
