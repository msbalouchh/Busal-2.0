import type { IdentityProviderDefinition } from "@/modules/iam/types/iam-types";

const providers = new Map<string, IdentityProviderDefinition>();

export function registerIdentityProvider(definition: IdentityProviderDefinition): void {
  providers.set(definition.providerType, definition);
}

export function listIdentityProviders(): IdentityProviderDefinition[] {
  return Array.from(providers.values());
}

export function getIdentityProvider(
  providerType: IdentityProviderDefinition["providerType"],
): IdentityProviderDefinition | undefined {
  return providers.get(providerType);
}
