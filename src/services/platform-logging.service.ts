import "server-only";

import type { PlatformObservabilityLogLevel, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  computeLogChecksum,
  getObservabilityBusinessId,
  sealLogMessage,
  unsealLogMessage,
} from "@/services/observability-platform-context.service";

export async function writePlatformLog(
  ownerId: string,
  input: {
    service: string;
    level?: PlatformObservabilityLogLevel;
    category?: string;
    message: string;
    stackTrace?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const businessId = await getObservabilityBusinessId(ownerId);
  const sealedMessage = sealLogMessage(input.message, businessId);
  const checksum = computeLogChecksum(
    JSON.stringify({
      businessId,
      service: input.service,
      level: input.level ?? "INFO",
      message: input.message,
    }),
  );

  return prisma.platformLog.create({
    data: {
      businessId,
      service: input.service,
      level: input.level ?? "INFO",
      category: input.category ?? "general",
      message: sealedMessage,
      stackTrace: input.stackTrace ?? "",
      checksum,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function listPlatformLogs(
  ownerId: string,
  filters?: {
    service?: string;
    level?: PlatformObservabilityLogLevel;
    category?: string;
    search?: string;
    since?: Date;
    limit?: number;
  },
) {
  const businessId = await getObservabilityBusinessId(ownerId);
  const logs = await prisma.platformLog.findMany({
    where: {
      businessId,
      ...(filters?.service ? { service: filters.service } : {}),
      ...(filters?.level ? { level: filters.level } : {}),
      ...(filters?.category ? { category: filters.category } : {}),
      ...(filters?.since ? { createdAt: { gte: filters.since } } : {}),
      ...(filters?.search
        ? {
            OR: [
              { message: { contains: filters.search, mode: "insensitive" } },
              { service: { contains: filters.search, mode: "insensitive" } },
              { category: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: filters?.limit ?? 100,
  });

  return logs.map((log) => ({
    ...log,
    message: unsealLogMessage(log.message, businessId),
  }));
}

export async function getLogsSummary(ownerId: string) {
  const businessId = await getObservabilityBusinessId(ownerId);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [total, byLevel, byService] = await Promise.all([
    prisma.platformLog.count({ where: { businessId, createdAt: { gte: since } } }),
    prisma.platformLog.groupBy({
      by: ["level"],
      where: { businessId, createdAt: { gte: since } },
      _count: { id: true },
    }),
    prisma.platformLog.groupBy({
      by: ["service"],
      where: { businessId, createdAt: { gte: since } },
      _count: { id: true },
    }),
  ]);

  return {
    total24h: total,
    byLevel: byLevel.map((row) => ({ level: row.level, count: row._count.id })),
    byService: byService.map((row) => ({ service: row.service, count: row._count.id })),
  };
}

export function validateLogIntegrity(
  log: { checksum: string; message: string; service: string; level: string },
  businessId: string,
  plainMessage: string,
): boolean {
  const expected = computeLogChecksum(
    JSON.stringify({
      businessId,
      service: log.service,
      level: log.level,
      message: plainMessage,
    }),
  );
  return expected === log.checksum;
}
