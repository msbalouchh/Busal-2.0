import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/media-platform-context.service";
import { writeMediaAuditLog } from "@/services/media-audit-logger.service";

export async function getMediaFileMetadata(ownerId: string, fileId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const file = await prisma.platformMediaFile.findFirst({
    where: { id: fileId, businessId },
    select: { id: true, metadata: true, mimeType: true, size: true, checksum: true },
  });
  return file;
}

export async function updateMediaFileMetadata(
  ownerId: string,
  fileId: string,
  metadata: Record<string, unknown>,
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformMediaFile.findFirst({
    where: { id: fileId, businessId, deletedAt: null },
  });
  if (!existing) return null;

  const updated = await prisma.platformMediaFile.update({
    where: { id: fileId },
    data: { metadata: metadata as Prisma.InputJsonValue },
  });

  await writeMediaAuditLog(businessId, {
    action: "media.metadata.updated",
    entityId: fileId,
    message: `Metadata updated for: ${existing.name}`,
  });

  return updated;
}

export async function mergeMediaFileMetadata(
  ownerId: string,
  fileId: string,
  patch: Record<string, unknown>,
) {
  const file = await getMediaFileMetadata(ownerId, fileId);
  if (!file) return null;
  const current =
    file.metadata && typeof file.metadata === "object" && !Array.isArray(file.metadata)
      ? (file.metadata as Record<string, unknown>)
      : {};
  return updateMediaFileMetadata(ownerId, fileId, { ...current, ...patch });
}
