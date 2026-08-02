import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function writeIntegrationLog(
  businessId: string,
  input: {
    connectionId?: string;
    level?: "DEBUG" | "INFO" | "WARN" | "ERROR";
    message: string;
    metadata?: Record<string, unknown>;
  },
) {
  return prisma.integrationLog.create({
    data: {
      businessId,
      connectionId: input.connectionId ?? null,
      level: input.level ?? "INFO",
      message: input.message,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function listIntegrationLogs(
  ownerId: string,
  query: { connectionId?: string; search?: string; limit?: number } = {},
) {
  const { getOwnedBusinessId } = await import("@/services/integration-context.service");
  const businessId = await getOwnedBusinessId(ownerId);

  return prisma.integrationLog.findMany({
    where: {
      businessId,
      ...(query.connectionId ? { connectionId: query.connectionId } : {}),
      ...(query.search?.trim()
        ? { message: { contains: query.search.trim(), mode: "insensitive" } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: query.limit ?? 50,
    include: {
      connection: { select: { displayName: true, provider: { select: { name: true } } } },
    },
  });
}
