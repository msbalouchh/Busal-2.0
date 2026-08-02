import "server-only";

import type { PlatformDocumentStatus, PlatformDocumentType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  buildVirtualFilePath,
  computeDocumentChecksum,
  getOwnedBusinessId,
} from "@/services/document-platform-context.service";
import { createDocumentVersion } from "@/services/document-version-manager.service";
import { writeDocumentAuditLog } from "@/services/document-audit-logger.service";

export async function listDocuments(
  ownerId: string,
  filters?: {
    status?: PlatformDocumentStatus;
    documentType?: PlatformDocumentType;
    folderId?: string;
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformDocument.findMany({
    where: {
      businessId,
      status: filters?.status ? filters.status : { not: "DELETED" },
      ...(filters?.documentType ? { documentType: filters.documentType } : {}),
      ...(filters?.folderId ? { folderId: filters.folderId } : {}),
    },
    include: { folder: { select: { name: true } }, template: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getDocument(ownerId: string, documentId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformDocument.findFirst({
    where: { id: documentId, businessId },
    include: {
      folder: true,
      template: true,
      versions: { orderBy: { version: "desc" } },
    },
  });
}

export async function createDocument(
  ownerId: string,
  input: {
    name: string;
    slug: string;
    documentType: PlatformDocumentType;
    folderId?: string;
    templateId?: string;
    content?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const content = input.content ?? "{}";
  const checksum = computeDocumentChecksum(content);
  const filePath = buildVirtualFilePath(businessId, "pending", 1);

  const document = await prisma.platformDocument.create({
    data: {
      businessId,
      folderId: input.folderId,
      templateId: input.templateId,
      name: input.name,
      slug: input.slug,
      documentType: input.documentType,
      status: "DRAFT",
      version: 1,
      filePath,
      fileSize: Buffer.byteLength(content, "utf8"),
      mimeType: "application/json",
      checksum,
      metadata: (input.metadata ?? { content }) as Prisma.InputJsonValue,
      createdBy: ownerId,
    },
  });

  const resolvedPath = buildVirtualFilePath(businessId, document.id, 1);
  await prisma.platformDocument.update({
    where: { id: document.id },
    data: { filePath: resolvedPath },
  });

  await createDocumentVersion(ownerId, document.id, {
    version: 1,
    filePath: resolvedPath,
    checksum,
    content,
  });

  await writeDocumentAuditLog(businessId, {
    action: "document.created",
    entityId: document.id,
    message: `Document created: ${document.name}`,
  });

  return getDocument(ownerId, document.id);
}

export async function updateDocument(
  ownerId: string,
  documentId: string,
  input: {
    name?: string;
    content?: string;
    status?: PlatformDocumentStatus;
    folderId?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformDocument.findFirst({
    where: { id: documentId, businessId },
  });
  if (!existing) return null;

  let version = existing.version;
  let checksum = existing.checksum;
  let filePath = existing.filePath;
  let fileSize = existing.fileSize;

  if (input.content !== undefined) {
    version += 1;
    checksum = computeDocumentChecksum(input.content);
    filePath = buildVirtualFilePath(businessId, documentId, version);
    fileSize = Buffer.byteLength(input.content, "utf8");
    await createDocumentVersion(ownerId, documentId, {
      version,
      filePath,
      checksum,
      content: input.content,
    });
  }

  return prisma.platformDocument.update({
    where: { id: documentId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.folderId !== undefined ? { folderId: input.folderId } : {}),
      ...(input.metadata !== undefined
        ? { metadata: input.metadata as Prisma.InputJsonValue }
        : {}),
      version,
      checksum,
      filePath,
      fileSize,
    },
  });
}

export async function archiveDocument(ownerId: string, documentId: string) {
  return updateDocument(ownerId, documentId, { status: "ARCHIVED" });
}

export async function restoreDocument(ownerId: string, documentId: string) {
  return updateDocument(ownerId, documentId, { status: "ACTIVE" });
}

export async function deleteDocument(ownerId: string, documentId: string) {
  return updateDocument(ownerId, documentId, { status: "DELETED" });
}

export async function duplicateDocument(ownerId: string, documentId: string) {
  const source = await getDocument(ownerId, documentId);
  if (!source) throw new Error("Document not found");

  const metadata = source.metadata as Record<string, unknown>;
  const content = String(metadata.content ?? "{}");

  return createDocument(ownerId, {
    name: `${source.name} (Copy)`,
    slug: `${source.slug}-copy-${Date.now()}`,
    documentType: source.documentType,
    folderId: source.folderId ?? undefined,
    templateId: source.templateId ?? undefined,
    content,
    metadata: { ...metadata, duplicatedFrom: source.id },
  });
}

export async function getRecentDocuments(ownerId: string, limit = 10) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformDocument.findMany({
    where: { businessId, status: { not: "DELETED" } },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export async function getDocumentDashboardSummary(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const [total, active, archived, folders, templates] = await Promise.all([
    prisma.platformDocument.count({ where: { businessId, status: { not: "DELETED" } } }),
    prisma.platformDocument.count({ where: { businessId, status: "ACTIVE" } }),
    prisma.platformDocument.count({ where: { businessId, status: "ARCHIVED" } }),
    prisma.platformDocumentFolder.count({ where: { businessId } }),
    prisma.platformDocumentTemplate.count({ where: { businessId } }),
  ]);

  return { total, active, archived, folders, templates };
}
