import { memoryEngine } from "@/modules/ai/memory/memory-engine";
import { aiActionExecutor } from "@/modules/ai/services/action-executor";
import type { AiAgentResponse } from "@/modules/ai/types/agent";
import type {
  AiPipelineContext,
  AiPipelineResult,
  AiPipelineStage,
} from "@/modules/ai/types/pipeline";
import type { AiProvider, AiProviderResponse } from "@/modules/ai/types/context";

const PIPELINE_STAGES: AiPipelineStage[] = [
  { id: "load-context", name: "Load Context", order: 1 },
  { id: "compose-prompt", name: "Compose Prompt", order: 2 },
  { id: "invoke-provider", name: "Invoke Provider", order: 3 },
  { id: "execute-tools", name: "Execute Tools", order: 4 },
  { id: "write-memory", name: "Write Memory", order: 5 },
  { id: "finalize-response", name: "Finalize Response", order: 6 },
];

export interface ResponsePipelineOptions {
  provider: AiProvider;
  toolSlugs?: string[];
}

/** Processes AI requests through a staged response pipeline (mock). */
export class AIResponsePipeline {
  constructor(private readonly options: ResponsePipelineOptions) {}

  getStages(): AiPipelineStage[] {
    return PIPELINE_STAGES;
  }

  async run(context: AiPipelineContext): Promise<AiPipelineResult> {
    const startedAt = Date.now();
    const stagesExecuted: string[] = [];
    const toolSlugs = this.options.toolSlugs ?? [];

    stagesExecuted.push("load-context");

    stagesExecuted.push("compose-prompt");

    stagesExecuted.push("invoke-provider");
    const providerResponse = await this.options.provider.complete({
      systemPrompt: context.systemPrompt,
      messages: [
        ...context.messages.map((message) => ({
          role: message.role as "system" | "user" | "assistant",
          content: message.content,
        })),
        { role: "user" as const, content: context.userMessage },
      ],
      agentSlug: context.agentSlug,
    });

    stagesExecuted.push("execute-tools");
    const toolCallIds: string[] = [];

    for (const toolSlug of toolSlugs.slice(0, 1)) {
      const actionResult = await aiActionExecutor.execute({
        agentSlug: context.agentSlug,
        toolSlug,
        input: { query: context.userMessage },
        conversationId: context.conversationId,
      });

      if (actionResult.success) {
        toolCallIds.push(toolSlug);
      }
    }

    stagesExecuted.push("write-memory");
    const memoryEntry = memoryEngine.writeConversationMemory(
      context.conversationId,
      "last-response",
      providerResponse.content,
      {
        agentSlug: context.agentSlug,
        userId: null,
        workspaceId: null,
        businessId: null,
        tenantId: null,
      },
    );

    stagesExecuted.push("finalize-response");
    const response = this.buildAgentResponse(context, providerResponse, toolCallIds, [
      memoryEntry.key,
    ]);

    return {
      response,
      stagesExecuted,
      durationMs: Date.now() - startedAt,
    };
  }

  private buildAgentResponse(
    context: AiPipelineContext,
    providerResponse: AiProviderResponse,
    toolCalls: string[],
    memoryKeysWritten: string[],
  ): AiAgentResponse {
    return {
      content: providerResponse.content,
      agentSlug: context.agentSlug,
      toolCalls,
      memoryKeysWritten,
      providerId: providerResponse.providerId,
      model: providerResponse.model,
    };
  }
}

export function createResponsePipeline(options: ResponsePipelineOptions): AIResponsePipeline {
  return new AIResponsePipeline(options);
}
