import { DEFAULT_MOCK_AI_SCOPE, DEFAULT_MOCK_AI_USER_ID } from "@/modules/ai/constants/mock-data";
import { aiOrchestrator } from "@/modules/ai/orchestrator/ai-orchestrator";
import { aiAgentRegistry } from "@/modules/ai/registry/agent-registry";
import { toolRegistry } from "@/modules/ai/registry/tool-registry";
import { memoryEngine } from "@/modules/ai/memory/memory-engine";
import { aiConversationManager } from "@/modules/ai/services/conversation-manager";
import type { AiAgentRuntimeContext } from "@/modules/ai/types/agent";
import type { AiPlatformContext } from "@/modules/ai/types/context";

export interface AiPlatformSnapshot {
  context: AiPlatformContext;
  agents: ReturnType<typeof aiAgentRegistry.list>;
  tools: ReturnType<typeof toolRegistry.listEnabled>;
  conversations: ReturnType<typeof aiConversationManager.list>;
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
    metadata: {
      businessName: "Harbour Kitchen",
      workspaceName: "Harbour Kitchen Workspace",
      userName: "Alex Harbour",
    },
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

export function buildAiPlatformSnapshot(input: AiPlatformInput = {}): AiPlatformSnapshot {
  const context = buildAiPlatformContext(input);
  const userId = context.userId;

  return {
    context,
    agents: aiAgentRegistry.list(),
    tools: toolRegistry.listEnabled(),
    conversations: aiConversationManager.list(userId),
    memorySummary: memoryEngine.summarize({
      workspaceId: context.workspaceId,
      businessId: context.businessId,
      userId: context.userId,
      limit: 8,
    }),
    orchestrator: aiOrchestrator,
  };
}

export function getDefaultAiPlatformSnapshot(): AiPlatformSnapshot {
  return buildAiPlatformSnapshot();
}
