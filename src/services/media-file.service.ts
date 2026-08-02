import "server-only";

import type { PlatformMediaType, PlatformMediaVisibility, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  buildMediaStoragePath,
  computeMediaChecksum,
  extractExtension,
  getOwnedBusinessId,
  inferMediaType,
} from "@/services/media-platform-context.service";
import { createMediaFileVersion } from "@/services/media-file-version-manager.service";
import { uploadToStorage } from "@/services/media-storage-manager.service";
import { generateThumbnail } from "@/services/media-thumbnail-generator.service";
import { writeMediaAuditLog } from "@/services/media-audit-logger.service";

export async function listMediaFiles(
  ownerId: string,
  filters?: {
    fileType?: PlatformMediaType;
    folderId?: string;
    isFavorite?: boolean;
    deleted?: boolean;
    tagId?: string;
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformMediaFile.findMany({
    where: {
      businessId,
      deletedAt: filters?.deleted ? { not: null } : null,
      ...(filters?.fileType ? { fileType: filters.fileType } : {}),
      ...(filters?.folderId ? { folderId: filters.folderId } : {}),
      ...(filters?.isFavorite !== undefined ? { isFavorite: filters.isFavorite } : {}),
      ...(filters?.tagId ? { fileTags: { some: { tagId: filters.tagId } } } : {}),
    },
    include: {
      folder: { select: { name: true } },
      fileTags: { include: { tag: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getMediaFile(ownerId: string, fileId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformMediaFile.findFirst({
    where: { id: fileId, businessId },
    include: {
      folder: true,
      fileTags: { include: { tag: true } },
      versions: { orderBy: { version: "desc" } },
    },
  });
}

export async function getRecentMediaFiles(ownerId: string, limit = 10) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformMediaFile.findMany({
    where: { businessId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getMediaDashboardSummary(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const [total, favorites, deleted, folders, tags, usage] = await Promise.all([
    prisma.platformMediaFile.count({ where: { businessId, deletedAt: null } }),
    prisma.platformMediaFile.count({ where: { businessId, deletedAt: null, isFavorite: true } }),
    prisma.platformMediaFile.count({ where: { businessId, deletedAt: { not: null } } }),
    prisma.platformMediaFolder.count({ where: { businessId } }),
    prisma.platformMediaTag.count({ where: { businessId } }),
    prisma.platformMediaFile.aggregate({
      where: { businessId, deletedAt: null },
      _sum: { size: true },
    }),
  ]);

  const byType = await prisma.platformMediaFile.groupBy({
    by: ["fileType"],
    where: { businessId, deletedAt: null },
    _count: { id: true },
    _sum: { size: true },
  });

  return {
    total,
    favorites,
    deleted,
    folders,
    tags,
    totalBytes: usage._sum.size ?? 0,
    byType: byType.map(
      (row: {
        fileType: PlatformMediaType;
        _count: { id: number };
        _sum: { size: number | null };
      }) => ({
        fileType: row.fileType,
        count: row._count.id,
        bytes: row._sum.size ?? 0,
      }),
    ),
  };
}

export async function createMediaFileRecord(
  ownerId: string,
  input: {
    name: string;
    originalName: string;
    mimeType: string;
    size: number;
    content: string | Buffer;
    folderId?: string;
    visibility?: PlatformMediaVisibility;
    metadata?: Record<string, unknown>;
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const extension = extractExtension(input.originalName);
  const fileType = inferMediaType(input.mimeType, extension);
  const contentBuffer =
    typeof input.content === "string" ? Buffer.from(input.content, "utf8") : input.content;
  const checksum = computeMediaChecksum(contentBuffer);
  const storagePath = buildMediaStoragePath(businessId, "pending", 1, extension);

  const file = await prisma.platformMediaFile.create({
    data: {
      businessId,
      folderId: input.folderId,
      name: input.name,
      originalName: input.originalName,
      fileType,
      mimeType: input.mimeType,
      extension,
      size: input.size,
      storageProvider: "LOCAL",
      storagePath,
      checksum,
      visibility: input.visibility ?? "BUSINESS",
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      uploadedBy: ownerId,
    },
  });

  const resolvedPath = buildMediaStoragePath(businessId, file.id, 1, extension);
  await uploadToStorage("LOCAL", resolvedPath, contentBuffer);
  const thumbnail = await generateThumbnail(fileType, resolvedPath);

  await prisma.platformMediaFile.update({
    where: { id: file.id },
    data: {
      storagePath: resolvedPath,
      thumbnailPath: thumbnail.thumbnailPath,
    },
  });

  await createMediaFileVersion(ownerId, file.id, {
    version: 1,
    storagePath: resolvedPath,
    checksum,
    size: input.size,
  });

  await writeMediaAuditLog(businessId, {
    action: "media.uploaded",
    entityId: file.id,
    message: `File uploaded: ${file.name}`,
  });

  return getMediaFile(ownerId, file.id);
}

export async function updateMediaFile(
  ownerId: string,
  fileId: string,
  input: {
    name?: string;
    folderId?: string | null;
    visibility?: PlatformMediaVisibility;
    isFavorite?: boolean;
    metadata?: Record<string, unknown>;
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformMediaFile.findFirst({
    where: { id: fileId, businessId, deletedAt: null },
  });
  if (!existing) return null;

  return prisma.platformMediaFile.update({
    where: { id: fileId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.folderId !== undefined ? { folderId: input.folderId } : {}),
      ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
      ...(input.isFavorite !== undefined ? { isFavorite: input.isFavorite } : {}),
      ...(input.metadata !== undefined
        ? { metadata: input.metadata as Prisma.InputJsonValue }
        : {}),
    },
  });
}

export async function softDeleteMediaFile(ownerId: string, fileId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformMediaFile.findFirst({
    where: { id: fileId, businessId, deletedAt: null },
  });
  if (!existing) return null;

  const updated = await prisma.platformMediaFile.update({
    where: { id: fileId },
    data: { deletedAt: new Date() },
  });

  await writeMediaAuditLog(businessId, {
    action: "media.deleted",
    entityId: fileId,
    message: `File moved to recycle bin: ${existing.name}`,
  });

  return updated;
}

export async function restoreMediaFile(ownerId: string, fileId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformMediaFile.findFirst({
    where: { id: fileId, businessId, deletedAt: { not: null } },
  });
  if (!existing) return null;

  const updated = await prisma.platformMediaFile.update({
    where: { id: fileId },
    data: { deletedAt: null },
  });

  await writeMediaAuditLog(businessId, {
    action: "media.restored",
    entityId: fileId,
    message: `File restored: ${existing.name}`,
  });

  return updated;
}

export async function permanentlyDeleteMediaFile(ownerId: string, fileId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformMediaFile.findFirst({
    where: { id: fileId, businessId },
  });
  if (!existing) return null;

  await prisma.platformMediaFile.delete({ where: { id: fileId } });

  await writeMediaAuditLog(businessId, {
    action: "media.permanently_deleted",
    entityId: fileId,
    message: `File permanently deleted: ${existing.name}`,
  });

  return existing;
}

export async function findDuplicateFiles(ownerId: string, checksum: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformMediaFile.findMany({
    where: { businessId, checksum, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
}

export async function toggleMediaFavorite(ownerId: string, fileId: string) {
  const file = await getMediaFile(ownerId, fileId);
  if (!file || file.deletedAt) return null;
  return updateMediaFile(ownerId, fileId, { isFavorite: !file.isFavorite });
}
