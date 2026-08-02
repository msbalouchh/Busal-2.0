import "server-only";

import { prisma } from "@/lib/prisma";
import { getObservabilityBusinessId } from "@/services/observability-platform-context.service";

export async function getPerformanceSummary(ownerId: string) {
  const businessId = await getObservabilityBusinessId(ownerId);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const latencyMetrics = await prisma.platformMetric.findMany({
    where: {
      businessId,
      recordedAt: { gte: since },
      metric: { contains: "latency", mode: "insensitive" },
    },
    orderBy: { recordedAt: "desc" },
    take: 100,
  });

  const throughputMetrics = await prisma.platformMetric.findMany({
    where: {
      businessId,
      recordedAt: { gte: since },
      OR: [
        { metric: { contains: "per_hour", mode: "insensitive" } },
        { metric: { contains: "executions", mode: "insensitive" } },
        { metric: { contains: "requests", mode: "insensitive" } },
      ],
    },
    orderBy: { recordedAt: "desc" },
    take: 100,
  });

  const avgLatency =
    latencyMetrics.length > 0
      ? latencyMetrics.reduce((sum, m) => sum + m.value, 0) / latencyMetrics.length
      : 0;

  const totalThroughput = throughputMetrics.reduce((sum, m) => sum + m.value, 0);

  const byService = await prisma.platformMetric.groupBy({
    by: ["service"],
    where: { businessId, recordedAt: { gte: since } },
    _avg: { value: true },
    _max: { value: true },
  });

  return {
    avgLatencyMs: Math.round(avgLatency),
    totalThroughput,
    latencySeries: latencyMetrics.slice(0, 20).map((m) => ({
      service: m.service,
      metric: m.metric,
      value: m.value,
      recordedAt: m.recordedAt.toISOString(),
    })),
    throughputSeries: throughputMetrics.slice(0, 20).map((m) => ({
      service: m.service,
      metric: m.metric,
      value: m.value,
      recordedAt: m.recordedAt.toISOString(),
    })),
    byService: byService.map((row) => ({
      service: row.service,
      avgValue: Math.round((row._avg.value ?? 0) * 100) / 100,
      maxValue: row._max.value ?? 0,
    })),
  };
}

export async function getUsageMetrics(ownerId: string) {
  const businessId = await getObservabilityBusinessId(ownerId);
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [metrics, logs, incidents, alerts] = await Promise.all([
    prisma.platformMetric.count({ where: { businessId, recordedAt: { gte: since } } }),
    prisma.platformLog.count({ where: { businessId, createdAt: { gte: since } } }),
    prisma.platformIncident.count({ where: { businessId, startedAt: { gte: since } } }),
    prisma.platformAlert.count({ where: { businessId, triggeredAt: { gte: since } } }),
  ]);

  return { metrics7d: metrics, logs7d: logs, incidents7d: incidents, alerts7d: alerts };
}
