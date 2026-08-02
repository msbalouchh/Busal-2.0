import "server-only";

import { getDocument } from "@/services/document.service";
import { validateDocumentChecksum } from "@/services/document-version-manager.service";

export interface DocumentPreview {
  documentId: string;
  name: string;
  documentType: string;
  version: number;
  content: string;
  checksumValid: boolean;
  mimeType: string;
}

export async function previewDocument(
  ownerId: string,
  documentId: string,
): Promise<DocumentPreview | null> {
  const document = await getDocument(ownerId, documentId);
  if (!document) return null;

  const metadata = document.metadata as Record<string, unknown>;
  const checksumResult = await validateDocumentChecksum(ownerId, documentId);

  return {
    documentId: document.id,
    name: document.name,
    documentType: document.documentType,
    version: document.version,
    content: String(metadata.content ?? "{}"),
    checksumValid: checksumResult.valid,
    mimeType: document.mimeType,
  };
}

export async function getSecureDownloadPayload(ownerId: string, documentId: string) {
  const preview = await previewDocument(ownerId, documentId);
  if (!preview) throw new Error("Document not found");
  if (!preview.checksumValid) throw new Error("Checksum validation failed");

  return {
    filename: `${preview.name}.json`,
    content: preview.content,
    mimeType: preview.mimeType,
    secure: true,
  };
}
