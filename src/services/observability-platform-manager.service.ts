import "server-only";

import { ensureDefaultAlerts } from "@/services/platform-alert-manager.service";
import { ensureDefaultIncidents } from "@/services/platform-incident-manager.service";
import { getSystemHealth, getServiceHealth } from "@/services/platform-health-monitor.service";
import { getLogsSummary } from "@/services/platform-logging.service";
import {
  ensureDefaultObservabilityMetrics,
  getMetricsSummary,
} from "@/services/platform-metrics.service";
import {
  getPerformanceSummary,
  getUsageMetrics,
} from "@/services/platform-performance-monitor.service";
import { getAlertsSummary } from "@/services/platform-alert-manager.service";
import { getIncidentsSummary } from "@/services/platform-incident-manager.service";
import { getTraceSummary } from "@/services/platform-tracing.service";
import { aggregateAuditTimeline } from "@/services/platform-audit-aggregator.service";

export async function ensureObservabilitySeedData(ownerId: string) {
  await Promise.all([
    ensureDefaultObservabilityMetrics(ownerId),
    ensureDefaultAlerts(ownerId),
    ensureDefaultIncidents(ownerId),
  ]);
}

export async function getObservabilityDashboardOverview(ownerId: string) {
  await ensureObservabilitySeedData(ownerId);
  const [
    systemHealth,
    serviceHealth,
    metrics,
    logs,
    alerts,
    incidents,
    traces,
    usage,
    performance,
  ] = await Promise.all([
    getSystemHealth(ownerId),
    getServiceHealth(ownerId),
    getMetricsSummary(ownerId),
    getLogsSummary(ownerId),
    getAlertsSummary(ownerId),
    getIncidentsSummary(ownerId),
    getTraceSummary(ownerId),
    getUsageMetrics(ownerId),
    getPerformanceSummary(ownerId),
  ]);

  return {
    systemHealth,
    serviceHealth,
    metrics,
    logs,
    alerts,
    incidents,
    traces,
    usage,
    performance,
  };
}

export async function searchObservability(
  ownerId: string,
  query: string,
  scope?: "logs" | "metrics" | "all",
) {
  const trimmed = query.trim();
  if (!trimmed) return { logs: [], metrics: [] };

  const { listPlatformLogs } = await import("@/services/platform-logging.service");
  const { listMetrics } = await import("@/services/platform-metrics.service");

  const [logs, metrics] = await Promise.all([
    scope === "metrics"
      ? Promise.resolve([])
      : listPlatformLogs(ownerId, { search: trimmed, limit: 50 }),
    scope === "logs"
      ? Promise.resolve([])
      : listMetrics(ownerId, { limit: 50 }).then((rows) =>
          rows.filter(
            (row) =>
              row.metric.toLowerCase().includes(trimmed.toLowerCase()) ||
              row.service.toLowerCase().includes(trimmed.toLowerCase()),
          ),
        ),
  ]);

  return { logs, metrics };
}

export { aggregateAuditTimeline };
