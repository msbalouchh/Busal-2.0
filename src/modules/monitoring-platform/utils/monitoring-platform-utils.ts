import type {
  MonitoringAlert,
  MonitoringErrorLog,
  MonitoringHealthCheck,
  MonitoringMetricSnapshot,
  MonitoringPerformanceLog,
  MonitoringPlatformAuditLog,
  MonitoringRetentionPolicy,
  MonitoringStructuredLog,
} from "@prisma/client";

import type {
  AlertView,
  ErrorLogView,
  HealthCheckView,
  MetricSnapshotView,
  MonitoringAuditLogView,
  MonitoringPlatformDashboardMetrics,
  PerformanceLogView,
  RetentionPolicyView,
  StructuredLogView,
} from "@/modules/monitoring-platform/types/monitoring-platform-types";

export function serializeHealthCheck(check: MonitoringHealthCheck): HealthCheckView {
  return {
    id: check.id,
    checkKey: check.checkKey,
    name: check.name,
    targetType: check.targetType,
    serviceTarget: check.serviceTarget,
    status: check.status,
    lastCheckedAt: check.lastCheckedAt?.toISOString() ?? null,
    isActive: check.isActive,
  };
}

export function serializeMetricSnapshot(snapshot: MonitoringMetricSnapshot): MetricSnapshotView {
  return {
    id: snapshot.id,
    snapshotKey: snapshot.snapshotKey,
    cpuUsage: snapshot.cpuUsage,
    memoryUsage: snapshot.memoryUsage,
    diskUsage: snapshot.diskUsage,
    networkUsage: snapshot.networkUsage,
    databaseConnections: snapshot.databaseConnections,
    activeSessions: snapshot.activeSessions,
    queueLength: snapshot.queueLength,
    backgroundJobs: snapshot.backgroundJobs,
    capturedAt: snapshot.capturedAt.toISOString(),
  };
}

export function serializePerformanceLog(log: MonitoringPerformanceLog): PerformanceLogView {
  return {
    id: log.id,
    category: log.category,
    operationKey: log.operationKey,
    durationMs: log.durationMs,
    isSlow: log.isSlow,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeErrorLog(log: MonitoringErrorLog): ErrorLogView {
  return {
    id: log.id,
    errorType: log.errorType,
    message: log.message,
    correlationId: log.correlationId,
    requestId: log.requestId,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeStructuredLog(log: MonitoringStructuredLog): StructuredLogView {
  return {
    id: log.id,
    level: log.level,
    message: log.message,
    source: log.source,
    correlationId: log.correlationId,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeAlert(alert: MonitoringAlert): AlertView {
  return {
    id: alert.id,
    alertType: alert.alertType,
    title: alert.title,
    message: alert.message,
    status: alert.status,
    channels: alert.channels as AlertView["channels"],
    triggeredAt: alert.triggeredAt.toISOString(),
  };
}

export function serializeRetentionPolicy(policy: MonitoringRetentionPolicy): RetentionPolicyView {
  return {
    id: policy.id,
    name: policy.name,
    logRetentionDays: policy.logRetentionDays,
    metricsRetentionDays: policy.metricsRetentionDays,
    alertHistoryDays: policy.alertHistoryDays,
    archiveEnabled: policy.archiveEnabled,
  };
}

export function serializeMonitoringAuditLog(
  log: MonitoringPlatformAuditLog,
): MonitoringAuditLogView {
  return {
    id: log.id,
    eventType: log.eventType,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeMonitoringPlatformDashboard(
  metrics: MonitoringPlatformDashboardMetrics,
): MonitoringPlatformDashboardMetrics {
  return metrics;
}

export type MonitoringPlatformDashboardView = MonitoringPlatformDashboardMetrics;
