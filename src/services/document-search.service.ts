import "server-only";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/document-platform-context.service";

export async function searchDocuments(ownerId: string, query: string, limit = 20) {
  const businessId = await getOwnedBusinessId(ownerId);
  const trimmed = query.trim();
  if (!trimmed) return [];

  return prisma.platformDocument.findMany({
    where: {
      businessId,
      status: { not: "DELETED" },
      OR: [
        { name: { contains: trimmed, mode: "insensitive" } },
        { slug: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export async function searchDocumentTemplates(ownerId: string, query: string, limit = 20) {
  const businessId = await getOwnedBusinessId(ownerId);
  const trimmed = query.trim();
  if (!trimmed) return [];

  return prisma.platformDocumentTemplate.findMany({
    where: {
      businessId,
      OR: [
        { name: { contains: trimmed, mode: "insensitive" } },
        { slug: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    take: limit,
  });
}
