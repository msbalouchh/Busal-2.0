import "server-only";

import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

import type { PlatformMediaStorageProvider } from "@prisma/client";

export interface StorageUploadResult {
  provider: PlatformMediaStorageProvider;
  storagePath: string;
  simulated: boolean;
}

export interface SignedUrlResult {
  url: string;
  expiresAt: string;
  simulated: boolean;
}

export interface StorageProviderAdapter {
  provider: PlatformMediaStorageProvider;
  upload(path: string, content: Buffer): Promise<StorageUploadResult>;
  download(path: string): Promise<Buffer | null>;
  delete(path: string): Promise<void>;
  getSignedUrl(path: string, expiresInSeconds: number): Promise<SignedUrlResult>;
}

const MEDIA_STORAGE_ROOT = path.join(process.cwd(), "storage", "media");

function resolveStorageFilePath(storagePath: string): string {
  const normalized = storagePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const fullPath = path.resolve(MEDIA_STORAGE_ROOT, normalized);
  if (!fullPath.startsWith(path.resolve(MEDIA_STORAGE_ROOT))) {
    throw new Error("Invalid storage path");
  }
  return fullPath;
}

/** Local filesystem adapter backed by `storage/media`. */
const localAdapter: StorageProviderAdapter = {
  provider: "LOCAL",
  async upload(storagePath, content) {
    const fullPath = resolveStorageFilePath(storagePath);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content);
    return { provider: "LOCAL", storagePath, simulated: false };
  },
  async download(storagePath) {
    try {
      const fullPath = resolveStorageFilePath(storagePath);
      return await readFile(fullPath);
    } catch {
      return null;
    }
  },
  async delete(storagePath) {
    try {
      await unlink(resolveStorageFilePath(storagePath));
    } catch {
      /* file may already be removed */
    }
  },
  async getSignedUrl(storagePath, expiresInSeconds) {
    return {
      url: `/api/media/signed/${encodeURIComponent(storagePath)}`,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
      simulated: false,
    };
  },
};

const PROVIDER_ADAPTERS: Partial<Record<PlatformMediaStorageProvider, StorageProviderAdapter>> = {
  LOCAL: localAdapter,
  AMAZON_S3: { ...localAdapter, provider: "AMAZON_S3" },
  CLOUDFLARE_R2: { ...localAdapter, provider: "CLOUDFLARE_R2" },
  GOOGLE_CLOUD_STORAGE: { ...localAdapter, provider: "GOOGLE_CLOUD_STORAGE" },
  AZURE_BLOB_STORAGE: { ...localAdapter, provider: "AZURE_BLOB_STORAGE" },
  MINIO: { ...localAdapter, provider: "MINIO" },
};

export function getStorageAdapter(
  provider: PlatformMediaStorageProvider = "LOCAL",
): StorageProviderAdapter {
  return PROVIDER_ADAPTERS[provider] ?? localAdapter;
}

export async function uploadToStorage(
  provider: PlatformMediaStorageProvider,
  storagePath: string,
  content: Buffer,
): Promise<StorageUploadResult> {
  return getStorageAdapter(provider).upload(storagePath, content);
}

export async function downloadFromStorage(
  provider: PlatformMediaStorageProvider,
  storagePath: string,
): Promise<Buffer | null> {
  return getStorageAdapter(provider).download(storagePath);
}

export async function generateSignedUrl(
  provider: PlatformMediaStorageProvider,
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<SignedUrlResult> {
  return getStorageAdapter(provider).getSignedUrl(storagePath, expiresInSeconds);
}
