import type { AgentCategory, AgentStatus } from "@prisma/client";

import type { IAIAgentDefinition } from "@/modules/ai-agent-platform-management/interfaces/ai-agent.interface";
import type { IAIToolDefinition } from "@/modules/ai-agent-platform-management/interfaces/ai-tool.interface";

const agentDefinitions = new Map<string, IAIAgentDefinition>();
const toolDefinitions = new Map<string, IAIToolDefinition>();

export function registerPlatformAgent(definition: IAIAgentDefinition): void {
  agentDefinitions.set(definition.slug, definition);
}

export function registerPlatformTool(definition: IAIToolDefinition): void {
  toolDefinitions.set(definition.toolKey, definition);
}

export function getPlatformAgentDefinition(slug: string): IAIAgentDefinition | undefined {
  return agentDefinitions.get(slug);
}

export function getPlatformToolDefinition(toolKey: string): IAIToolDefinition | undefined {
  return toolDefinitions.get(toolKey);
}

export function listPlatformAgentDefinitions(): IAIAgentDefinition[] {
  return [...agentDefinitions.values()];
}

export function listPlatformToolDefinitions(): IAIToolDefinition[] {
  return [...toolDefinitions.values()];
}

export function discoverRegisteredAgents(filters?: {
  category?: AgentCategory;
  status?: AgentStatus;
}): IAIAgentDefinition[] {
  return listPlatformAgentDefinitions().filter((definition) => {
    if (filters?.category && definition.category !== filters.category) return false;
    return true;
  });
}
