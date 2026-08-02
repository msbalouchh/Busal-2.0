import "server-only";

import type { BaseIntegrationProvider } from "@/services/integrations/interfaces/base-integration-provider.interface";

class IntegrationProviderRegistryImpl {
  private providers = new Map<string, BaseIntegrationProvider>();

  register(provider: BaseIntegrationProvider): void {
    this.providers.set(provider.providerId, provider);
  }

  get(providerId: string): BaseIntegrationProvider | undefined {
    return this.providers.get(providerId);
  }

  list(): BaseIntegrationProvider[] {
    return Array.from(this.providers.values());
  }
}

export const integrationProviderRegistry = new IntegrationProviderRegistryImpl();

export function getIntegrationProviderRegistry(): IntegrationProviderRegistryImpl {
  return integrationProviderRegistry;
}
