import "server-only";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/media-platform-context.service";
import { writeMediaAuditLog } from "@/services/media-audit-logger.service";

export async function listMediaFolders(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformMediaFolder.findMany({
    where: { businessId },
    include: {
      _count: { select: { files: true, children: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createMediaFolder(
  ownerId: string,
  input: { name: string; description?: string; parentId?: string },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const folder = await prisma.platformMediaFolder.create({
    data: {
      businessId,
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      parentId: input.parentId,
    },
  });

  await writeMediaAuditLog(businessId, {
    action: "media.folder.created",
    entityId: folder.id,
    message: `Folder created: ${folder.name}`,
  });

  return folder;
}

export async function deleteMediaFolder(ownerId: string, folderId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const folder = await prisma.platformMediaFolder.findFirst({
    where: { id: folderId, businessId },
  });
  if (!folder) return null;

  await prisma.platformMediaFile.updateMany({
    where: { folderId, businessId },
    data: { folderId: null },
  });

  await prisma.platformMediaFolder.delete({ where: { id: folderId } });

  await writeMediaAuditLog(businessId, {
    action: "media.folder.deleted",
    entityId: folderId,
    message: `Folder deleted: ${folder.name}`,
  });

  return folder;
}
