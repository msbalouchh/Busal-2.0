import type { AiAgentMemoryType } from "@prisma/client";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type {
  AgentExecutionContext,
  AgentMemoryEntry,
} from "@/modules/ai-agents/types/agent-types";

export interface MemoryEngineDependencies {
  upsertMemory: (input: {
    agentRecordId: string;
    businessId: string;
    memoryType: AiAgentMemoryType;
    memoryKey?: string | null;
    content: Record<string, unknown>;
    expiresAt?: Date | null;
  }) => Promise<{ id: string }>;
  listMemories: (
    agentRecordId: string,
    memoryType?: AiAgentMemoryType,
  ) => Promise<Array<{ id: string; memoryKey: string | null; content: unknown }>>;
}

export function buildAgentExecutionContext(
  platform: BusinessContext,
  input: Record<string, unknown>,
): AgentExecutionContext {
  return {
    businessId: platform.business.id,
    branchId: platform.branchId,
    userId: platform.user.id,
    staffId: platform.staffSession?.staffId ?? null,
    permissions: platform.permissions,
    roleSlug: platform.roleSlug ?? "owner",
    input,
    variables: { ...input },
  };
}

export async function storeAgentMemory(
  agentRecordId: string,
  businessId: string,
  entry: AgentMemoryEntry,
  dependencies: MemoryEngineDependencies,
): Promise<{ id: string }> {
  return dependencies.upsertMemory({
    agentRecordId,
    businessId,
    memoryType: entry.memoryType,
    memoryKey: entry.memoryKey ?? null,
    content: entry.content,
    expiresAt: entry.expiresAt ?? null,
  });
}

export async function loadAgentMemoryContext(
  agentRecordId: string,
  dependencies: MemoryEngineDependencies,
): Promise<Record<string, unknown>> {
  const [shortTerm, longTerm, business, conversation, task] = await Promise.all([
    dependencies.listMemories(agentRecordId, "SHORT_TERM"),
    dependencies.listMemories(agentRecordId, "LONG_TERM"),
    dependencies.listMemories(agentRecordId, "BUSINESS"),
    dependencies.listMemories(agentRecordId, "CONVERSATION"),
    dependencies.listMemories(agentRecordId, "TASK"),
  ]);

  return {
    shortTerm: shortTerm.map((entry) => entry.content),
    longTerm: longTerm.map((entry) => entry.content),
    business: business.map((entry) => entry.content),
    conversation: conversation.map((entry) => entry.content),
    task: task.map((entry) => entry.content),
  };
}

export function assertAgentBranchScope(
  platform: BusinessContext,
  agentBranchId: string | null,
): void {
  if (agentBranchId && platform.branchId && agentBranchId !== platform.branchId) {
    throw new Error("Agent branch scope does not match active branch context");
  }
}

export function assertAgentPermissions(
  platform: BusinessContext,
  requiredPermissions: string[],
): void {
  for (const permission of requiredPermissions) {
    if (!platform.permissions.includes(permission)) {
      throw new Error(`Permission denied: ${permission} required`);
    }
  }
}

export function assertAllowedTool(agentAllowedTools: string[], toolId: string): void {
  if (agentAllowedTools.length > 0 && !agentAllowedTools.includes(toolId)) {
    throw new Error(`Tool not allowed for agent: ${toolId}`);
  }
}
