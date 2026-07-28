import "server-only";

import type { MonitoringAuditEventType, MonitoringLogLevel, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  evaluatePermission,
  toPermissionEvaluationContext,
} from "@/modules/iam/engine/permission-engine";
import {
  buildAlertDeliveryPayload,
  resolveAlertChannels,
} from "@/modules/monitoring-platform/engine/alert-engine";
import {
  buildHealthEndpointResponse,
  evaluateHealthStatus,
} from "@/modules/monitoring-platform/engine/health-engine";
import { normalizeMetricSnapshot } from "@/modules/monitoring-platform/engine/metrics-engine";
import { isSlowRequest } from "@/modules/monitoring-platform/engine/performance-engine";
import { resolveRetentionCutoff } from "@/modules/monitoring-platform/engine/logging-engine";
import {
  DEFAULT_ALERT_HISTORY_DAYS,
  DEFAULT_LOG_RETENTION_DAYS,
  DEFAULT_METRICS_RETENTION_DAYS,
} from "@/modules/monitoring-platform/constants/routes";
import { ensureBootstrapMonitoringPlatform } from "@/modules/monitoring-platform/plugins/bootstrap-monitoring-platform";
import {
  listHealthCheckDefinitions,
  registerHealthCheckDefinition,
} from "@/modules/monitoring-platform/registry/health-check-registry";
import type {
  ErrorLogInput,
  HealthEndpointResult,
  MetricSnapshotInput,
  MonitoringPlatformDashboardMetrics,
  PerformanceLogInput,
  RegisteredHealthCheckDefinition,
  RetentionPolicyInput,
  StructuredLogInput,
  TriggerAlertInput,
} from "@/modules/monitoring-platform/types/monitoring-platform-types";

function assertPermission(platform: BusinessContext, permission: string): void {
  const context = toPermissionEvaluationContext({
    permissions: platform.permissions,
    roleSlug: platform.roleSlug ?? null,
    isOwner: platform.isOwner,
    businessId: platform.business.id,
    branchId: platform.branchId,
  });

  if (!evaluatePermission(context, permission)) {
    throw new Error(`Permission denied: ${permission} required`);
  }
}

