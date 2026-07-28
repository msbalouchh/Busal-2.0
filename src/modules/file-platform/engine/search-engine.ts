import type { Prisma } from "@prisma/client";

import type { SearchFilesInput } from "@/modules/file-platform/types/file-platform-types";

export function buildFileSearchWhere(
  businessId: string,
  input: SearchFilesInput,
): Prisma.PlatformFileWhereInput {
  const conditions: Prisma.PlatformFileWhereInput[] = [
    { businessId, status: { not: "PERMANENTLY_DELETED" } },
  ];

  if (input.module) {
    conditions.push({ module: input.module });
  }

  if (input.tags && input.tags.length > 0) {
    conditions.push({ tags: { hasSome: input.tags } });
  }

  if (input.dateFrom || input.dateTo) {
    conditions.push({
      createdAt: {
        ...(input.dateFrom ? { gte: input.dateFrom } : {}),
        ...(input.dateTo ? { lte: input.dateTo } : {}),
      },
    });
  }

  if (input.query) {
    conditions.push({
      OR: [
        { originalName: { contains: input.query, mode: "insensitive" } },
        { tags: { has: input.query } },
        { module: { contains: input.query, mode: "insensitive" } },
        { entityType: { contains: input.query, mode: "insensitive" } },
      ],
    });
  }

  if (input.customerId) {
    conditions.push({ entityType: "customer", entityId: input.customerId });
  }

  if (input.projectId) {
    conditions.push({ entityType: "project", entityId: input.projectId });
  }

  return { AND: conditions };
}

export function buildFolderPath(parentPath: string | null, slug: string): string {
  return parentPath ? `${parentPath}/${slug}` : `/${slug}`;
}
