import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOwnedBusinessId } from "@/services/developer-platform-context.service";

export async function logApiRequest(input: {
  businessId: string;
  applicationId?: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.platformApiRequestLog.create({
    data: {
      businessId: input.businessId,
      applicationId: input.applicationId,
      method: input.method.toUpperCase(),
      path: input.path,
      statusCode: input.statusCode,
      duration: input.duration,
      ipAddress: input.ipAddress ?? "",
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function listApiRequestLogs(
  ownerId: string,
  filters?: { applicationId?: string; limit?: number },
) {
  const businessId = await getOwnedBusinessId(ownerId);
  return prisma.platformApiRequestLog.findMany({
    where: {
      businessId,
      ...(filters?.applicationId ? { applicationId: filters.applicationId } : {}),
    },
    include: { application: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: filters?.limit ?? 50,
  });
}

export async function searchApiRequestLogs(ownerId: string, query: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const trimmed = query.trim();
  if (!trimmed) return [];

  return prisma.platformApiRequestLog.findMany({
    where: {
      businessId,
      OR: [
        { path: { contains: trimmed, mode: "insensitive" } },
        { method: { contains: trimmed, mode: "insensitive" } },
        { ipAddress: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function getUsageAnalytics(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [total, byMethod, byDay] = await Promise.all([
    prisma.platformApiRequestLog.count({ where: { businessId, createdAt: { gte: since } } }),
    prisma.platformApiRequestLog.groupBy({
      by: ["method"],
      where: { businessId, createdAt: { gte: since } },
      _count: { id: true },
      _avg: { duration: true },
    }),
    prisma.platformApiRequestLog.findMany({
      where: { businessId, createdAt: { gte: since } },
      select: { createdAt: true, duration: true, statusCode: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  return {
    totalRequests7d: total,
    byMethod: byMethod.map((row) => ({
      method: row.method,
      count: row._count.id,
      avgDuration: Math.round(row._avg.duration ?? 0),
    })),
    recentSamples: byDay.length,
  };
}
