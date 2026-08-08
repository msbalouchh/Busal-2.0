import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import type {
  AiEngineChatInput,
  AiEngineChatResult,
  AiEngineInsightInput,
  AiEngineInsightResult,
  AiProviderId,
} from "@/modules/ai-engine/types/ai-engine.types";
import {
  aiAuditService,
  aiContextInjectionEngine,
  calculateTokenCostCents,
} from "@/modules/ai-engine/context/context-injection-engine";
import { aiConversationManager } from "@/modules/ai-engine/managers/conversation-manager";
import { aiMemoryManager, aiUsageService } from "@/modules/ai-engine/managers/memory-manager";
import { aiPromptManager } from "@/modules/ai-engine/managers/prompt-manager";
import { aiProviderManager } from "@/modules/ai-engine/providers/provider-manager";
import { aiResponseCache } from "@/modules/ai-engine/performance/response-cache";
import { aiRateLimiter, aiRequestQueue } from "@/modules/ai-engine/performance/rate-limiter";
import { aiToolExecutionFacade } from "@/modules/ai-engine/tools/tool-execution-facade";
import { DOMAIN_EVENT_TYPES } from "@/modules/platform-orchestration/constants/domain-events";
import { publishModuleDomainEvent } from "@/modules/platform-orchestration/lib/publish-module-event";
import type { DomainEventEnvelope } from "@/modules/platform-orchestration/types/domain-event.types";

const MAX_TOOL_ITERATIONS = 3;

/** Central Busal AI production engine — all modules must route inference here. */
export class AiEngine {
  async chat(platform: BusinessContext, input: AiEngineChatInput): Promise<AiEngineChatResult> {
    return aiRequestQueue.enqueue(() => this.chatInternal(platform, input));
  }

  async generateInsight(
    platform: BusinessContext,
    input: AiEngineInsightInput,
  ): Promise<AiEngineInsightResult> {
    return aiRequestQueue.enqueue(() => this.generateInsightInternal(platform, input));
  }

  async handleDomainEvent(event: DomainEventEnvelope): Promise<Record<string, unknown>> {
    await aiMemoryManager.write({
      businessId: event.businessId,
      scope: "business",
      key: `event:${event.eventType}`,
      content: JSON.stringify({
        aggregateId: event.aggregateId,
        payload: event.payload,
        at: new Date().toISOString(),
      }),
    });

    await publishModuleDomainEvent(
      {
        tenantId: event.tenantId,
        workspaceId: event.workspaceId,
        businessId: event.businessId,
        branchId: event.branchId,
        userId: event.userId,
      },
      {
        eventType: DOMAIN_EVENT_TYPES.AI_CONTEXT_UPDATED,
        aggregateId: event.aggregateId,
        payload: { sourceEvent: event.eventType },
      },
    );

    return {
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      contextUpdated: true,
      updatedAt: new Date().toISOString(),
    };
  }

  listProviders() {
    return aiProviderManager.listProviders();
  }