async function logMonitoringAudit(input: {
  businessId?: string | null;
  userId?: string | null;
  eventType: MonitoringAuditEventType;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.monitoringPlatformAuditLog.create({
    data: {
      businessId: input.businessId ?? null,
      userId: input.userId ?? null,
      eventType: input.eventType,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

async function syncHealthCheckToDatabase(
  businessId: string,
  definition: RegisteredHealthCheckDefinition,
): Promise<void> {
  await prisma.monitoringHealthCheck.upsert({
    where: {
      businessId_checkKey: {
        businessId,
        checkKey: definition.checkKey,
      },
    },
    create: {
      businessId,
      checkKey: definition.checkKey,
      name: definition.name,
      targetType: definition.targetType,
      serviceTarget: definition.serviceTarget,
      status: "HEALTHY",
      metadata: definition.metadata ? (definition.metadata as Prisma.InputJsonValue) : undefined,
      isActive: definition.isActive,
      lastCheckedAt: new Date(),
    },
    update: {
      name: definition.name,
      targetType: definition.targetType,
      serviceTarget: definition.serviceTarget,
      isActive: definition.isActive,
    },
  });
}

export async function ensureMonitoringPlatformDefaults(businessId: string): Promise<void> {
  ensureBootstrapMonitoringPlatform();

  for (const definition of listHealthCheckDefinitions()) {
    await syncHealthCheckToDatabase(businessId, definition);
  }

  const existingPolicy = await prisma.monitoringRetentionPolicy.findFirst({
    where: { businessId, name: "Default Retention" },
  });

  if (!existingPolicy) {
    await prisma.monitoringRetentionPolicy.create({
      data: {
        businessId,
        name: "Default Retention",
        logRetentionDays: DEFAULT_LOG_RETENTION_DAYS,
        metricsRetentionDays: DEFAULT_METRICS_RETENTION_DAYS,
        alertHistoryDays: DEFAULT_ALERT_HISTORY_DAYS,
      },
    });
  }
}

export async function registerModuleHealthCheck(
  businessId: string,
  definition: RegisteredHealthCheckDefinition,
): Promise<void> {
  ensureBootstrapMonitoringPlatform();
  registerHealthCheckDefinition(definition);
  await syncHealthCheckToDatabase(businessId, definition);

  await logMonitoringAudit({
    businessId,
    eventType: "CHECK_REGISTERED",
    metadata: { checkKey: definition.checkKey, targetType: definition.targetType },
  });
}

export async function runHealthChecks(businessId: string): Promise<HealthEndpointResult> {
  ensureBootstrapMonitoringPlatform();

  const checks = await prisma.monitoringHealthCheck.findMany({
    where: { businessId, isActive: true },
  });

  const results = [];

  for (const check of checks) {
    const status = evaluateHealthStatus({
      targetType: check.targetType,
      lastError: false,
      latencyMs: 100,
    });

    await prisma.monitoringHealthCheck.update({
      where: { id: check.id },
      data: { status, lastCheckedAt: new Date() },
    });

    results.push({
      checkKey: check.checkKey,
      name: check.name,
      targetType: check.targetType,
      status,
    });
  }

  const response = buildHealthEndpointResponse(results);

  await logMonitoringAudit({
    businessId,
    eventType: "HEALTH_CHECK",
    metadata: { status: response.status, checkCount: results.length },
  });

  return response;
}

export async function recordMetricSnapshot(
  platform: BusinessContext,
  input: MetricSnapshotInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.MONITORING_PLATFORM_MANAGE);

  const normalized = normalizeMetricSnapshot(input);

  const snapshot = await prisma.monitoringMetricSnapshot.create({
    data: {
      businessId: platform.business.id,
      snapshotKey: normalized.snapshotKey,
      cpuUsage: normalized.cpuUsage,
      memoryUsage: normalized.memoryUsage,
      diskUsage: normalized.diskUsage,
      networkUsage: normalized.networkUsage,
      databaseConnections: normalized.databaseConnections,
      activeSessions: normalized.activeSessions,
      queueLength: normalized.queueLength,
      backgroundJobs: normalized.backgroundJobs,
      cacheHitRate: normalized.cacheHitRate,
      storageUsageBytes: normalized.storageUsageBytes,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });

  return { id: snapshot.id };
}

export async function recordPerformanceLog(
  platform: BusinessContext,
  input: PerformanceLogInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.MONITORING_PLATFORM_MANAGE);

  const log = await prisma.monitoringPerformanceLog.create({
    data: {
      businessId: platform.business.id,
      category: input.category,
      operationKey: input.operationKey,
      durationMs: input.durationMs,
      isSlow: isSlowRequest(input.durationMs),
      correlationId: input.correlationId ?? null,
      requestId: input.requestId ?? null,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });

  return { id: log.id };
}

export async function recordErrorLog(
  platform: BusinessContext,
  input: ErrorLogInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.MONITORING_PLATFORM_MANAGE);

  const log = await prisma.monitoringErrorLog.create({
    data: {
      businessId: platform.business.id,
      userId: platform.user.id,
      branchId: input.branchId ?? platform.branchId,
      errorType: input.errorType,
      message: input.message,
      stackTrace: input.stackTrace ?? null,
      correlationId: input.correlationId ?? null,
      requestId: input.requestId ?? null,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });

  return { id: log.id };
}

export async function recordStructuredLog(
  platform: BusinessContext,
  input: StructuredLogInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.MONITORING_PLATFORM_MANAGE);

  const log = await prisma.monitoringStructuredLog.create({
    data: {
      businessId: platform.business.id,
      userId: platform.user.id,
      level: input.level,
      message: input.message,
      source: input.source,
      correlationId: input.correlationId ?? null,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });

  return { id: log.id };
}

export async function triggerMonitoringAlert(
  platform: BusinessContext,
  input: TriggerAlertInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.MONITORING_PLATFORM_MANAGE);

  const channels = resolveAlertChannels(input.channels);

  const alert = await prisma.monitoringAlert.create({
    data: {
      businessId: platform.business.id,
      alertType: input.alertType,
      title: input.title,
      message: input.message,
      channels: channels as unknown as Prisma.InputJsonValue,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });

  await logMonitoringAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "ALERT_TRIGGERED",
    metadata: buildAlertDeliveryPayload({
      alertType: input.alertType,
      title: input.title,
      message: input.message,
      businessId: platform.business.id,
    }),
  });

  return { id: alert.id };
}

export async function acknowledgeMonitoringAlert(
  platform: BusinessContext,
  alertId: string,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.MONITORING_PLATFORM_MANAGE);

  await prisma.monitoringAlert.update({
    where: { id: alertId },
    data: { status: "ACKNOWLEDGED", acknowledgedAt: new Date() },
  });

  await logMonitoringAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "ALERT_ACKNOWLEDGED",
    metadata: { alertId },
  });
}

