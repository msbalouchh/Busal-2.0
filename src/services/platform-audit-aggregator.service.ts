import "server-only";

import { prisma } from "@/lib/prisma";
import { getObservabilityBusinessId } from "@/services/observability-platform-context.service";

export interface AuditTimelineEntry {
  id: string;
  source: string;
  action: string;
  message: string;
  createdAt: Date;
}

export async function aggregateAuditTimeline(
  ownerId: string,
  limit = 50,
): Promise<AuditTimelineEntry[]> {
  const businessId = await getObservabilityBusinessId(ownerId);

  const [platformLogs, apiLogs, tenantLogs] = await Promise.all([
    prisma.platformLog.findMany({
      where: { businessId, category: { in: ["audit", "telemetry"] } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, service: true, message: true, category: true, createdAt: true },
    }),
    prisma.platformApiRequestLog.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, method: true, path: true, statusCode: true, createdAt: true },
    }),
    prisma.tenantPlatformAuditLog.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, eventType: true, createdAt: true },
    }),
  ]);

  const entries: AuditTimelineEntry[] = [
    ...platformLogs.map((log) => ({
      id: log.id,
      source: log.service,
      action: log.category,
      message: log.message,
      createdAt: log.createdAt,
    })),
    ...apiLogs.map((log) => ({
      id: log.id,
      source: "developer-platform",
      action: "api.request",
      message: `${log.method} ${log.path} → ${log.statusCode}`,
      createdAt: log.createdAt,
    })),
    ...tenantLogs.map((log) => ({
      id: log.id,
      source: "tenant-platform",
      action: log.eventType,
      message: String(log.eventType),
      createdAt: log.createdAt,
    })),
  ];

  return entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
}

export async function writeAuditEvent(
  ownerId: string,
  input: { service: string; action: string; message: string },
) {
  const { writePlatformLog } = await import("@/services/platform-logging.service");
  return writePlatformLog(ownerId, {
    service: input.service,
    level: "INFO",
    category: "audit",
    message: input.message,
    metadata: { action: input.action },
  });
}
