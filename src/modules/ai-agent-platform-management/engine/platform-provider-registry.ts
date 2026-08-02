import "server-only";

import type { IAIProvider } from "@/modules/ai-agent-platform-management/interfaces/ai-provider.interface";

const providers = new Map<string, IAIProvider>();
let defaultProviderId: string | null = null;

export function registerPlatformAiProvider(
  provider: IAIProvider,
  options?: { isDefault?: boolean },
): void {
  providers.set(provider.id, provider);
  if (options?.isDefault || defaultProviderId === null) {
    defaultProviderId = provider.id;
  }
}

export function getPlatformAiProvider(providerId?: string): IAIProvider {
  const id = providerId ?? defaultProviderId;
  if (!id) throw new Error("No AI provider registered on agent platform");
  const provider = providers.get(id);
  if (!provider) throw new Error(`AI provider not found: ${id}`);
  return provider;
}

export function listPlatformAiProviders(): IAIProvider[] {
  return [...providers.values()];
}
