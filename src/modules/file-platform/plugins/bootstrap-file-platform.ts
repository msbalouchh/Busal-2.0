import { FILE_STORAGE_PROVIDERS } from "@/modules/file-platform/constants/routes";
import { ensureDefaultStorageAdapters } from "@/modules/file-platform/engine/storage-engine";
import { registerStorageProvider } from "@/modules/file-platform/registry/storage-registry";
import type { StorageProviderDefinition } from "@/modules/file-platform/types/file-platform-types";

let bootstrapComplete = false;

export const DEFAULT_STORAGE_PROVIDERS: StorageProviderDefinition[] = FILE_STORAGE_PROVIDERS.map(
  (provider) => ({
    provider,
    name: formatProviderName(provider),
    description: getProviderDescription(provider),
    isIntegrated: provider === "LOCAL",
  }),
);

export function registerBootstrapStorageProviders(): void {
  for (const definition of DEFAULT_STORAGE_PROVIDERS) {
    registerStorageProvider(definition);
  }
}

export function ensureBootstrapFilePlatform(): void {
  if (bootstrapComplete) {
    return;
  }

  ensureDefaultStorageAdapters();
  registerBootstrapStorageProviders();
  bootstrapComplete = true;
}

function formatProviderName(provider: string): string {
  return provider.replace(/_/g, " ");
}

function getProviderDescription(provider: string): string {
  const descriptions: Record<string, string> = {
    LOCAL: "Local storage adapter (default)",
    AWS_S3: "Amazon S3 storage (architecture ready)",
    AZURE_BLOB: "Azure Blob Storage (architecture ready)",
    GOOGLE_CLOUD: "Google Cloud Storage (architecture ready)",
    CLOUDFLARE_R2: "Cloudflare R2 storage (architecture ready)",
  };
  return descriptions[provider] ?? `${provider} storage provider`;
}
