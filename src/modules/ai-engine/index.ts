export type {
  AiProviderId,
  AiModelDefinition,
  AiMessageRole,
  AiChatMessage,
  AiToolCallRequest,
  AiCompletionRequest,
  AiToolDefinition,
  AiCompletionResponse,
  AiStreamChunk,
  AiProvider,
  AiEngineChatInput,
  AiEngineChatResult,
  AiEngineInsightInput,
  AiEngineInsightResult,
  AiInjectedContext,
} from "@/modules/ai-engine/types/ai-engine.types";

export { AI_PROVIDER_IDS } from "@/modules/ai-engine/types/ai-engine.types";

export { AiEngine, aiEngine } from "@/modules/ai-engine/engine/ai-engine";

export { aiProviderManager, AiProviderManager } from "@/modules/ai-engine/providers/provider-manager";
export {
  OpenAiProvider,
  AnthropicProvider,
  GeminiProvider,
  AzureOpenAiProvider,
  MockFallbackProvider,
  createDefaultProviders,
} from "@/modules/ai-engine/providers/llm-providers";

export { aiPromptManager, AiPromptManager } from "@/modules/ai-engine/managers/prompt-manager";
export { aiConversationManager, AiConversationManager } from "@/modules/ai-engine/managers/conversation-manager";
export {
  aiMemoryManager,
  AiMemoryManager,
  aiUsageService,
  AiUsageService,
  resolveSubscriptionContext,
} from "@/modules/ai-engine/managers/memory-manager";

export {
  aiContextInjectionEngine,
  AiContextInjectionEngine,
  aiAuditService,
  AiAuditService,
  calculateTokenCostCents,
} from "@/modules/ai-engine/context/context-injection-engine";

export { aiToolExecutionFacade, AiToolExecutionFacade } from "@/modules/ai-engine/tools/tool-execution-facade";

export { aiResponseCache } from "@/modules/ai-engine/performance/response-cache";
export { aiRateLimiter, aiRequestQueue } from "@/modules/ai-engine/performance/rate-limiter";
export { executeWithAiRetry, AiCircuitBreaker } from "@/modules/ai-engine/performance/retry-handler";
