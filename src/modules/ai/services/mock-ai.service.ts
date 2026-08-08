import { DEFAULT_MOCK_AI_SCOPE, DEFAULT_MOCK_AI_USER_ID } from "@/modules/ai/constants/mock-data";
import { aiOrchestrator } from "@/modules/ai/orchestrator/ai-orchestrator";
import { aiAgentRegistry } from "@/modules/ai/registry/agent-registry";
import { toolRegistry } from "@/modules/ai/registry/tool-registry";
import type { AiAgentRuntimeContext } from "@/modules/ai/types/agent";
import type { AiPlatformContext } from "@/modules/ai/types/context";

export interface AiPlatformSnapshot {
  context: AiPlatformContext;
  agents: ReturnType<typeof aiAgentRegistry.list>;
  tools: ReturnType<typeof toolRegistry.listEnabled>;
  conversations: Array<{ id: string; title: string }>;
  memorySummary: string;
  orchestrator: typeof aiOrchestrator;
}

export interface AiPlatformInput {
  userId?: string;
  tenantId?: string;
  workspaceId?: string;
  businessId?: string;
  branchId?: string;
  activeAgentSlug?: string | null;
  permissions?: string[];
}

export function buildAiRuntimeContext(input: AiPlatformInput = {}): AiAgentRuntimeContext {
  return {
    agentSlug: input.activeAgentSlug ?? "",
    userId: input.userId ?? DEFAULT_MOCK_AI_USER_ID,
    tenantId: input.tenantId ?? DEFAULT_MOCK_AI_SCOPE.tenantId,
    workspaceId: input.workspaceId ?? DEFAULT_MOCK_AI_SCOPE.workspaceId,
    businessId: input.businessId ?? DEFAULT_MOCK_AI_SCOPE.businessId,
    branchId: input.branchId ?? DEFAULT_MOCK_AI_SCOPE.branchId,
    permissions: new Set(input.permissions ?? []),
    metadata: {},
  };
}

export function buildAiPlatformContext(input: AiPlatformInput = {}): AiPlatformContext {
  const userId = input.userId ?? DEFAULT_MOCK_AI_USER_ID;

  return {
    userId,
    tenantId: input.tenantId ?? DEFAULT_MOCK_AI_SCOPE.tenantId,
    workspaceId: input.workspaceId ?? DEFAULT_MOCK_AI_SCOPE.workspaceId,
    businessId: input.businessId ?? DEFAULT_MOCK_AI_SCOPE.businessId,
    branchId: input.branchId ?? DEFAULT_MOCK_AI_SCOPE.branchId,
    activeAgentSlug: input.activeAgentSlug ?? null,
    activeConversationId: null,
    permissions: new Set(input.permissions ?? []),
  };
}

/** @deprecated Dev/test fixture builder — production uses ai-engine context injection. */
export function buildAiPlatformSnapshot(input: AiPlatformInput = {}): AiPlatformSnapshot {
  const context = buildAiPlatformContext(input);

  return {
    context,
    agents: aiAgentRegistry.list(),
    tools: toolRegistry.listEnabled(),
    conversations: [],
    memorySummary: "Production memory is managed by aiMemoryManager.",
    orchestrator: aiOrchestrator,
  };
}

export function getDefaultAiPlatformSnapshot(): AiPlatformSnapshot {
  return buildAiPlatformSnapshot();
}
