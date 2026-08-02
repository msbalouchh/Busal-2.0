import "server-only";

import { MONITORED_SERVICES } from "@/services/observability-platform-context.service";
import { getObservabilityBusinessId } from "@/services/observability-platform-context.service";
import { prisma } from "@/lib/prisma";

export interface ServiceHealthStatus {
  service: string;
  status: "healthy" | "degraded" | "down";
  errorRate: number;
  lastSeen: Date | null;
}

export async function getSystemHealth(ownerId: string) {
  const businessId = await getObservabilityBusinessId(ownerId);
  const since = new Date(Date.now() - 60 * 60 * 1000);

  const [errorLogs, totalLogs, recentMetrics] = await Promise.all([
    prisma.platformLog.count({
      where: {
        businessId,
        createdAt: { gte: since },
        level: { in: ["ERROR", "CRITICAL"] },
      },
    }),
    prisma.platformLog.count({ where: { businessId, createdAt: { gte: since } } }),
    prisma.platformMetric.findMany({
      where: { businessId, recordedAt: { gte: since } },
      orderBy: { recordedAt: "desc" },
      take: 50,
    }),
  ]);

  const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0;
  const overallStatus: "healthy" | "degraded" | "down" =
    errorRate > 10 ? "down" : errorRate > 3 ? "degraded" : "healthy";

  return {
    overallStatus,
    errorRate: Math.round(errorRate * 10) / 10,
    totalLogs1h: totalLogs,
    errorLogs1h: errorLogs,
    metrics1h: recentMetrics.length,
  };
}

export async function getServiceHealth(ownerId: string): Promise<ServiceHealthStatus[]> {
  const businessId = await getObservabilityBusinessId(ownerId);
  const since = new Date(Date.now() - 60 * 60 * 1000);

  const results: ServiceHealthStatus[] = [];

  for (const service of MONITORED_SERVICES) {
    const [errors, total, lastLog] = await Promise.all([
      prisma.platformLog.count({
        where: {
          businessId,
          service,
          createdAt: { gte: since },
          level: { in: ["ERROR", "CRITICAL"] },
        },
      }),
      prisma.platformLog.count({
        where: { businessId, service, createdAt: { gte: since } },
      }),
      prisma.platformLog.findFirst({
        where: { businessId, service },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const errorRate = total > 0 ? (errors / total) * 100 : 0;
    const status = errorRate > 15 ? "down" : errorRate > 5 ? "degraded" : "healthy";

    results.push({
      service,
      status,
      errorRate: Math.round(errorRate * 10) / 10,
      lastSeen: lastLog?.createdAt ?? null,
    });
  }

  return results;
}
