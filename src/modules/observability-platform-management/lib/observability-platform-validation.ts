import type { PlatformAlert, PlatformIncident, PlatformLog, PlatformMetric } from "@prisma/client";

import type {
  AlertRecord,
  AuditTimelineRecord,
  IncidentRecord,
  LogRecord,
  MetricRecord,
  ObservabilitySummaryRecord,
  PerformanceSummaryRecord,
  ServiceHealthRecord,
  TraceRecord,
} from "@/modules/observability-platform-management/types/observability-platform-types";
import type { getObservabilityDashboardOverview } from "@/services/observability-platform-manager.service";
import type { AuditTimelineEntry } from "@/services/platform-audit-aggregator.service";
import type { ServiceHealthStatus } from "@/services/platform-health-monitor.service";
import type { getPerformanceSummary } from "@/services/platform-performance-monitor.service";

export function serializeMetric(metric: PlatformMetric): MetricRecord {
  return {
    id: metric.id,
    service: metric.service,
    metric: metric.metric,
    value: metric.value,
    unit: metric.unit,
    recordedAt: metric.recordedAt.toISOString(),
  };
}

export function serializeLog(log: PlatformLog & { message?: string }): LogRecord {
  return {
    id: log.id,
    level: log.level,
    service: log.service,
    category: log.category,
    message: log.message,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeIncident(incident: PlatformIncident): IncidentRecord {
  return {
    id: incident.id,
    title: incident.title,
    description: incident.description,
    severity: incident.severity,
    status: incident.status,
    assignedTo: incident.assignedTo,
    startedAt: incident.startedAt.toISOString(),
    resolvedAt: incident.resolvedAt?.toISOString() ?? null,
  };
}

export function serializeAlert(alert: PlatformAlert): AlertRecord {
  return {
    id: alert.id,
    name: alert.name,
    condition: alert.condition,
    severity: alert.severity,
    status: alert.status,
    triggeredAt: alert.triggeredAt.toISOString(),
    resolvedAt: alert.resolvedAt?.toISOString() ?? null,
  };
}

export function serializeServiceHealth(health: ServiceHealthStatus): ServiceHealthRecord {
  return {
    service: health.service,
    status: health.status,
    errorRate: health.errorRate,
    lastSeen: health.lastSeen?.toISOString() ?? null,
  };
}

export function serializeTrace(trace: {
  id: string;
  traceId: string;
  spanId: string;
  service: string;
  operation: string;
  durationMs: number;
  status: string;
  createdAt: Date;
}): TraceRecord {
  return {
    id: trace.id,
    traceId: trace.traceId,
    spanId: trace.spanId,
    service: trace.service,
    operation: trace.operation,
    durationMs: trace.durationMs,
    status: trace.status,
    createdAt: trace.createdAt.toISOString(),
  };
}

export function serializeAuditEntry(entry: AuditTimelineEntry): AuditTimelineRecord {
  return {
    id: entry.id,
    source: entry.source,
    action: entry.action,
    message: entry.message,
    createdAt: entry.createdAt.toISOString(),
  };
}

export function serializeObservabilitySummary(
  overview: Awaited<ReturnType<typeof getObservabilityDashboardOverview>>,
): ObservabilitySummaryRecord {
  return {
    overallStatus: overview.systemHealth
      .overallStatus as ObservabilitySummaryRecord["overallStatus"],
    errorRate: overview.systemHealth.errorRate,
    metrics24h: overview.metrics.total24h,
    logs24h: overview.logs.total24h,
    activeAlerts: overview.alerts.active,
    openIncidents: overview.incidents.open,
    traceCount: overview.traces.traceCount,
  };
}

export function serializePerformanceSummary(
  performance: Awaited<ReturnType<typeof getPerformanceSummary>>,
): PerformanceSummaryRecord {
  return {
    avgLatencyMs: performance.avgLatencyMs,
    totalThroughput: performance.totalThroughput,
    byService: performance.byService,
  };
}

export function validateIncidentTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Incident title is required");
  if (trimmed.length > 200) throw new Error("Incident title is too long");
  return trimmed;
}

export function validateAlertName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Alert name is required");
  if (trimmed.length > 200) throw new Error("Alert name is too long");
  return trimmed;
}
