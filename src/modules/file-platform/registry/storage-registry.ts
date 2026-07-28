import type { StorageProviderDefinition } from "@/modules/file-platform/types/file-platform-types";

const providers = new Map<string, StorageProviderDefinition>();

export function registerStorageProvider(definition: StorageProviderDefinition): void {
  providers.set(definition.provider, definition);
}

export function listStorageProviders(): StorageProviderDefinition[] {
  return Array.from(providers.values());
}

export function getStorageProvider(
  provider: StorageProviderDefinition["provider"],
): StorageProviderDefinition | undefined {
  return providers.get(provider);
}
