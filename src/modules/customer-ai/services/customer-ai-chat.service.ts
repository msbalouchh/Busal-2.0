import "server-only";

import { prisma } from "@/lib/prisma";
import {
  aiAuditService,
  calculateTokenCostCents,
} from "@/modules/ai-engine/context/context-injection-engine";
import { aiContextInjectionEngine } from "@/modules/ai-engine/context/context-injection-engine";
import { aiConversationManager } from "@/modules/ai-engine/managers/conversation-manager";
import { aiMemoryManager, aiUsageService } from "@/modules/ai-engine/managers/memory-manager";
import { aiProviderManager } from "@/modules/ai-engine/providers/provider-manager";
import { aiRateLimiter } from "@/modules/ai-engine/performance/rate-limiter";
import { composeCustomerSystemPrompt } from "@/modules/customer-ai/engine/customer-ai-prompt";
import { isMockFallbackAllowed } from "@/lib/production-mode";
import {
  CUSTOMER_AI_AUDIENCE,
  CUSTOMER_AI_EVENT_TYPES,
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
import {
  createCustomerAiSession,
  resolveCustomerAiSession,
} from "@/modules/customer-ai/services/customer-identity.service";
import { recordCustomerAiEvent } from "@/modules/customer-ai/services/customer-ai-analytics.service";
import {
  executeCustomerAiToolCalls,
  listCustomerAiTools,
  type CustomerToolContext,
} from "@/modules/customer-ai/tools/customer-ai-tools";
import { retrieveKnowledge } from "@/services/ai-knowledge.service";
import { resolveBusinessContextFromModule } from "@/services/ai-engine-context.service";
import { getConfiguration } from "@/services/settings-engine.service";
import type { AiProviderId } from "@/modules/ai-engine/types/ai-engine.types";
import type {
  CustomerAiChatInput,
  CustomerAiChatResult,
  CustomerAiPublicConfig,
} from "@/modules/customer-ai/types/customer-ai.types";

const MAX_TOOL_ITERATIONS = 3;

export async function getCustomerAiPublicConfig(
  businessId: string,
): Promise<CustomerAiPublicConfig> {
  const [identity, capabilities] = await Promise.all([
    getCustomerAiIdentity(businessId),
    getCustomerAiCapabilitiesByBusinessId(businessId),
  ]);

  return {
    businessId,
    aiName: identity.aiName,
    aiAvatarUrl: identity.aiAvatarUrl,
    aiGreeting: identity.aiGreeting,
    aiTone: identity.aiTone,
    businessName: identity.whiteLabelName ?? identity.businessName,
    whiteLabelName: identity.whiteLabelName,
    enabled: capabilities.enabled,
  };
}

async function resolveAiInferenceSettings(businessId: string, ownerId: string): Promise<{
  model?: string;
  temperature?: number;
  maxTokens?: number;
}> {
  const platform = await resolveBusinessContextFromModule({ businessId, userId: ownerId });
  const [modelConfig, tempConfig, tokenConfig] = await Promise.all([
    getConfiguration(platform, "ai.default_model"),
    getConfiguration(platform, "ai.temperature"),
    getConfiguration(platform, "ai.token_limit"),
  ]);

  return {
    model: typeof modelConfig?.value === "string" ? modelConfig.value : undefined,
    temperature: typeof tempConfig?.value === "number" ? tempConfig.value : 0.7,
    maxTokens: typeof tokenConfig?.value === "number" ? tokenConfig.value : 4096,
  };
}

async function getOrCreateCustomerConversation(input: {
  businessId: string;
  conversationId?: string;
  customerId?: string | null;
  channel: string;
  title: string;
}): Promise<{ id: string }> {
  if (input.conversationId) {
    const existing = await prisma.aIConversation.findFirst({
      where: {
        id: input.conversationId,
        businessId: input.businessId,
        audienceType: CUSTOMER_AI_AUDIENCE.CUSTOMER,
      },
    });
    if (existing) return { id: existing.id };
  }

  const created = await prisma.aIConversation.create({
    data: {
      businessId: input.businessId,
      customerId: input.customerId ?? null,
      channel: input.channel,
      audienceType: CUSTOMER_AI_AUDIENCE.CUSTOMER,
      title: input.title.slice(0, 80),
    },
  });

  await recordCustomerAiEvent({
    businessId: input.businessId,
    conversationId: created.id,
    eventType: CUSTOMER_AI_EVENT_TYPES.CONVERSATION_STARTED,
    channel: input.channel,
  });

  return { id: created.id };
}

/** Main customer-facing AI chat — routes through ai-engine providers with tenant-branded context. */
export async function runCustomerAiChat(input: CustomerAiChatInput): Promise<CustomerAiChatResult> {
  const trimmed = input.message.trim();
  if (!trimmed) {
    throw new Error("Message is required");
  }

  const business = await prisma.business.findUniqueOrThrow({
    where: { id: input.businessId },
    select: { ownerId: true },
  });

  const [capabilities, identity, inferenceSettings] = await Promise.all([
    getCustomerAiCapabilitiesByBusinessId(input.businessId),
    getCustomerAiIdentity(input.businessId),
    resolveAiInferenceSettings(input.businessId, business.ownerId),
  ]);

  if (!capabilities.enabled) {
    throw new Error("Customer AI is not enabled for this business.");
  }

  await aiUsageService.assertAllowed(input.businessId);
  aiRateLimiter.assertAllowed(`customer-ai:${input.businessId}`);

  let sessionToken = input.sessionToken;
  let session = sessionToken
    ? await resolveCustomerAiSession(sessionToken, input.businessId)
    : null;

  if (!session) {
    session = await createCustomerAiSession({
      businessId: input.businessId,
      channel: input.channel ?? "website",
      customerId: input.customerId,
    });
    sessionToken = session.sessionToken;
  }

  const customerId = session.customerId ?? input.customerId ?? null;
  const channel = input.channel ?? session.channel ?? "website";

  await syncBusinessFactsToMemory(input.businessId).catch(() => undefined);

  const platform = await resolveBusinessContextFromModule({
    businessId: input.businessId,
    userId: business.ownerId,
  });
  const [businessSnapshot, unifiedMemory, operationsMemory, knowledge] = await Promise.all([
    loadBusinessContextSnapshot(input.businessId, { query: trimmed }),
    buildUnifiedMemoryContext(input.businessId, input.conversationId),
    loadOperationsMemoryContext(input.businessId).catch(() => ""),
    retrieveKnowledge(platform, trimmed, { limit: 3, agentId: "customer-ai" }).catch(() => null),
  ]);

  const injected = await aiContextInjectionEngine.buildFromPlatform(platform, {
    currentModule: CUSTOMER_AI_MODULE,
    query: trimmed,
    extraData: {
      businessSnapshot,
      unifiedMemory,
      operationsMemory,
      audience: CUSTOMER_AI_AUDIENCE.CUSTOMER,
      channel,
      customerId,
    },
  });

  injected.relevantData = {
    ...injected.relevantData,
    businessSnapshot,
    unifiedMemory,
    operationsMemory,
    knowledge: knowledge
      ? {
          context: knowledge.context,
          citations: knowledge.citations.slice(0, 3),
        }
      : null,
  };

  injected.businessProfile = {
    ...injected.businessProfile,
    aiName: identity.aiName,
    aiPersonality: identity.aiPersonality,
    aiTone: identity.aiTone,
    aiGreeting: identity.aiGreeting,
    aiAvatarUrl: identity.aiAvatarUrl,
  };

  const systemPrompt = composeCustomerSystemPrompt(injected, identity, {
    greeting: identity.aiGreeting,
    isWhiteLabel: Boolean(identity.whiteLabelName),
  });

  const conversation = await getOrCreateCustomerConversation({
    businessId: input.businessId,
    conversationId: input.conversationId,
    customerId,
    channel,
    title: trimmed,
  });

  const history = await aiConversationManager.getMessagesForPrompt(conversation.id);
  await aiConversationManager.appendMessage(conversation.id, "USER", trimmed);

  const toolContext: CustomerToolContext = {
    businessId: input.businessId,
    branchId: platform.branchId,
    customerId,
    sessionToken: sessionToken ?? undefined,
    conversationId: conversation.id,
    channel,
    capabilities,
    confirmedActions: input.confirmedActions,
  };

  const tools = listCustomerAiTools(capabilities);
  let content = "";
  let model = inferenceSettings.model ?? "default";
  let providerId: AiProviderId = "mock-fallback";
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
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

    totalPromptTokens += response.promptTokens;
    totalCompletionTokens += response.completionTokens;
    content = response.content;
    model = response.model;
    providerId = response.providerId;

    if (response.toolCalls.length === 0) break;

    const iterationResults = await executeCustomerAiToolCalls({
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
        await recordCustomerAiEvent({
          businessId: input.businessId,
          conversationId: conversation.id,
          eventType: CUSTOMER_AI_EVENT_TYPES.CONFIRMATION_REQUIRED,
          channel,
          metadata: { toolId: result.toolId },
        });
      }

      if (result.toolId.includes("reservation") && !result.output.error) {
        await recordCustomerAiEvent({
          businessId: input.businessId,
          conversationId: conversation.id,
          eventType: CUSTOMER_AI_EVENT_TYPES.RESERVATION_ASSISTED,
          channel,
        });
      }

      if (result.toolId.includes("order") && !result.output.error) {
        await recordCustomerAiEvent({
          businessId: input.businessId,
          conversationId: conversation.id,
          eventType: CUSTOMER_AI_EVENT_TYPES.ORDER_ASSISTED,
          channel,
        });
      }

      await recordCustomerAiEvent({
        businessId: input.businessId,
        conversationId: conversation.id,
        eventType: CUSTOMER_AI_EVENT_TYPES.TOOL_EXECUTED,
        channel,
        metadata: { toolId: result.toolId },
      });
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

  await aiMemoryManager.write({
    businessId: input.businessId,
    scope: "business",
    key: `customer-chat:${conversation.id}`,
    content: content.slice(0, 2000),
  });

  const provider = aiProviderManager.resolveProvider({ preferredProviderId: providerId });
  const modelDef = provider.models.find((entry) => entry.id === model) ?? provider.models[0];
  const costCents = calculateTokenCostCents({
    promptTokens: totalPromptTokens,
    completionTokens: totalCompletionTokens,
    inputCostPer1k: modelDef?.inputCostPer1kTokens ?? 0,
    outputCostPer1k: modelDef?.outputCostPer1kTokens ?? 0,
  });

  await aiAuditService.log({
    businessId: input.businessId,
    userId: business.ownerId,
    entityType: "customer_conversation",
    entityId: conversation.id,
    action: "customer.chat.complete",
    metadata: {
      model,
      providerId,
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
      totalTokens: totalPromptTokens + totalCompletionTokens,
      costCents,
      channel,
      customerId,
      messagePreview: trimmed.slice(0, 500),
      responsePreview: content.slice(0, 500),
    },
  });

  await aiUsageService.recordUsage({
    businessId: input.businessId,
    tokens: totalPromptTokens + totalCompletionTokens,
    userId: business.ownerId,
  });

  await recordCustomerAiEvent({
    businessId: input.businessId,
    conversationId: conversation.id,
    eventType: CUSTOMER_AI_EVENT_TYPES.QUESTION_ANSWERED,
    channel,
  });

  return {
    conversationId: conversation.id,
    sessionToken: sessionToken ?? session.sessionToken,
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
