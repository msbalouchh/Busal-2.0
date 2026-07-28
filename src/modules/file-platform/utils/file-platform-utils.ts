import type {
  PlatformFile,
  PlatformFileAuditLog,
  PlatformFileFolder,
  PlatformFileRetentionPolicy,
  PlatformFileShareLink,
  PlatformFileVersion,
} from "@prisma/client";

import type { FilePlatformDashboardMetrics } from "@/modules/file-platform/types/file-platform-types";

export interface FilePlatformDashboardView {
  totalFiles: number;
  activeFiles: number;
  totalFolders: number;
  sharedLinks: number;
  archivedFiles: number;
  storageProviders: number;
}

export interface PlatformFileView {
  id: string;
  originalName: string;
  module: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  currentVersionNumber: number;
  status: string;
  tags: string[];
  storageProvider: string;
  previewType: string | null;
  createdAt: string;
}

export interface PlatformFolderView {
  id: string;
  name: string;
  folderType: string;
  path: string;
  parentId: string | null;
}

export interface PlatformFileVersionView {
  id: string;
  versionNumber: number;
  sizeBytes: number;
  checksum: string;
  changeNotes: string | null;
  createdAt: string;
}

export interface PlatformShareLinkView {
  id: string;
  linkType: string;
  token: string;
  expiresAt: string | null;
  downloadLimit: number | null;
  downloadCount: number;
  isActive: boolean;
}

export interface PlatformAuditView {
  id: string;
  eventType: string;
  createdAt: string;
}

export interface PlatformRetentionView {
  id: string;
  name: string;
  module: string | null;
  retentionDays: number;
  action: string;
  isActive: boolean;
}

export function serializeFilePlatformDashboard(
  metrics: FilePlatformDashboardMetrics,
): FilePlatformDashboardView {
  return { ...metrics };
}

export function serializePlatformFile(file: PlatformFile): PlatformFileView {
  return {
    id: file.id,
    originalName: file.originalName,
    module: file.module,
    mimeType: file.mimeType,
    extension: file.extension,
    sizeBytes: file.sizeBytes,
    currentVersionNumber: file.currentVersionNumber,
    status: file.status,
    tags: file.tags,
    storageProvider: file.storageProvider,
    previewType: file.previewType,
    createdAt: file.createdAt.toISOString(),
  };
}

export function serializePlatformFolder(folder: PlatformFileFolder): PlatformFolderView {
  return {
    id: folder.id,
    name: folder.name,
    folderType: folder.folderType,
    path: folder.path,
    parentId: folder.parentId,
  };
}

export function serializePlatformFileVersion(
  version: PlatformFileVersion,
): PlatformFileVersionView {
  return {
    id: version.id,
    versionNumber: version.versionNumber,
    sizeBytes: version.sizeBytes,
    checksum: version.checksum,
    changeNotes: version.changeNotes,
    createdAt: version.createdAt.toISOString(),
  };
}

export function serializeShareLink(link: PlatformFileShareLink): PlatformShareLinkView {
  return {
    id: link.id,
    linkType: link.linkType,
    token: link.token,
    expiresAt: link.expiresAt?.toISOString() ?? null,
    downloadLimit: link.downloadLimit,
    downloadCount: link.downloadCount,
    isActive: link.isActive,
  };
}

export function serializeFileAuditLog(log: PlatformFileAuditLog): PlatformAuditView {
  return {
    id: log.id,
    eventType: log.eventType,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeRetentionPolicy(
  policy: PlatformFileRetentionPolicy,
): PlatformRetentionView {
  return {
    id: policy.id,
    name: policy.name,
    module: policy.module,
    retentionDays: policy.retentionDays,
    action: policy.action,
    isActive: policy.isActive,
  };
}
