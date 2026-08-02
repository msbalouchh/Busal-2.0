import "server-only";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/media-platform-context.service";
import { writeMediaAuditLog } from "@/services/media-audit-logger.service";

export async function listMediaTags(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformMediaTag.findMany({
    where: { businessId },
    include: { _count: { select: { fileTags: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createMediaTag(ownerId: string, input: { name: string; color?: string }) {
  const businessId = await getOwnedBusinessId(ownerId);
  const tag = await prisma.platformMediaTag.create({
    data: {
      businessId,
      name: input.name.trim(),
      color: input.color ?? "#6366f1",
    },
  });

  await writeMediaAuditLog(businessId, {
    action: "media.tag.created",
    entityId: tag.id,
    message: `Tag created: ${tag.name}`,
  });

  return tag;
}

export async function deleteMediaTag(ownerId: string, tagId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const tag = await prisma.platformMediaTag.findFirst({
    where: { id: tagId, businessId },
  });
  if (!tag) return null;

  await prisma.platformMediaFileTag.deleteMany({ where: { tagId } });
  await prisma.platformMediaTag.delete({ where: { id: tagId } });

  await writeMediaAuditLog(businessId, {
    action: "media.tag.deleted",
    entityId: tagId,
    message: `Tag deleted: ${tag.name}`,
  });

  return tag;
}

export async function tagMediaFile(ownerId: string, fileId: string, tagId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const [file, tag] = await Promise.all([
    prisma.platformMediaFile.findFirst({ where: { id: fileId, businessId } }),
    prisma.platformMediaTag.findFirst({ where: { id: tagId, businessId } }),
  ]);
  if (!file || !tag) return null;

  return prisma.platformMediaFileTag.upsert({
    where: { fileId_tagId: { fileId, tagId } },
    create: { fileId, tagId },
    update: {},
    include: { tag: true },
  });
}

export async function untagMediaFile(ownerId: string, fileId: string, tagId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const file = await prisma.platformMediaFile.findFirst({
    where: { id: fileId, businessId },
  });
  if (!file) return null;

  await prisma.platformMediaFileTag.deleteMany({ where: { fileId, tagId } });
  return { fileId, tagId };
}
