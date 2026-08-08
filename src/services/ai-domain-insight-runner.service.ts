import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type { AiEngineChatResult } from "@/modules/ai-engine/types/ai-engine.types";
import { generateDomainAiInsight } from "@/services/ai-domain-engine.service";
import { resolveBusinessContextForOwner } from "@/services/ai-engine-context.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

export interface EngineInsightPayload {
  title: string;
  description?: string;
  category?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendation?: string;
  action?: string;
  expectedImpact?: string;
  confidenceScore?: number;
  metadata?: Record<string, unknown>;
}

export interface DomainInsightPersistInput {
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  recommendation?: string;
  action?: string;
  expectedImpact?: string;
  confidenceScore?: number;
  metadata?: Record<string, unknown>;
}

export interface DomainInsightTaskConfig {
  module: string;
  task: string;
  instructions?: string;
  loadContext: (ownerId: string) => Promise<object>;
  persistInsight: (businessId: string, insight: DomainInsightPersistInput) => Promise<unknown>;
  persistRecommendation?: (
    businessId: string,
    recommendation: DomainInsightPersistInput,
  ) => Promise<unknown>;
}


async function buildPlatformContextForOwner(ownerId: string): Promise<BusinessContext> {
  return resolveBusinessContextForOwner(ownerId);
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

export function parseEngineInsightPayloads(result: AiEngineChatResult): EngineInsightPayload[] {
  const parsed = extractJsonBlock(result.content);

  if (Array.isArray(parsed)) {
    return parsed.filter((entry) => entry && typeof entry === "object") as EngineInsightPayload[];
  }

  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;
    const insights = record.insights ?? record.recommendations ?? record.items;

    if (Array.isArray(insights)) {
      return insights.filter((entry) => entry && typeof entry === "object") as EngineInsightPayload[];
    }

    if (typeof record.title === "string") {
      return [record as unknown as EngineInsightPayload];
    }
  }

  if (result.content.trim()) {
    return [
      {
        title: "AI insight",
        description: result.content.trim().slice(0, 2000),
        category: "general",
        priority: "MEDIUM",
      },
    ];
  }

  return [];
}

export async function persistEngineInsights(
  businessId: string,
  result: AiEngineChatResult,
  persistInsight: DomainInsightTaskConfig["persistInsight"],
  persistRecommendation?: DomainInsightTaskConfig["persistRecommendation"],
): Promise<number> {
  const payloads = parseEngineInsightPayloads(result);
  let created = 0;

  for (const payload of payloads) {
    const isRecommendation = Boolean(payload.action ?? payload.expectedImpact);

    if (isRecommendation && persistRecommendation) {
      await persistRecommendation(businessId, {
        title: payload.title,
        description: payload.description,
        action: payload.action ?? payload.recommendation ?? "Review AI recommendation",
        expectedImpact: payload.expectedImpact,
        confidenceScore: payload.confidenceScore,
        metadata: payload.metadata,
      });
      created += 1;
      continue;
    }

    await persistInsight(businessId, {
      title: payload.title,
      description: payload.description,
      category: payload.category,
      priority: payload.priority,
      recommendation: payload.recommendation ?? payload.action,
      metadata: payload.metadata,
    });
    created += 1;
  }

  return created;
}

export interface DomainDetectionTaskConfig {
  module: string;
  task: string;
  instructions?: string;
  responseKey?: string;
  loadContext: (ownerId: string) => Promise<object>;
}

/** Routes domain detection/analysis through the centralized AI engine and parses JSON results. */
export async function runOwnerDomainDetectionTask<T>(
  ownerId: string,
  config: DomainDetectionTaskConfig,
): Promise<T[]> {
  const platform = await buildPlatformContextForOwner(ownerId);
  const context = await config.loadContext(ownerId);
  const responseKey = config.responseKey ?? "items";

  const result = await generateDomainAiInsight(platform, {
    module: config.module,
    task: config.task,
    context: context as Record<string, unknown>,
    instructions:
      config.instructions ??
      [
        "Analyze the context and return JSON only.",
        `Shape: { "${responseKey}": [{ ...analysis fields grounded in supplied data }] }`,
        "Provide actionable findings grounded in the supplied data.",
      ].join("\n"),
  });

  const parsed = extractJsonBlock(result.content);
  if (Array.isArray(parsed)) {
    return parsed as T[];
  }

  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;
    const items = record[responseKey] ?? record.alerts ?? record.opportunities ?? record.items;
    if (Array.isArray(items)) {
      return items.filter((entry) => entry && typeof entry === "object") as T[];
    }
  }

  return [];
}

/** Runs a domain insight task exclusively through the centralized AI engine. */
export async function runOwnerDomainInsightTask(
  ownerId: string,
  config: DomainInsightTaskConfig,
): Promise<number> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  const platform = await buildPlatformContextForOwner(ownerId);
  const context = await config.loadContext(ownerId);

  const result = await generateDomainAiInsight(platform, {
    module: config.module,
    task: config.task,
    context: context as Record<string, unknown>,
    instructions:
      config.instructions ??
      [
        "Analyze the context and return JSON only.",
        "Shape: { \"insights\": [{ \"title\": string, \"description\": string, \"category\": string, \"priority\": \"LOW\"|\"MEDIUM\"|\"HIGH\"|\"CRITICAL\", \"recommendation\": string }] }",
        "Provide 1-5 actionable insights grounded in the supplied data.",
      ].join("\n"),
  });

  return persistEngineInsights(
    business.id,
    result,
    config.persistInsight,
    config.persistRecommendation,
  );
}