export async function resolveMonitoringAlert(
  platform: BusinessContext,
  alertId: string,
): Promise<void> {
  assertPermission(platform, PERMISSION_CODES.MONITORING_PLATFORM_MANAGE);

  await prisma.monitoringAlert.update({
    where: { id: alertId },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });

  await logMonitoringAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "ALERT_RESOLVED",
    metadata: { alertId },
  });
}

export async function upsertRetentionPolicy(
  platform: BusinessContext,
  input: RetentionPolicyInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.MONITORING_PLATFORM_MANAGE);

  const policy = await prisma.monitoringRetentionPolicy.upsert({
    where: {
      businessId_name: {
        businessId: platform.business.id,
        name: input.name,
      },
    },
    create: {
      businessId: platform.business.id,
      name: input.name,
      logRetentionDays: input.logRetentionDays ?? DEFAULT_LOG_RETENTION_DAYS,
      metricsRetentionDays: input.metricsRetentionDays ?? DEFAULT_METRICS_RETENTION_DAYS,
      alertHistoryDays: input.alertHistoryDays ?? DEFAULT_ALERT_HISTORY_DAYS,
      archiveEnabled: input.archiveEnabled ?? false,
    },
    update: {
      logRetentionDays: input.logRetentionDays,
      metricsRetentionDays: input.metricsRetentionDays,
      alertHistoryDays: input.alertHistoryDays,
      archiveEnabled: input.archiveEnabled,
    },
  });

  await logMonitoringAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "CONFIG_CHANGED",
    metadata: { policyId: policy.id, name: input.name },
  });

  return { id: policy.id };
}

