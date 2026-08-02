import "server-only";

import type { PlatformObservabilityLogLevel, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getObservabilityBusinessId } from "@/services/observability-platform-context.service";

export async function recordMetric(
  ownerId: string,
  input: {
    service: string;
    metric: string;
    value: number;
    unit?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const businessId = await getObservabilityBusinessId(ownerId);
  return prisma.platformMetric.create({
    data: {
      businessId,
      service: input.service,
      metric: input.metric,
      value: input.value,
      unit: input.unit ?? "",
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function listMetrics(
  ownerId: string,
  filters?: {
    service?: string;
    metric?: string;
    since?: Date;
    limit?: number;
  },
) {
  const businessId = await getObservabilityBusinessId(ownerId);
  return prisma.platformMetric.findMany({
    where: {
      businessId,
      ...(filters?.service ? { service: filters.service } : {}),
      ...(filters?.metric ? { metric: filters.metric } : {}),
      ...(filters?.since ? { recordedAt: { gte: filters.since } } : {}),
    },
    orderBy: { recordedAt: "desc" },
    take: filters?.limit ?? 100,
  });
}

export async function getMetricsSummary(ownerId: string) {
  const businessId = await getObservabilityBusinessId(ownerId);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [total, byService, recent] = await Promise.all([
    prisma.platformMetric.count({ where: { businessId, recordedAt: { gte: since } } }),
    prisma.platformMetric.groupBy({
      by: ["service"],
      where: { businessId, recordedAt: { gte: since } },
      _count: { id: true },
      _avg: { value: true },
    }),
    prisma.platformMetric.findMany({
      where: { businessId },
      orderBy: { recordedAt: "desc" },
      take: 20,
    }),
  ]);

  return {
    total24h: total,
    byService: byService.map((row) => ({
      service: row.service,
      count: row._count.id,
      avgValue: row._avg.value ?? 0,
    })),
    recent,
  };
}

export async function publishTelemetry(
  ownerId: string,
  input: {
    service: string;
    metric: string;
    value: number;
    unit?: string;
    level?: PlatformObservabilityLogLevel;
    message?: string;
  },
) {
  const metric = await recordMetric(ownerId, {
    service: input.service,
    metric: input.metric,
    value: input.value,
    unit: input.unit,
  });

  if (input.message) {
    const { writePlatformLog } = await import("@/services/platform-logging.service");
    await writePlatformLog(ownerId, {
      service: input.service,
      level: input.level ?? "INFO",
      category: "telemetry",
      message: input.message,
    });
  }

  return metric;
}

export async function ensureDefaultObservabilityMetrics(ownerId: string) {
  const businessId = await getObservabilityBusinessId(ownerId);
  const existing = await prisma.platformMetric.count({ where: { businessId } });
  if (existing > 0) return;

  const samples = [
    { service: "authentication", metric: "login.success_rate", value: 99.2, unit: "%" },
    { service: "restaurant", metric: "orders.per_hour", value: 42, unit: "count" },
    { service: "payments", metric: "payment.latency_p95", value: 120, unit: "ms" },
    { service: "ai-platform", metric: "agent.executions", value: 18, unit: "count" },
    { service: "marketplace", metric: "apps.installed", value: 3, unit: "count" },
  ];

  for (const sample of samples) {
    await recordMetric(ownerId, sample);
  }
}
