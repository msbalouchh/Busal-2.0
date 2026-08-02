import type { PlatformMediaType, PlatformMediaVisibility } from "@prisma/client";

export interface MediaFileRecord {
  id: string;
  name: string;
  originalName: string;
  fileType: PlatformMediaType;
  mimeType: string;
  extension: string;
  size: number;
  storageProvider: string;
  checksum: string;
  visibility: PlatformMediaVisibility;
  isFavorite: boolean;
  folderName: string | null;
  tagNames: string[];
  version: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaFolderRecord {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  fileCount: number;
  childCount: number;
  createdAt: string;
}

export interface MediaTagRecord {
  id: string;
  name: string;
  color: string;
  fileCount: number;
  createdAt: string;
}

export interface MediaPreviewRecord {
  fileId: string;
  name: string;
  fileType: string;
  mimeType: string;
  size: number;
  thumbnailPath: string;
  checksumValid: boolean;
  previewContent: string;
  visibility: string;
}

export interface MediaSummaryRecord {
  total: number;
  favorites: number;
  deleted: number;
  folders: number;
  tags: number;
  totalBytes: number;
  byType: Array<{ fileType: PlatformMediaType; count: number; bytes: number }>;
}

export interface StorageAnalyticsRecord {
  usedBytes: number;
  quotaBytes: number;
  percentUsed: number;
  withinQuota: boolean;
  byType: Array<{ fileType: PlatformMediaType; count: number; bytes: number }>;
}
