import type { IAIAgent } from "@/modules/ai-agent-platform-management/interfaces/ai-agent.interface";
import type { IAIContext } from "@/modules/ai-agent-platform-management/interfaces/ai-context.interface";
import type { IAIResponse } from "@/modules/ai-agent-platform-management/interfaces/ai-response.interface";

export interface IAIExecutor {
  execute(
    agent: IAIAgent,
    context: IAIContext,
    input: Record<string, unknown>,
  ): Promise<IAIResponse>;
}

export interface IAIExecutionResult {
  executionId: string;
  response: IAIResponse;
  durationMs: number;
}
