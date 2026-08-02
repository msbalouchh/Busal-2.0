import "server-only";

import { prisma } from "@/lib/prisma";
import { getObservabilityBusinessId } from "@/services/observability-platform-context.service";
import { writePlatformLog } from "@/services/platform-logging.service";

export async function recordTraceSpan(
  ownerId: string,
  input: {
    traceId: string;
    spanId: string;
    service: string;
    operation: string;
    durationMs: number;
    status?: "ok" | "error";
    metadata?: Record<string, unknown>;
  },
) {
  return writePlatformLog(ownerId, {
    service: input.service,
    level: input.status === "error" ? "ERROR" : "DEBUG",
    category: "trace",
    message: `${input.operation} (${input.durationMs}ms)`,
    metadata: {
      traceId: input.traceId,
      spanId: input.spanId,
      durationMs: input.durationMs,
      status: input.status ?? "ok",
      ...(input.metadata ?? {}),
    },
  });
}

export async function listTraces(
  ownerId: string,
  filters?: { service?: string; traceId?: string; limit?: number },
) {
  const businessId = await getObservabilityBusinessId(ownerId);
  const logs = await prisma.platformLog.findMany({
    where: {
      businessId,
      category: "trace",
      ...(filters?.service ? { service: filters.service } : {}),
      ...(filters?.traceId ? { metadata: { path: ["traceId"], equals: filters.traceId } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: filters?.limit ?? 50,
  });

  return logs.map((log) => {
    const metadata =
      log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
        ? (log.metadata as Record<string, unknown>)
        : {};
    return {
      id: log.id,
      service: log.service,
      operation: log.message,
      traceId: String(metadata.traceId ?? ""),
      spanId: String(metadata.spanId ?? ""),
      durationMs: Number(metadata.durationMs ?? 0),
      status: String(metadata.status ?? "ok"),
      createdAt: log.createdAt,
    };
  });
}

export async function getTraceSummary(ownerId: string) {
  const traces = await listTraces(ownerId, { limit: 200 });
  const traceIds = new Set(traces.map((t) => t.traceId).filter(Boolean));
  const avgDuration =
    traces.length > 0 ? traces.reduce((sum, t) => sum + t.durationMs, 0) / traces.length : 0;
  const errors = traces.filter((t) => t.status === "error").length;

  return {
    traceCount: traceIds.size,
    spanCount: traces.length,
    avgDurationMs: Math.round(avgDuration),
    errorSpans: errors,
  };
}
