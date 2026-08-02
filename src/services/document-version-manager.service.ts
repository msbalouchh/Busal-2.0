import "server-only";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/document-platform-context.service";

export async function createDocumentVersion(
  ownerId: string,
  documentId: string,
  input: { version: number; filePath: string; checksum: string; content: string },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const document = await prisma.platformDocument.findFirst({
    where: { id: documentId, businessId },
  });
  if (!document) throw new Error("Document not found");

  return prisma.platformDocumentVersion.create({
    data: {
      documentId,
      version: input.version,
      filePath: input.filePath,
      checksum: input.checksum,
      createdBy: ownerId,
    },
  });
}

export async function listDocumentVersions(ownerId: string, documentId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const document = await prisma.platformDocument.findFirst({
    where: { id: documentId, businessId },
  });
  if (!document) return [];

  return prisma.platformDocumentVersion.findMany({
    where: { documentId },
    orderBy: { version: "desc" },
  });
}

export async function getDocumentVersion(ownerId: string, documentId: string, version: number) {
  const businessId = await getOwnedBusinessId(ownerId);
  const document = await prisma.platformDocument.findFirst({
    where: { id: documentId, businessId },
  });
  if (!document) return null;

  return prisma.platformDocumentVersion.findFirst({
    where: { documentId, version },
  });
}

export async function validateDocumentChecksum(
  ownerId: string,
  documentId: string,
): Promise<{ valid: boolean; checksum: string }> {
  const document = await prisma.platformDocument.findFirst({
    where: { id: documentId, businessId: await getOwnedBusinessId(ownerId) },
  });
  if (!document) return { valid: false, checksum: "" };

  const version = await prisma.platformDocumentVersion.findFirst({
    where: { documentId, version: document.version },
  });

  return {
    valid: version ? version.checksum === document.checksum : false,
    checksum: document.checksum,
  };
}
