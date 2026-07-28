import { createHash, randomUUID } from "node:crypto";

import type { FileStorageProvider } from "@prisma/client";

import type { StorageUploadResult } from "@/modules/file-platform/types/file-platform-types";

export interface StorageAdapter {
  provider: FileStorageProvider;
  upload(input: {
    businessId: string;
    originalName: string;
    content: Buffer | string;
  }): Promise<StorageUploadResult>;
  download(storageKey: string): Promise<{ exists: boolean }>;
  delete(storageKey: string): Promise<void>;
}

class LocalStorageAdapter implements StorageAdapter {
  provider: FileStorageProvider = "LOCAL";

  async upload(input: {
    businessId: string;
    originalName: string;
    content: Buffer | string;
  }): Promise<StorageUploadResult> {
    const buffer = typeof input.content === "string" ? Buffer.from(input.content) : input.content;
    const checksum = createHash("sha256").update(buffer).digest("hex");
    const storedName = `${randomUUID()}-${input.originalName}`;
    const storageKey = `${input.businessId}/${storedName}`;

    return {
      storageKey,
      storedName,
      checksum,
      sizeBytes: buffer.length,
      provider: "LOCAL",
    };
  }

  async download(storageKey: string): Promise<{ exists: boolean }> {
    return { exists: storageKey.length > 0 };
  }

  async delete(_storageKey: string): Promise<void> {
    // Local adapter simulates delete without direct filesystem access in serverless context.
  }
}

const adapters = new Map<FileStorageProvider, StorageAdapter>();

export function registerStorageAdapter(adapter: StorageAdapter): void {
  adapters.set(adapter.provider, adapter);
}

export function getStorageAdapter(provider: FileStorageProvider): StorageAdapter {
  const adapter = adapters.get(provider);
  if (!adapter) {
    throw new Error(`Storage adapter not registered for provider: ${provider}`);
  }
  return adapter;
}

export function ensureDefaultStorageAdapters(): void {
  if (!adapters.has("LOCAL")) {
    registerStorageAdapter(new LocalStorageAdapter());
  }
}

export function computeChecksum(content: Buffer | string): string {
  const buffer = typeof content === "string" ? Buffer.from(content) : content;
  return createHash("sha256").update(buffer).digest("hex");
}

export function extractExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? "") : "";
}
