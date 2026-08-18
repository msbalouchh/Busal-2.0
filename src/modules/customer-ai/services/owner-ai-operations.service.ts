import "server-only";

import { prisma } from "@/lib/prisma";
import { aiConversationManager } from "@/modules/ai-engine/managers/conversation-manager";
import { aiContextInjectionEngine } from "@/modules/ai-engine/context/context-injection-engine";
import { aiProviderManager } from "@/modules/ai-engine/providers/provider-manager";
import { aiRateLimiter } from "@/modules/ai-engine/performance/rate-limiter";
import { composeCustomerSystemPrompt } from "@/modules/customer-ai/engine/customer-ai-prompt";
import { isMockFallbackAllowed } from "@/lib/production-mode";
import {
  CUSTOMER_AI_AUDIENCE,
  CUSTOMER_AI_MODULE,
} from "@/modules/customer-ai/constants/customer-ai.constants";
import { getCustomerAiIdentity } from "@/modules/customer-ai/services/customer-ai-identity.service";
import {
  buildUnifiedMemoryContext,
  loadBusinessContextSnapshot,
  loadOperationsMemoryContext,
  syncBusinessFactsToMemory,
} from "@/modules/customer-ai/services/customer-ai-memory.service";
import { getCustomerAiCapabilitiesByBusinessId } from "@/modules/customer-ai/services/customer-ai-settings.service";
import { recordCustomerAiEvent } from "@/modules/customer-ai/services/customer-ai-analytics.service";
import { listOwnerTools, executeBusinessToolCalls } from "@/modules/customer-ai/tools/tool-registry";
import { permissionsForOwner } from "@/modules/customer-ai/tools/tool-permission-service";
import { retrieveKnowledge } from "@/services/ai-knowledge.service";
import { resolveBusinessContextFromModule } from "@/services/ai-engine-context.service";
import { getConfiguration } from "@/services/settings-engine.service";
import { getBusinessRevenueSnapshot } from "@/modules/customer-ai/services/revenue-aggregation.service";
import type { CustomerAiChatInput, CustomerAiChatResult } from "@/modules/customer-ai/types/customer-ai.types";
import type { AiBusinessToolContext } from "@/modules/customer-ai/tools/tool-types";

const MAX_TOOL_ITERATIONS = 4;

/** Owner-facing AI operations chat — same brain, owner tools and permissions. */
export async function runOwnerAiOperationsChat(
  input: CustomerAiChatInput & { ownerId: string },
): Promise<CustomerAiChatResult> {
  const trimmed = input.message.trim();
  if (!trimmed) throw new Error("Message is required");

  const business = await prisma.business.findUniqueOrThrow({
    where: { id: input.businessId },
    select: { ownerId: true },
  });

  if (business.ownerId !== input.ownerId) {
    throw new Error("Unauthorized owner context.");
  }

  const [capabilities, identity, inferenceSettings] = await Promise.all([
    getCustomerAiCapabilitiesByBusinessId(input.businessId),
    getCustomerAiIdentity(input.businessId),
    resolveOwnerInferenceSettings(input.businessId, input.ownerId),
  ]);

  if (!capabilities.enabled) {
    throw new Error("Customer AI is not enabled for this business.");
  }

  aiRateLimiter.assertAllowed(`owner-ai-ops:${input.businessId}`);

  await syncBusinessFactsToMemory(input.businessId).catch(() => undefined);

  const platform = await resolveBusinessContextFromModule({
    businessId: input.businessId,
    userId: input.ownerId,
  });

  const [businessSnapshot, unifiedMemory, operationsMemory, knowledge] = await Promise.all([
    loadBusinessContextSnapshot(input.businessId, { query: trimmed }),
    buildUnifiedMemoryContext(input.businessId, input.conversationId),
    loadOperationsMemoryContext(input.businessId),
    retrieveKnowledge(platform, trimmed, { limit: 3, agentId: "owner-ai-ops" }).catch(() => null),
  ]);

  const injected = await aiContextInjectionEngine.buildFromPlatform(platform, {
    currentModule: CUSTOMER_AI_MODULE,
    query: trimmed,
    extraData: {
      businessSnapshot,
      unifiedMemory,
      operationsMemory,
      audience: CUSTOMER_AI_AUDIENCE.STAFF,
      ownerOperations: true,
    },
  });

  injected.relevantData = {
    ...injected.relevantData,
    businessSnapshot,
    unifiedMemory,
    operationsMemory,
    knowledge: knowledge ? { context: knowledge.context, citations: knowledge.citations.slice(0, 3) } : null,
  };

  const systemPrompt = `${composeCustomerSystemPrompt(injected, identity, {
    greeting: identity.aiGreeting,
    isWhiteLabel: Boolean(identity.whiteLabelName),
  })}

You are assisting the BUSINESS OWNER with operational questions and actions.
Use tools to retrieve REAL business data. Never invent orders, reservations, revenue, or inventory.
Distinguish between information you can look up and actions you can execute.
For destructive actions, always wait for explicit confirmation.`;

  const conversation = await getOrCreateOwnerConversation({
    businessId: input.businessId,
    conversationId: input.conversationId,
    title: trimmed,
  });

  const history = await aiConversationManager.getMessagesForPrompt(conversation.id);
  await aiConversationManager.appendMessage(conversation.id, "USER", trimmed);

  const toolContext: AiBusinessToolContext = {
    businessId: input.businessId,
    branchId: platform.branchId,
    ownerId: input.ownerId,
    conversationId: conversation.id,
    channel: input.channel ?? "dashboard",
    audience: "OWNER",
    confirmedActions: input.confirmedActions,
    permissions: permissionsForOwner(),
    requireConfirmation: true,
  };

  const tools = listOwnerTools();
  let content = "";
  let model = inferenceSettings.model ?? "default";
  const toolResults: CustomerAiChatResult["toolResults"] = [];
  const requiresConfirmation: CustomerAiChatResult["requiresConfirmation"] = [];
  const messages = [...history, { role: "user" as const, content: trimmed }];

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration += 1) {
    const response = await aiProviderManager.complete(
      {
        systemPrompt,
        messages,
        model: inferenceSettings.model,
        temperature: inferenceSettings.temperature,
        maxTokens: inferenceSettings.maxTokens,
        tools: tools.length > 0 ? tools : undefined,
      },
      { allowFallback: isMockFallbackAllowed() },
    );

    content = response.content;
    model = response.model;
    if (response.toolCalls.length === 0) break;

    const iterationResults = await executeBusinessToolCalls({
      toolCalls: response.toolCalls,
      context: toolContext,
    });

    for (const result of iterationResults) {
      toolResults.push({ toolId: result.toolId, output: result.output });
      if (result.output.requiresConfirmation) {
        requiresConfirmation.push({
          actionId: String(result.output.actionId ?? result.toolId),
          description: String(result.output.message ?? "Confirmation required"),
        });
      }
    }

    messages.push({ role: "assistant", content: response.content || "Checking…" });
    for (const result of iterationResults) {
      messages.push({
        role: "user",
        content: `Tool ${result.toolId} result: ${JSON.stringify(result.output)}`,
      });
    }
  }

  await aiConversationManager.appendMessage(conversation.id, "ASSISTANT", content);

  await recordCustomerAiEvent({
    businessId: input.businessId,
    conversationId: conversation.id,
    eventType: "owner_operations_query",
    channel: input.channel ?? "dashboard",
  });

  return {
    conversationId: conversation.id,
    sessionToken: input.sessionToken ?? conversation.id,
    content,
    aiName: identity.aiName,
    aiAvatarUrl: identity.aiAvatarUrl,
    greeting: identity.aiGreeting,
    model,
    toolResults,
    requiresConfirmation: requiresConfirmation.length > 0 ? requiresConfirmation : undefined,
    escalated: false,
  };
}

