import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { aiEngine } from "@/modules/ai-engine/engine/ai-engine";
import type {
  AiEngineChatInput,
  AiEngineChatResult,
  AiEngineInsightInput,
  AiEngineInsightResult,
} from "@/modules/ai-engine/types/ai-engine.types";
import {
  resolveBusinessContextForOwner,
  resolveBusinessContextFromModule,
  type ModulePlatformContext,
} from "@/services/ai-engine-context.service";

export {
  generateDomainAiInsight,
  type AiDomainInsightRequest,
} from "@/services/ai-domain-engine.service";

export {
  runOwnerDomainDetectionTask,
  runOwnerDomainInsightTask,
  parseEngineInsightPayloads,
  persistEngineInsights,
  type DomainDetectionTaskConfig,
  type DomainInsightTaskConfig,
  type EngineInsightPayload,
} from "@/services/ai-domain-insight-runner.service";

export type { ModulePlatformContext } from "@/services/ai-engine-context.service";
export { resolveBusinessContextForOwner, resolveBusinessContextFromModule } from "@/services/ai-engine-context.service";

/** Routes chat inference exclusively through the centralized AI engine. */
export async function runCentralAiChat(
  platform: BusinessContext,
  input: AiEngineChatInput,
): Promise<AiEngineChatResult> {
  return aiEngine.chat(platform, input);
}

/** Routes insight inference exclusively through the centralized AI engine. */
export async function runCentralAiInsight(
  platform: BusinessContext,
  input: AiEngineInsightInput,
): Promise<AiEngineInsightResult> {
  return aiEngine.generateInsight(platform, input);
}

/** Owner-scoped chat through centralized AI engine with automatic context injection. */
export async function runCentralAiChatForOwner(
  ownerId: string,
  input: Omit<AiEngineChatInput, "conversationId"> & { conversationId?: string },
): Promise<AiEngineChatResult> {
  const platform = await resolveBusinessContextForOwner(ownerId);
  return runCentralAiChat(platform, input);
}

/** Owner-scoped insight through centralized AI engine with automatic context injection. */
export async function runCentralAiInsightForOwner(
  ownerId: string,
  input: AiEngineInsightInput,
): Promise<AiEngineInsightResult> {
  const platform = await resolveBusinessContextForOwner(ownerId);
  return runCentralAiInsight(platform, input);
}

function extractJsonBlock(content: string): unknown {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // fall through
    }
  }

  const objectMatch = content.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch {
      // fall through
    }
  }

  return null;
}

/** Module-scoped JSON inference through centralized AI engine. */
export async function runModuleAiJsonTask<T>(
  platform: BusinessContext,
  input: {
    module: string;
    task: string;
    context: Record<string, unknown>;
    instructions?: string;
  },
): Promise<T | null> {
  const prompt = [
    `Module: ${input.module}`,
    `Task: ${input.task}`,
    input.instructions ?? "Return JSON only with actionable results grounded in supplied data.",
    `Context:\n${JSON.stringify(input.context, null, 2)}`,
  ].join("\n\n");

  const result = await runCentralAiInsight(platform, {
    currentModule: input.module,
    prompt,
    contextData: input.context,
    responseFormat: "json",
  });

  if (result.parsed) {
    return result.parsed as T;
  }

  const parsed = extractJsonBlock(result.content);
  if (parsed && typeof parsed === "object") {
    return parsed as T;
  }

  return null;
}

export async function resolveModuleBusinessContext(
  context: ModulePlatformContext,
): Promise<BusinessContext> {
  return resolveBusinessContextFromModule(context);
}
