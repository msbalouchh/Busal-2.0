import type {
  FileAiProcessingType,
  FileFolderType,
  FilePermissionLevel,
  FilePermissionScope,
  FilePreviewType,
  FileRetentionAction,
  FileShareLinkType,
  FileStorageProvider,
} from "@prisma/client";

export interface StorageProviderDefinition {
  provider: FileStorageProvider;
  name: string;
  description: string;
  isIntegrated: boolean;
}

export interface UploadFileInput {
  module: string;
  entityType?: string | null;
  entityId?: string | null;
  folderId?: string | null;
  originalName: string;
  mimeType: string;
  content: Buffer | string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  changeNotes?: string | null;
}

export interface CreateFolderInput {
  folderType: FileFolderType;
  name: string;
  parentId?: string | null;
  department?: string | null;
  projectId?: string | null;
  customerId?: string | null;
}

export interface CreateFileVersionInput {
  fileId: string;
  content: Buffer | string;
  originalName: string;
  mimeType: string;
  changeNotes?: string | null;
}

export interface SetFilePermissionInput {
  fileId: string;
  scope: FilePermissionScope;
  scopeRef?: string | null;
  level: FilePermissionLevel;
}

export interface CreateShareLinkInput {
  fileId: string;
  linkType: FileShareLinkType;
  password?: string | null;
  expiresAt?: Date | null;
  downloadLimit?: number | null;
}

export interface SearchFilesInput {
  query?: string;
  tags?: string[];
  module?: string;
  customerId?: string;
  projectId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CreateRetentionPolicyInput {
  name: string;
  module?: string | null;
  retentionDays: number;
  action?: FileRetentionAction;
}

export interface QueueAiProcessingInput {
  fileId: string;
  jobType: FileAiProcessingType;
}

export interface FilePlatformDashboardMetrics {
  totalFiles: number;
  activeFiles: number;
  totalFolders: number;
  sharedLinks: number;
  archivedFiles: number;
  storageProviders: number;
}

export interface StorageUploadResult {
  storageKey: string;
  storedName: string;
  checksum: string;
  sizeBytes: number;
  provider: FileStorageProvider;
}

export interface FileVersionCompareResult {
  fromVersion: number;
  toVersion: number;
  sizeDelta: number;
  checksumChanged: boolean;
}

export interface FilePreviewInfo {
  previewType: FilePreviewType | null;
  supported: boolean;
}
