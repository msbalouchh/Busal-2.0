import type { AiAgentResponse, AiAgentRuntimeContext } from "@/modules/ai/types/agent";
import type { AiConversation } from "@/modules/ai/types/conversation";
import type { AiProvider } from "@/modules/ai/types/context";

export interface OrchestratorRunInput {
  agentSlug: string;
  userMessage: string;
  conversationId?: string;
  runtime: AiAgentRuntimeContext;
  provider?: AiProvider;
}

export interface OrchestratorRunResult {
  conversation: AiConversation;
  response: AiAgentResponse;
  stagesExecuted: string[];
  durationMs: number;
}

/** Delegates to the centralized production AI engine. */
export class AIOrchestrator {
  constructor(_provider?: AiProvider) {}

  async run(input: OrchestratorRunInput): Promise<OrchestratorRunResult> {
    const { aiEngine } = await import("@/modules/ai-engine/engine/ai-engine");
    const { requireBusinessContextForPlatformApi } = await import(
      "@/modules/platform-guards/guards/business.guards"
    );

    const platform = await requireBusinessContextForPlatformApi();

    const startedAt = Date.now();
    const result = await aiEngine.chat(platform, {
      message: input.userMessage,
      conversationId: input.conversationId,
      agentSlug: input.agentSlug,
      currentModule: "ai-orchestrator",
      enableTools: true,
    });

    const conversation: AiConversation = {
      id: result.conversationId,
      agentSlug: input.agentSlug,
      userId: input.runtime.userId,
      workspaceId: input.runtime.workspaceId,
      businessId: input.runtime.businessId,
      title: input.userMessage.slice(0, 80),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    return {
      conversation,
      response: {
        content: result.content,
        agentSlug: input.agentSlug,
        toolCalls: result.toolCalls.map((call) => call.name),
        memoryKeysWritten: [`session:${result.conversationId}`],
        providerId: result.providerId,
        model: result.model,
      },
      stagesExecuted: ["context-injection", "provider-complete", "tool-execution", "audit"],
      durationMs: Date.now() - startedAt,
    };
  }

  listAgents() {
    return import("@/modules/ai/registry/agent-registry").then((mod) => mod.aiAgentRegistry.list());
  }

  listTools() {
    return import("@/modules/ai/registry/tool-registry").then((mod) => mod.toolRegistry.listEnabled());
  }
}

export const aiOrchestrator = new AIOrchestrator();
