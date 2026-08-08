import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { aiEngine } from "@/modules/ai-engine/engine/ai-engine";
import type { AiEngineChatResult } from "@/modules/ai-engine/types/ai-engine.types";

export interface AiDomainInsightRequest {
  module: string;
  task: string;
  context: Record<string, unknown>;
  instructions?: string;
}

/** Routes all domain AI insight generation through the centralized AI engine. */
export async function generateDomainAiInsight(
  platform: BusinessContext,
  request: AiDomainInsightRequest,
): Promise<AiEngineChatResult> {
  const prompt = [
    `Module: ${request.module}`,
    `Task: ${request.task}`,
    request.instructions ?? "Provide concise operational insights and recommended actions as JSON.",
    `Context:\n${JSON.stringify(request.context, null, 2)}`,
  ].join("\n\n");

  return aiEngine.chat(platform, {
    message: prompt,
    currentModule: request.module,
    enableTools: true,
    temperature: 0.2,
  });
}
