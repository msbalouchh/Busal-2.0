import { aiAgentRegistry } from "@/modules/ai/registry/agent-registry";
import { toolRegistry } from "@/modules/ai/registry/tool-registry";
import { memoryEngine } from "@/modules/ai/memory/memory-engine";
import { promptEngine } from "@/modules/ai/prompts/prompt-engine";
import { aiConversationManager } from "@/modules/ai/services/conversation-manager";
import { createResponsePipeline } from "@/modules/ai/services/response-pipeline";
import { localAiProvider } from "@/modules/ai/providers/local-ai-provider";
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

/** Central orchestrator coordinating agents, memory, tools, and the response pipeline. */
export class AIOrchestrator {
  constructor(private readonly provider: AiProvider = localAiProvider) {}

  async run(input: OrchestratorRunInput): Promise<OrchestratorRunResult> {
    const agent = aiAgentRegistry.getOrThrow(input.agentSlug);
    const conversation = input.conversationId
      ? aiConversationManager.getOrThrow(input.conversationId)
      : aiConversationManager.create({
          agentSlug: input.agentSlug,
          userId: input.runtime.userId,
          workspaceId: input.runtime.workspaceId,
          businessId: input.runtime.businessId,
        });

    aiConversationManager.addMessage({
      conversationId: conversation.id,
      content: input.userMessage,
      role: "user",
    });

    const memorySummary = memoryEngine.summarize({
      workspaceId: input.runtime.workspaceId,
      businessId: input.runtime.businessId,
      userId: input.runtime.userId,
      agentSlug: input.agentSlug,
      limit: 5,
    });

    const toolSummary = agent.toolSlugs
      .map((slug) => toolRegistry.get(slug)?.name ?? slug)
      .join(", ");

    const composed = promptEngine.composeAgentSystemPrompt({
      agentName: agent.name,
      agentDescription: agent.description,
      businessName: input.runtime.metadata.businessName,
      workspaceName: input.runtime.metadata.workspaceName,
      userName: input.runtime.metadata.userName,
      memorySummary,
      toolSummary,
    });

    const pipeline = createResponsePipeline({
      provider: input.provider ?? this.provider,
      toolSlugs: agent.toolSlugs,
    });

    const result = await pipeline.run({
      agentSlug: input.agentSlug,
      conversationId: conversation.id,
      userMessage: input.userMessage,
      messages: aiConversationManager.getMessages(conversation.id),
      systemPrompt: composed.systemPrompt,
      toolCalls: [],
    });

    aiConversationManager.addAssistantMessage(conversation.id, result.response.content);

    memoryEngine.writeAgentMemory(input.agentSlug, "last-run", result.response.content, {
      workspaceId: input.runtime.workspaceId,
      businessId: input.runtime.businessId,
      userId: input.runtime.userId,
      tenantId: input.runtime.tenantId,
      conversationId: conversation.id,
    });

    return {
      conversation: aiConversationManager.getOrThrow(conversation.id),
      response: result.response,
      stagesExecuted: result.stagesExecuted,
      durationMs: result.durationMs,
    };
  }

  listAgents() {
    return aiAgentRegistry.list();
  }

  listTools() {
    return toolRegistry.listEnabled();
  }
}

export const aiOrchestrator = new AIOrchestrator();
