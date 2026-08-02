import "server-only";

import type { PlatformDocumentType } from "@prisma/client";

import { createDocument } from "@/services/document.service";

export interface DocumentImportResult {
  success: boolean;
  documentId?: string;
  message: string;
}

export async function importDocument(
  ownerId: string,
  input: {
    name: string;
    slug: string;
    documentType: PlatformDocumentType;
    content: string;
    folderId?: string;
  },
): Promise<DocumentImportResult> {
  const document = await createDocument(ownerId, {
    name: input.name,
    slug: input.slug,
    documentType: input.documentType,
    folderId: input.folderId,
    content: input.content,
    metadata: { imported: true, source: "import-manager" },
  });

  return {
    success: true,
    documentId: document?.id,
    message: "Document imported (framework only — no external storage)",
  };
}
