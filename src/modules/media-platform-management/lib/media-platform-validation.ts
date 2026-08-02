import type { PlatformMediaFile, PlatformMediaFolder, PlatformMediaTag } from "@prisma/client";

import type {
  MediaFileRecord,
  MediaFolderRecord,
  MediaPreviewRecord,
  MediaSummaryRecord,
  MediaTagRecord,
  StorageAnalyticsRecord,
} from "@/modules/media-platform-management/types/media-platform-types";
import type { MediaPreview } from "@/services/media-preview.service";

export function serializeMediaFile(
  file: PlatformMediaFile & {
    folder?: { name: string } | null;
    fileTags?: Array<{ tag: { name: string } }>;
  },
): MediaFileRecord {
  return {
    id: file.id,
    name: file.name,
    originalName: file.originalName,
    fileType: file.fileType,
    mimeType: file.mimeType,
    extension: file.extension,
    size: file.size,
    storageProvider: file.storageProvider,
    checksum: file.checksum,
    visibility: file.visibility,
    isFavorite: file.isFavorite,
    folderName: file.folder?.name ?? null,
    tagNames: file.fileTags?.map((entry: { tag: { name: string } }) => entry.tag.name) ?? [],
    version: file.version,
    deletedAt: file.deletedAt?.toISOString() ?? null,
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
  };
}

export function serializeMediaFolder(
  folder: PlatformMediaFolder & { _count?: { files: number; children: number } },
): MediaFolderRecord {
  return {
    id: folder.id,
    name: folder.name,
    description: folder.description,
    parentId: folder.parentId,
    fileCount: folder._count?.files ?? 0,
    childCount: folder._count?.children ?? 0,
    createdAt: folder.createdAt.toISOString(),
  };
}

export function serializeMediaTag(
  tag: PlatformMediaTag & { _count?: { fileTags: number } },
): MediaTagRecord {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    fileCount: tag._count?.fileTags ?? 0,
    createdAt: tag.createdAt.toISOString(),
  };
}

export function serializeMediaPreview(preview: MediaPreview): MediaPreviewRecord {
  return preview;
}

export function serializeMediaSummary(summary: MediaSummaryRecord): MediaSummaryRecord {
  return summary;
}

export function serializeStorageAnalytics(
  summary: MediaSummaryRecord,
  quota: Pick<StorageAnalyticsRecord, "usedBytes" | "quotaBytes" | "percentUsed" | "withinQuota">,
): StorageAnalyticsRecord {
  return {
    ...quota,
    byType: summary.byType,
  };
}

export function validateMediaName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("File name is required");
  return trimmed;
}

export function validateFolderName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Folder name is required");
  return trimmed;
}

export function validateTagName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tag name is required");
  return trimmed;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