export async function applyRetentionPolicies(businessId: string): Promise<{ archived: number }> {
  const policy = await prisma.monitoringRetentionPolicy.findFirst({
    where: { businessId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (!policy) {
    return { archived: 0 };
  }

  const logCutoff = resolveRetentionCutoff(policy.logRetentionDays);
  const metricsCutoff = resolveRetentionCutoff(policy.metricsRetentionDays);
  const alertCutoff = resolveRetentionCutoff(policy.alertHistoryDays);

  const [deletedLogs, deletedMetrics, deletedAlerts] = await Promise.all([
    prisma.monitoringStructuredLog.deleteMany({
      where: { businessId, createdAt: { lt: logCutoff } },
    }),
    prisma.monitoringMetricSnapshot.deleteMany({
      where: { businessId, capturedAt: { lt: metricsCutoff } },
    }),
    prisma.monitoringAlert.deleteMany({
      where: { businessId, status: "RESOLVED", resolvedAt: { lt: alertCutoff } },
    }),
  ]);

  const archived = deletedLogs.count + deletedMetrics.count + deletedAlerts.count;

  if (archived > 0) {
    await logMonitoringAudit({
      businessId,
      eventType: "RETENTION_APPLIED",
      metadata: { archived, policyId: policy.id },
    });
  }

  return { archived };
}

export async function logDashboardAccess(
  platform: BusinessContext,
  dashboard: string,
): Promise<void> {
  await logMonitoringAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "DASHBOARD_ACCESS",
    metadata: { dashboard },
  });
}

export async function getMonitoringPlatformDashboard(
  businessId: string,
): Promise<MonitoringPlatformDashboardMetrics> {
  ensureBootstrapMonitoringPlatform();

  const [checks, alerts, errors, logs, performance] = await Promise.all([
    prisma.monitoringHealthCheck.findMany({ where: { businessId } }),
    prisma.monitoringAlert.findMany({ where: { businessId, status: "OPEN" } }),
    prisma.monitoringErrorLog.findMany({
      where: { businessId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.monitoringStructuredLog.findMany({
      where: { businessId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.monitoringPerformanceLog.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);

  const durations = performance.map((log) => log.durationMs);

  return {
    totalHealthChecks: checks.length,
    healthyChecks: checks.filter((check) => check.status === "HEALTHY").length,
    degradedChecks: checks.filter((check) => check.status === "DEGRADED").length,
    unhealthyChecks: checks.filter((check) => check.status === "UNHEALTHY").length,
    activeAlerts: alerts.length,
    recentErrors: errors.length,
    recentLogs: logs.length,
    avgResponseTimeMs:
      durations.length === 0
        ? 0
        : Math.round(durations.reduce((sum, ms) => sum + ms, 0) / durations.length),
    slowRequests: performance.filter((log) => log.isSlow).length,
    registeredChecks: listHealthCheckDefinitions().length,
    openAlertCount: alerts.length,
  };
}

export async function listMonitoringHealthChecks(businessId: string) {
  return prisma.monitoringHealthCheck.findMany({
    where: { businessId },
    orderBy: { checkKey: "asc" },
  });
}

export async function listMonitoringMetricSnapshots(businessId: string) {
  return prisma.monitoringMetricSnapshot.findMany({
    where: { businessId },
    orderBy: { capturedAt: "desc" },
    take: 100,
  });
}

export async function listMonitoringPerformanceLogs(businessId: string) {
  return prisma.monitoringPerformanceLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listMonitoringErrorLogs(businessId: string) {
  return prisma.monitoringErrorLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listMonitoringStructuredLogs(businessId: string) {
  return prisma.monitoringStructuredLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listMonitoringAlerts(businessId: string) {
  return prisma.monitoringAlert.findMany({
    where: { businessId },
    orderBy: { triggeredAt: "desc" },
    take: 100,
  });
}

export async function listMonitoringRetentionPolicies(businessId: string) {
  return prisma.monitoringRetentionPolicy.findMany({ where: { businessId } });
}

export async function listMonitoringPlatformAuditLogs(businessId: string) {
  return prisma.monitoringPlatformAuditLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listRegisteredHealthChecks() {
  ensureBootstrapMonitoringPlatform();
  return listHealthCheckDefinitions();
}

export async function searchStructuredLogs(
  businessId: string,
  input: { query?: string; level?: MonitoringLogLevel; correlationId?: string },
) {
  const logs = await prisma.monitoringStructuredLog.findMany({
    where: {
      businessId,
      ...(input.level ? { level: input.level } : {}),
      ...(input.correlationId ? { correlationId: input.correlationId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  if (!input.query) {
    return logs;
  }

  const query = input.query.toLowerCase();
  return logs.filter(
    (log) => log.message.toLowerCase().includes(query) || log.source.toLowerCase().includes(query),
  );
}
