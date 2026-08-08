import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiProvider,
  AiProviderId,
} from "@/modules/ai-engine/types/ai-engine.types";
import { createDefaultProviders } from "@/modules/ai-engine/providers/llm-providers";
import { AiCircuitBreaker } from "@/modules/ai-engine/performance/circuit-breaker";
import { executeWithAiRetry } from "@/modules/ai-engine/performance/retry-handler";
import { isMockFallbackAllowed } from "@/lib/production-mode";

export interface ProviderSelectionOptions {
  preferredProviderId?: AiProviderId;
  preferredModel?: string;
  allowFallback?: boolean;
}

/** Resolves, orders, and executes LLM providers with fallback and circuit breaking. */
export class AiProviderManager {
  private readonly providers = new Map<AiProviderId, AiProvider>();
  private readonly breakers = new Map<AiProviderId, AiCircuitBreaker>();
  private defaultProviderId: AiProviderId | null = null;

  constructor(providers: AiProvider[] = createDefaultProviders()) {
    for (const provider of providers) {
      this.providers.set(provider.id, provider);
      this.breakers.set(provider.id, new AiCircuitBreaker(provider.id));
      if (provider.isConfigured() && !this.defaultProviderId && provider.id !== "mock-fallback") {
        this.defaultProviderId = provider.id;
      }
    }

    if (!this.defaultProviderId) {
      this.defaultProviderId = isMockFallbackAllowed() ? "mock-fallback" : null;
    }
  }

  listProviders(): Array<{ id: AiProviderId; name: string; configured: boolean; models: string[] }> {
    return [...this.providers.values()].map((provider) => ({
      id: provider.id,
      name: provider.name,
      configured: provider.isConfigured(),
      models: provider.models.map((model) => model.id),
    }));
  }

  resolveProvider(options: ProviderSelectionOptions = {}): AiProvider {
    if (options.preferredProviderId) {
      const preferred = this.providers.get(options.preferredProviderId);
      if (preferred?.isConfigured()) {
        return preferred;
      }
    }

    const configured = [...this.providers.values()].filter(
      (provider) => provider.isConfigured() && provider.id !== "mock-fallback",
    );

    if (configured.length > 0) {
      return configured[0]!;
    }

    if (options.allowFallback !== false && isMockFallbackAllowed()) {
      return this.providers.get("mock-fallback")!;
    }

    throw new Error("No AI provider is configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or another supported provider.");
  }

  resolveModel(provider: AiProvider, preferredModel?: string): string {
    if (preferredModel && provider.models.some((model) => model.id === preferredModel)) {
      return preferredModel;
    }
    return provider.models[0]?.id ?? "default";
  }

  async complete(
    request: AiCompletionRequest,
    options: ProviderSelectionOptions = {},
  ): Promise<AiCompletionResponse & { attempts: number; usedFallback: boolean }> {
    const primary = this.resolveProvider(options);
    const chain = this.buildFallbackChain(primary, options.allowFallback !== false);

    let lastError: Error | null = null;
    let attempts = 0;

    for (const provider of chain) {
      attempts += 1;
      const breaker = this.breakers.get(provider.id)!;

      if (!breaker.canExecute()) {
        continue;
      }

      try {
        const response = await executeWithAiRetry(() =>
          provider.complete({
            ...request,
            model: this.resolveModel(provider, options.preferredModel),
          }),
        );
        breaker.recordSuccess();
        return {
          ...response,
          attempts,
          usedFallback: provider.id !== primary.id,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Provider request failed");
        breaker.recordFailure();
      }
    }

    throw lastError ?? new Error("All AI providers failed");
  }

  private buildFallbackChain(primary: AiProvider, allowFallback: boolean): AiProvider[] {
    const chain: AiProvider[] = [primary];
    if (!allowFallback) {
      return chain;
    }

    for (const provider of this.providers.values()) {
      if (provider.id !== primary.id && provider.isConfigured()) {
        chain.push(provider);
      }
    }

    const mock = this.providers.get("mock-fallback");
    if (mock && !chain.includes(mock) && isMockFallbackAllowed()) {
      chain.push(mock);
    }

    return chain;
  }
}

export const aiProviderManager = new AiProviderManager();
