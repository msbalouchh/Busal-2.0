import "server-only";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/media-platform-context.service";

export async function searchMediaFiles(ownerId: string, query: string, limit = 20) {
  const businessId = await getOwnedBusinessId(ownerId);
  const trimmed = query.trim();
  if (!trimmed) return [];

  return prisma.platformMediaFile.findMany({
    where: {
      businessId,
      deletedAt: null,
      OR: [
        { name: { contains: trimmed, mode: "insensitive" } },
        { originalName: { contains: trimmed, mode: "insensitive" } },
        { extension: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    include: { folder: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export async function searchMediaTags(ownerId: string, query: string, limit = 10) {
  const businessId = await getOwnedBusinessId(ownerId);
  const trimmed = query.trim();
  if (!trimmed) return [];

  return prisma.platformMediaTag.findMany({
    where: {
      businessId,
      name: { contains: trimmed, mode: "insensitive" },
    },
    take: limit,
  });
}
