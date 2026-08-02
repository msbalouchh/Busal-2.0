import "server-only";

import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiProviderCapabilities,
} from "@/modules/ai-restaurant-assistant-management/types/ai-restaurant-assistant-types";

export interface AiProvider {
  readonly id: string;
  readonly name: string;
  readonly capabilities: AiProviderCapabilities;
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
}

const providers = new Map<string, AiProvider>();
let defaultProviderId: string | null = null;

export function registerAiProvider(provider: AiProvider, options?: { isDefault?: boolean }): void {
  providers.set(provider.id, provider);
  if (options?.isDefault || defaultProviderId === null) {
    defaultProviderId = provider.id;
  }
}

export function getAiProvider(providerId?: string): AiProvider {
  const id = providerId ?? defaultProviderId;
  if (!id) {
    throw new Error("No AI provider registered");
  }

  const provider = providers.get(id);
  if (!provider) {
    throw new Error(`AI provider not registered: ${id}`);
  }

  return provider;
}

export function listRegisteredAiProviders(): AiProvider[] {
  return [...providers.values()];
}

export function getDefaultAiProviderId(): string | null {
  return defaultProviderId;
}
