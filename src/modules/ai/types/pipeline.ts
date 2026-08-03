import type { AiMessage } from "@/modules/ai/types/conversation";
import type { AiAgentResponse } from "@/modules/ai/types/agent";
import type { AiToolCall } from "@/modules/ai/types/tool";

export interface AiPipelineStage {
  id: string;
  name: string;
  order: number;
}

export interface AiPipelineContext {
  agentSlug: string;
  conversationId: string;
  userMessage: string;
  messages: AiMessage[];
  systemPrompt: string;
  toolCalls: AiToolCall[];
}

export interface AiPipelineResult {
  response: AiAgentResponse;
  stagesExecuted: string[];
  durationMs: number;
}

export interface AiActionRequest {
  agentSlug: string;
  toolSlug: string;
  input: Record<string, unknown>;
  conversationId?: string;
}

export interface AiActionResult {
  success: boolean;
  output: string;
  toolSlug: string;
  executedAt: string;
}
