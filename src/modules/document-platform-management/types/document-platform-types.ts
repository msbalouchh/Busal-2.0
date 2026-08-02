import type {
  PlatformDocumentStatus,
  PlatformDocumentType,
  PlatformTemplateStatus,
} from "@prisma/client";

export interface DocumentRecord {
  id: string;
  name: string;
  slug: string;
  documentType: PlatformDocumentType;
  status: PlatformDocumentStatus;
  version: number;
  fileSize: number;
  mimeType: string;
  checksum: string;
  folderName: string | null;
  templateName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentFolderRecord {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  documentCount: number;
  childCount: number;
  createdAt: string;
}

export interface DocumentTemplateRecord {
  id: string;
  name: string;
  slug: string;
  documentType: PlatformDocumentType;
  content: string;
  status: PlatformTemplateStatus;
  createdAt: string;
}

export interface DocumentVersionRecord {
  id: string;
  version: number;
  filePath: string;
  checksum: string;
  createdAt: string;
}

export interface DocumentPreviewRecord {
  documentId: string;
  name: string;
  documentType: string;
  version: number;
  content: string;
  checksumValid: boolean;
  mimeType: string;
}

export interface DocumentSummaryRecord {
  total: number;
  active: number;
  archived: number;
  folders: number;
  templates: number;
}
