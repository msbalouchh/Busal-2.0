import "server-only";

import type { PlatformMediaVisibility } from "@prisma/client";

import {
  DEFAULT_MEDIA_STORAGE_QUOTA_BYTES,
  getOwnedBusinessId,
} from "@/services/media-platform-context.service";
import { prisma } from "@/lib/prisma";

export interface VirusScanResult {
  clean: boolean;
  simulated: boolean;
  message: string;
}

export interface StorageQuotaStatus {
  usedBytes: number;
  quotaBytes: number;
  percentUsed: number;
  withinQuota: boolean;
}

export async function scanMediaFile(_fileId: string, _content: Buffer): Promise<VirusScanResult> {
  return {
    clean: true,
    simulated: true,
    message: "Virus scan simulated — no scanner configured",
  };
}

export async function checkStorageQuota(ownerId: string): Promise<StorageQuotaStatus> {
  const businessId = await getOwnedBusinessId(ownerId);
  const usage = await prisma.platformMediaFile.aggregate({
    where: { businessId, deletedAt: null },
    _sum: { size: true },
  });
  const usedBytes = usage._sum.size ?? 0;
  const quotaBytes = DEFAULT_MEDIA_STORAGE_QUOTA_BYTES;
  const percentUsed = quotaBytes > 0 ? Math.round((usedBytes / quotaBytes) * 100) : 0;

  return {
    usedBytes,
    quotaBytes,
    percentUsed,
    withinQuota: usedBytes <= quotaBytes,
  };
}

export function canAccessMediaFile(input: {
  isOwner: boolean;
  hasViewPermission: boolean;
  visibility: PlatformMediaVisibility;
  uploadedBy: string | null;
  userId: string;
}): boolean {
  if (input.isOwner || input.hasViewPermission) return true;
  if (input.visibility === "PUBLIC") return true;
  if (input.visibility === "PRIVATE" && input.uploadedBy === input.userId) return true;
  return false;
}

export interface MediaShareFramework {
  shareToken: string;
  expiresAt: string;
  simulated: boolean;
}

export function createMediaShareLink(_fileId: string): MediaShareFramework {
  return {
    shareToken: `share_sim_${Date.now()}`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    simulated: true,
  };
}
