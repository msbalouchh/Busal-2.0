"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { DOCUMENT_PLATFORM_ROUTES } from "@/modules/document-platform-management/constants/routes";
import { requireDocumentPlatformActionContext } from "@/modules/document-platform-management/lib/get-document-platform-context";
import {
  validateDocumentName,
  validateDocumentSlug,
} from "@/modules/document-platform-management/lib/document-platform-validation";
import {
  archiveDocument,
  createDocument,
  deleteDocument,
  duplicateDocument,
  restoreDocument,
  updateDocument,
} from "@/services/document.service";
import { createDocumentFolder, deleteDocumentFolder } from "@/services/document-folder.service";
import {
  createDocumentTemplate,
  deleteDocumentTemplate,
} from "@/services/document-template.service";
import { exportDocument } from "@/services/document-export-manager.service";
import { getDocument } from "@/services/document.service";
import { generateInvoiceContent } from "@/services/document-pdf-generator.service";

function revalidateDocumentPages(documentId?: string): void {
  const routes = [
    DOCUMENT_PLATFORM_ROUTES.dashboard(),
    DOCUMENT_PLATFORM_ROUTES.library(),
    DOCUMENT_PLATFORM_ROUTES.folders(),
    DOCUMENT_PLATFORM_ROUTES.templates(),
    DOCUMENT_PLATFORM_ROUTES.search(),
  ];
  for (const route of routes) revalidatePath(route);
  if (documentId) {
    revalidatePath(DOCUMENT_PLATFORM_ROUTES.documentDetail(documentId));
    revalidatePath(DOCUMENT_PLATFORM_ROUTES.documentVersions(documentId));
  }
}

export async function createDocumentAction(input: {
  name: string;
  slug: string;
  documentType:
    | "INVOICE"
    | "RECEIPT"
    | "QUOTE"
    | "PURCHASE_ORDER"
    | "CONTRACT"
    | "REPORT"
    | "CERTIFICATE"
    | "LETTER"
    | "FORM"
    | "CUSTOM";
  folderId?: string;
  content?: string;
}) {
  const context = await requireDocumentPlatformActionContext(PERMISSION_CODES.DOCUMENT_CREATE);
  const generated =
    input.documentType === "INVOICE"
      ? generateInvoiceContent({ number: "INV-001", customer: "Customer", total: "0" })
      : null;

  const document = await createDocument(context.user.id, {
    name: validateDocumentName(input.name),
    slug: validateDocumentSlug(input.slug),
    documentType: input.documentType,
    folderId: input.folderId,
    content: input.content ?? generated?.content ?? "{}",
  });
  revalidateDocumentPages(document?.id);
  return { id: document?.id ?? "" };
}

export async function updateDocumentAction(
  documentId: string,
  input: { name?: string; content?: string; status?: "DRAFT" | "ACTIVE" | "ARCHIVED" },
) {
  const context = await requireDocumentPlatformActionContext(PERMISSION_CODES.DOCUMENT_UPDATE);
  await updateDocument(context.user.id, documentId, input);
  revalidateDocumentPages(documentId);
}

export async function archiveDocumentAction(documentId: string) {
  const context = await requireDocumentPlatformActionContext(PERMISSION_CODES.DOCUMENT_UPDATE);
  await archiveDocument(context.user.id, documentId);
  revalidateDocumentPages(documentId);
}

export async function restoreDocumentAction(documentId: string) {
  const context = await requireDocumentPlatformActionContext(PERMISSION_CODES.DOCUMENT_UPDATE);
  await restoreDocument(context.user.id, documentId);
  revalidateDocumentPages(documentId);
}

export async function deleteDocumentAction(documentId: string) {
  const context = await requireDocumentPlatformActionContext(PERMISSION_CODES.DOCUMENT_DELETE);
  await deleteDocument(context.user.id, documentId);
  revalidateDocumentPages(documentId);
}

export async function duplicateDocumentAction(documentId: string) {
  const context = await requireDocumentPlatformActionContext(PERMISSION_CODES.DOCUMENT_CREATE);
  const copy = await duplicateDocument(context.user.id, documentId);
  revalidateDocumentPages(copy?.id ?? undefined);
  return { id: copy?.id ?? "" };
}

export async function exportDocumentAction(
  documentId: string,
  format: "PDF" | "DOCX" | "XLSX" | "CSV" | "HTML" | "JSON",
) {
  const context = await requireDocumentPlatformActionContext(PERMISSION_CODES.DOCUMENT_EXPORT);
  const document = await getDocument(context.user.id, documentId);
  if (!document) throw new Error("Document not found");
  return exportDocument(document, format);
}

export async function createDocumentFolderAction(input: {
  name: string;
  description?: string;
  parentId?: string;
}) {
  const context = await requireDocumentPlatformActionContext(PERMISSION_CODES.DOCUMENT_CREATE);
  const folder = await createDocumentFolder(context.user.id, input);
  revalidateDocumentPages();
  return { id: folder.id };
}

export async function deleteDocumentFolderAction(folderId: string) {
  const context = await requireDocumentPlatformActionContext(PERMISSION_CODES.DOCUMENT_DELETE);
  await deleteDocumentFolder(context.user.id, folderId);
  revalidateDocumentPages();
}

export async function createDocumentTemplateAction(input: {
  name: string;
  slug: string;
  documentType:
    | "INVOICE"
    | "RECEIPT"
    | "QUOTE"
    | "PURCHASE_ORDER"
    | "CONTRACT"
    | "REPORT"
    | "CERTIFICATE"
    | "LETTER"
    | "FORM"
    | "CUSTOM";
  content: string;
}) {
  const context = await requireDocumentPlatformActionContext(PERMISSION_CODES.DOCUMENT_CREATE);
  const template = await createDocumentTemplate(context.user.id, {
    ...input,
    slug: validateDocumentSlug(input.slug),
  });
  revalidateDocumentPages();
  return { id: template.id };
}

export async function deleteDocumentTemplateAction(templateId: string) {
  const context = await requireDocumentPlatformActionContext(PERMISSION_CODES.DOCUMENT_DELETE);
  await deleteDocumentTemplate(context.user.id, templateId);
  revalidateDocumentPages();
}
