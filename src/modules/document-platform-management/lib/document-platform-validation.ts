import type {
  PlatformDocument,
  PlatformDocumentFolder,
  PlatformDocumentTemplate,
  PlatformDocumentVersion,
} from "@prisma/client";

import type {
  DocumentFolderRecord,
  DocumentPreviewRecord,
  DocumentRecord,
  DocumentSummaryRecord,
  DocumentTemplateRecord,
  DocumentVersionRecord,
} from "@/modules/document-platform-management/types/document-platform-types";
import type { DocumentPreview } from "@/services/document-preview.service";

export function serializeDocument(
  document: PlatformDocument & {
    folder?: { name: string } | null;
    template?: { name: string } | null;
  },
): DocumentRecord {
  return {
    id: document.id,
    name: document.name,
    slug: document.slug,
    documentType: document.documentType,
    status: document.status,
    version: document.version,
    fileSize: document.fileSize,
    mimeType: document.mimeType,
    checksum: document.checksum,
    folderName: document.folder?.name ?? null,
    templateName: document.template?.name ?? null,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

export function serializeDocumentFolder(
  folder: PlatformDocumentFolder & { _count?: { documents: number; children: number } },
): DocumentFolderRecord {
  return {
    id: folder.id,
    name: folder.name,
    description: folder.description,
    parentId: folder.parentId,
    documentCount: folder._count?.documents ?? 0,
    childCount: folder._count?.children ?? 0,
    createdAt: folder.createdAt.toISOString(),
  };
}

export function serializeDocumentTemplate(
  template: PlatformDocumentTemplate,
): DocumentTemplateRecord {
  return {
    id: template.id,
    name: template.name,
    slug: template.slug,
    documentType: template.documentType,
    content: template.content,
    status: template.status,
    createdAt: template.createdAt.toISOString(),
  };
}

export function serializeDocumentVersion(version: PlatformDocumentVersion): DocumentVersionRecord {
  return {
    id: version.id,
    version: version.version,
    filePath: version.filePath,
    checksum: version.checksum,
    createdAt: version.createdAt.toISOString(),
  };
}

export function serializeDocumentPreview(preview: DocumentPreview): DocumentPreviewRecord {
  return preview;
}

export function serializeDocumentSummary(summary: DocumentSummaryRecord): DocumentSummaryRecord {
  return summary;
}

export function validateDocumentSlug(slug: string): string {
  const trimmed = slug.trim().toLowerCase().replace(/\s+/g, "-");
  if (!trimmed) throw new Error("Document slug is required");
  return trimmed;
}

export function validateDocumentName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Document name is required");
  return trimmed;
}