async function resolveOwnerInferenceSettings(businessId: string, ownerId: string) {
  const platform = await resolveBusinessContextFromModule({ businessId, userId: ownerId });
  const [modelConfig, tempConfig, tokenConfig] = await Promise.all([
    getConfiguration(platform, "ai.default_model"),
    getConfiguration(platform, "ai.temperature"),
    getConfiguration(platform, "ai.token_limit"),
  ]);
  return {
    model: typeof modelConfig?.value === "string" ? modelConfig.value : undefined,
    temperature: typeof tempConfig?.value === "number" ? tempConfig.value : 0.5,
    maxTokens: typeof tokenConfig?.value === "number" ? tokenConfig.value : 4096,
  };
}

async function getOrCreateOwnerConversation(input: {
  businessId: string;
  conversationId?: string;
  title: string;
}): Promise<{ id: string }> {
  if (input.conversationId) {
    const existing = await prisma.aIConversation.findFirst({
      where: {
        id: input.conversationId,
        businessId: input.businessId,
        audienceType: CUSTOMER_AI_AUDIENCE.STAFF,
      },
    });
    if (existing) return { id: existing.id };
  }

  const created = await prisma.aIConversation.create({
    data: {
      businessId: input.businessId,
      channel: "owner-operations",
      audienceType: CUSTOMER_AI_AUDIENCE.STAFF,
      title: input.title.slice(0, 80),
    },
  });

  return { id: created.id };
}

export async function getOwnerOperationsOverview(businessId: string, ownerId: string) {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { ownerId: true },
  });
  if (business.ownerId !== ownerId) throw new Error("Unauthorized");

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const [conversations, escalations, actions, ordersCount, reservationsCount, revenue] =
    await Promise.all([
      prisma.aIConversation.count({
        where: { businessId, audienceType: "CUSTOMER", createdAt: { gte: start } },
      }),
      prisma.customerAiEvent.count({
        where: { businessId, eventType: "escalated", createdAt: { gte: start } },
      }),
      prisma.customerAiActionLog.count({
        where: { businessId, createdAt: { gte: start } },
      }),
      prisma.restaurantOrder.count({ where: { businessId, placedAt: { gte: start } } }).catch(() => null),
      prisma.reservation.count({
        where: { businessId, reservationDate: { gte: start } },
      }).catch(() => null),
      getBusinessRevenueSnapshot(businessId),
    ]);

  return {
    aiConversationsToday: conversations,
    escalationsToday: escalations,
    aiActionsToday: actions,
    ordersToday: ordersCount,
    reservationsToday: reservationsCount,
    revenueToday: revenue.revenueAvailable
      ? (revenue.periods.find((period) => period.period === "today")?.revenueAmount ?? null)
      : null,
    revenueAvailable: revenue.revenueAvailable,
    revenueSnapshot: revenue,
  };
}