  private async chatInternal(
    platform: BusinessContext,
    input: AiEngineChatInput,
  ): Promise<AiEngineChatResult> {
    const businessId = platform.business.id;
    await aiUsageService.assertAllowed(businessId);
    aiRateLimiter.assertAllowed(`ai:${businessId}:${platform.user.id}`);

    const injected = await aiContextInjectionEngine.buildFromPlatform(platform, {
      currentModule: input.currentModule ?? null,
      query: input.message,
      extraData: input.metadata,
    });

    const conversation = await aiConversationManager.getOrCreate({
      businessId,
      conversationId: input.conversationId,
      staffId: platform.staffSession?.staffId ?? null,
      title: input.message.slice(0, 80),
    });

    const history = await aiConversationManager.getMessagesForPrompt(conversation.id);
    const composed = aiPromptManager.composeChatPrompt(injected, input.message);

    const cacheKey = [
      businessId,
      input.currentModule ?? "platform",
      input.message,
      composed.systemPrompt.slice(0, 200),
    ];
    const cached = aiResponseCache.get<AiEngineChatResult>(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    await aiConversationManager.appendMessage(conversation.id, "USER", input.message);

    const tools =
      input.enableTools !== false
        ? aiToolExecutionFacade.listAvailableTools(platform, input.currentModule ?? null)
        : [];

    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalToolCalls: AiEngineChatResult["toolCalls"] = [];
    let toolResults: AiEngineChatResult["toolResults"] = [];
    let content = "";
    let model = input.model ?? "default";
    let providerId: AiProviderId = "mock-fallback";
    let latencyMs = 0;
    let attempts = 0;

    const messages = [
      ...history,
      { role: "user" as const, content: input.message },
    ];

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration += 1) {
      const response = await aiProviderManager.complete(
        {
          systemPrompt: composed.systemPrompt,
          messages,
          model: input.model,
          temperature: input.temperature,
          maxTokens: input.maxTokens,
          tools: tools.length > 0 ? tools : undefined,
        },
        {
          preferredProviderId: input.providerId,
          preferredModel: input.model,
        },
      );

      totalPromptTokens += response.promptTokens;
      totalCompletionTokens += response.completionTokens;
      content = response.content;
      model = response.model;
      providerId = response.providerId;
      latencyMs += response.latencyMs;
      attempts = response.attempts;

      if (response.toolCalls.length === 0) {
        break;
      }

      totalToolCalls = [...totalToolCalls, ...response.toolCalls];
      const iterationResults = await aiToolExecutionFacade.executeToolCalls({
        platform,
        toolCalls: response.toolCalls,
        currentModule: input.currentModule ?? null,
        model: response.model,
        tokensUsed: response.totalTokens,
      });

      toolResults = [...toolResults, ...iterationResults];

      messages.push({
        role: "assistant",
        content: response.content || "Executing tools…",
      });

      for (const result of iterationResults) {
        messages.push({
          role: "user",
          content: `Tool ${result.toolId} result: ${JSON.stringify(result.output)}`,
        });
      }
    }

    await aiConversationManager.appendMessage(conversation.id, "ASSISTANT", content);

    await aiMemoryManager.write({
      businessId,
      scope: "session",
      key: conversation.id,
      content: content.slice(0, 2000),
      userId: platform.user.id,
    });

    const provider = aiProviderManager.resolveProvider({ preferredProviderId: providerId });
    const modelDef = provider.models.find((entry) => entry.id === model) ?? provider.models[0];
    const costCents = calculateTokenCostCents({
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
      inputCostPer1k: modelDef?.inputCostPer1kTokens ?? 0,
      outputCostPer1k: modelDef?.outputCostPer1kTokens ?? 0,
    });

    const auditId = await aiAuditService.log({
      businessId,
      userId: platform.user.id,
      staffId: platform.staffSession?.staffId ?? null,
      entityType: "conversation",
      entityId: conversation.id,
      action: "chat.complete",
      metadata: {
        model,
        providerId,
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        totalTokens: totalPromptTokens + totalCompletionTokens,
        costCents,
        latencyMs,
        attempts,
        toolCallCount: totalToolCalls.length,
        currentModule: input.currentModule ?? null,
        promptPreview: input.message.slice(0, 500),
        responsePreview: content.slice(0, 500),
      },
    });

    await aiUsageService.recordUsage({
      businessId,
      tokens: totalPromptTokens + totalCompletionTokens,
      userId: platform.user.id,
    });

    const result: AiEngineChatResult = {
      conversationId: conversation.id,
      content,
      model,
      providerId,
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
      totalTokens: totalPromptTokens + totalCompletionTokens,
      costCents,
      latencyMs,
      toolCalls: totalToolCalls,
      toolResults,
      auditId,
      cached: false,
    };

    aiResponseCache.set(cacheKey, result);
    return result;
  }

  private async generateInsightInternal(
    platform: BusinessContext,
    input: AiEngineInsightInput,
  ): Promise<AiEngineInsightResult> {
    const businessId = platform.business.id;
    await aiUsageService.assertAllowed(businessId);
    aiRateLimiter.assertAllowed(`ai-insight:${businessId}:${platform.user.id}`);

    const injected = await aiContextInjectionEngine.buildFromPlatform(platform, {
      currentModule: input.currentModule,
      extraData: input.contextData,
    });

    const composed = aiPromptManager.composeInsightPrompt(
      injected,
      input.prompt,
      input.responseFormat ?? "text",
    );

    const response = await aiProviderManager.complete({
      systemPrompt: composed.systemPrompt,
      messages: [{ role: "user", content: composed.userPrompt }],
    });

    const provider = aiProviderManager.resolveProvider({ preferredProviderId: response.providerId });
    const modelDef = provider.models.find((entry) => entry.id === response.model) ?? provider.models[0];
    const costCents = calculateTokenCostCents({
      promptTokens: response.promptTokens,
      completionTokens: response.completionTokens,
      inputCostPer1k: modelDef?.inputCostPer1kTokens ?? 0,
      outputCostPer1k: modelDef?.outputCostPer1kTokens ?? 0,
    });

    let parsed: Record<string, unknown> | undefined;
    if (input.responseFormat === "json") {
      try {
        parsed = JSON.parse(response.content) as Record<string, unknown>;
      } catch {
        parsed = undefined;
      }
    }

    const auditId = await aiAuditService.log({
      businessId,
      userId: platform.user.id,
      staffId: platform.staffSession?.staffId ?? null,
      entityType: "insight",
      entityId: input.currentModule,
      action: "insight.generate",
      metadata: {
        model: response.model,
        providerId: response.providerId,
        totalTokens: response.totalTokens,
        costCents,
        latencyMs: response.latencyMs,
        currentModule: input.currentModule,
      },
    });

    await aiUsageService.recordUsage({
      businessId,
      tokens: response.totalTokens,
      userId: platform.user.id,
    });

    return {
      content: response.content,
      parsed,
      model: response.model,
      providerId: response.providerId,
      totalTokens: response.totalTokens,
      costCents,
      auditId,
    };
  }
}

export const aiEngine = new AiEngine();
