import "server-only";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/document-platform-context.service";
import { writeDocumentAuditLog } from "@/services/document-audit-logger.service";

export async function listDocumentFolders(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformDocumentFolder.findMany({
    where: { businessId },
    include: { _count: { select: { documents: true, children: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createDocumentFolder(
  ownerId: string,
  input: { name: string; description?: string; parentId?: string },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const folder = await prisma.platformDocumentFolder.create({
    data: {
      businessId,
      name: input.name,
      description: input.description ?? "",
      parentId: input.parentId,
    },
  });
  await writeDocumentAuditLog(businessId, {
    action: "folder.created",
    entityId: folder.id,
    message: `Folder created: ${folder.name}`,
  });
  return folder;
}

export async function updateDocumentFolder(
  ownerId: string,
  folderId: string,
  input: { name?: string; description?: string; parentId?: string | null },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformDocumentFolder.findFirst({
    where: { id: folderId, businessId },
  });
  if (!existing) return null;

  return prisma.platformDocumentFolder.update({
    where: { id: folderId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
    },
  });
}

export async function deleteDocumentFolder(ownerId: string, folderId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.platformDocumentFolder.findFirst({
    where: { id: folderId, businessId },
  });
  if (!existing) return false;
  await prisma.platformDocumentFolder.delete({ where: { id: folderId } });
  return true;
}
