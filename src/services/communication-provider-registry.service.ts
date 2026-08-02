import "server-only";

import type { BaseCommunicationProvider } from "@/services/communications/interfaces/base-communication-provider.interface";

class CommunicationProviderRegistryImpl {
  private providers = new Map<string, BaseCommunicationProvider>();

  register(provider: BaseCommunicationProvider): void {
    this.providers.set(provider.providerId, provider);
  }

  get(providerId: string): BaseCommunicationProvider | undefined {
    return this.providers.get(providerId);
  }

  list(): BaseCommunicationProvider[] {
    return Array.from(this.providers.values());
  }
}

export const communicationProviderRegistry = new CommunicationProviderRegistryImpl();

export function getCommunicationProviderRegistry(): CommunicationProviderRegistryImpl {
  return communicationProviderRegistry;
}
