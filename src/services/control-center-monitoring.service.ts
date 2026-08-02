import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import { buildMonitoringSnapshot } from "@/modules/api-gateway/engine/monitoring-engine";
import { aggregateMetrics } from "@/modules/monitoring-platform/engine/metrics-engine";
import { buildPerformanceTrend } from "@/modules/monitoring-platform/engine/performance-engine";
import {
  matchesLogLevelFilter,
  matchesLogSearch,
} from "@/modules/monitoring-platform/engine/logging-engine";
import { ensureBootstrapMonitoringPlatform } from "@/modules/monitoring-platform/plugins/bootstrap-monitoring-platform";
import { listHealthCheckDefinitions } from "@/modules/monitoring-platform/registry/health-check-registry";
import {
  serializeAlert,
  serializeStructuredLog,
} from "@/modules/monitoring-platform/utils/monitoring-platform-utils";
import {
  CONTROL_CENTER_MONITORING_PAGE_SIZE,
  PLATFORM_SERVICE_TARGETS,
} from "@/modules/control-center/monitoring/constants/control-center-monitoring";
import type {
  ControlCenterAiMonitoringMetrics,
  ControlCenterAlertDirectoryResult,
  ControlCenterAlertItem,
  ControlCenterAlertQuery,
  ControlCenterApiMonitoringMetrics,
  ControlCenterIncidentDirectoryResult,
  ControlCenterIncidentItem,
  ControlCenterIncidentQuery,
  ControlCenterInfrastructureMetrics,
  ControlCenterLogDirectoryResult,
  ControlCenterLogItem,
  ControlCenterLogQuery,
  ControlCenterMonitoringDashboardWidgets,
  ControlCenterMonitoringManagementBundle,
  ControlCenterMonitoringPermissions,
  ControlCenterServiceMonitorItem,
} from "@/modules/control-center/monitoring/types/control-center-monitoring-types";
import type { ControlCenterOperatorContext } from "@/modules/control-center/types/control-center-types";
import { ensureMonitoringPlatformDefaults } from "@/services/monitoring-platform.service";

function buildPermissions(
  operator: ControlCenterOperatorContext,
): ControlCenterMonitoringPermissions {
  const permissions = new Set(operator.permissions);
  const hasAdmin = permissions.has(PERMISSION_CODES.CONTROL_CENTER_ADMIN);
  const hasMonitoring =
    hasAdmin || hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_MONITORING);

  return {
    canViewMonitoring: hasMonitoring,
    canViewLogs:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_MONITORING_LOGS) ||
      hasMonitoring,
    canManageAlerts:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_MONITORING_ALERTS) ||
      hasMonitoring,
    canViewIncidents:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_MONITORING_INCIDENTS) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_INCIDENTS) ||
      hasMonitoring,
    canViewInfrastructure:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_MONITORING_INFRASTRUCTURE) ||
      hasMonitoring,
    canViewAiMonitoring:
      hasAdmin ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_MONITORING_AI) ||
      hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_AI) ||
      hasMonitoring,
  };
}

async function resolvePlatformBusinessId(): Promise<string | null> {
  const business = await prisma.business.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  return business?.id ?? null;
}

async function ensurePlatformMonitoringDefaults(): Promise<void> {
  ensureBootstrapMonitoringPlatform();
  const businessId = await resolvePlatformBusinessId();

  if (businessId) {
    await ensureMonitoringPlatformDefaults(businessId);
  }
}

function parseIncidentMetadata(metadata: Prisma.JsonValue | null): {
  rootCause: string | null;
  resolutionStatus: string;
  assignedStaff: string | null;
  resolvedAt: string | null;
  timeline: Array<{ at: string; event: string }>;
} {
  const record =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : {};

  const timeline = Array.isArray(record.timeline)
    ? record.timeline
        .filter(
          (entry): entry is { at: string; event: string } =>
            typeof entry === "object" &&
            entry != null &&
            typeof (entry as { at?: unknown }).at === "string" &&
            typeof (entry as { event?: unknown }).event === "string",
        )
        .map((entry) => ({ at: entry.at, event: entry.event }))
    : [];

  return {
    rootCause: typeof record.rootCause === "string" ? record.rootCause : null,
    resolutionStatus:
      typeof record.resolutionStatus === "string" ? record.resolutionStatus : "OPEN",
    assignedStaff: typeof record.assignedStaff === "string" ? record.assignedStaff : null,
    resolvedAt: typeof record.resolvedAt === "string" ? record.resolvedAt : null,
    timeline,
  };
}

async function buildDashboardWidgets(): Promise<ControlCenterMonitoringDashboardWidgets> {
  await ensurePlatformMonitoringDefaults();

  const [healthChecks, openAlerts, openIncidents, tenantRecords, metricSnapshots, performanceLogs] =
    await Promise.all([
      prisma.monitoringHealthCheck.findMany({ where: { isActive: true } }),
      prisma.monitoringAlert.count({ where: { status: "OPEN" } }),
      prisma.monitoringErrorLog.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.tenantRecord.findMany({ select: { healthStatus: true } }),
      prisma.monitoringMetricSnapshot.findMany({
        orderBy: { capturedAt: "desc" },
        take: 20,
      }),
      prisma.monitoringPerformanceLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
    ]);

  const healthyChecks = healthChecks.filter((check) => check.status === "HEALTHY").length;
  const activeServices = healthChecks.length;
  const serviceAvailabilityPct =
    activeServices === 0 ? 100 : Math.round((healthyChecks / activeServices) * 1000) / 10;

  const healthyTenants = tenantRecords.filter((tenant) => tenant.healthStatus === "HEALTHY").length;
  const tenantHealthScore = tenantRecords.length > 0 ? healthyTenants / tenantRecords.length : 1;
  const checkHealthScore = activeServices > 0 ? healthyChecks / activeServices : 1;
  const overallHealthScore = Math.round(((tenantHealthScore + checkHealthScore) / 2) * 100);

  const aggregated = aggregateMetrics(metricSnapshots);
  const degradedChecks = healthChecks.filter((check) => check.status === "DEGRADED").length;
  const unhealthyChecks = healthChecks.filter((check) => check.status === "UNHEALTHY").length;

  let platformStatus: ControlCenterMonitoringDashboardWidgets["platformStatus"] = "OPERATIONAL";
  if (unhealthyChecks > 0 || openAlerts > 5) {
    platformStatus = "OUTAGE";
  } else if (degradedChecks > 0 || openAlerts > 0) {
    platformStatus = "DEGRADED";
  }

  const errorCount = performanceLogs.filter((log) => log.isSlow).length;
  const errorRate = performanceLogs.length > 0 ? (errorCount / performanceLogs.length) * 100 : 0;
  const uptimePct = Math.max(99.5, 100 - errorRate / 10);

  return {
    platformStatus,
    overallHealthScore,
    activeServices,
    serviceAvailabilityPct,
    uptimePct: Math.round(uptimePct * 10) / 10,
    currentIncidents: openIncidents,
    activeAlerts: openAlerts,
    systemLoadPct: Math.round(aggregated.avgCpuUsage * 10) / 10,
  };
}

async function buildServiceMonitoring(): Promise<ControlCenterServiceMonitorItem[]> {
  await ensurePlatformMonitoringDefaults();

  const [healthChecks, performanceByKey] = await Promise.all([
    prisma.monitoringHealthCheck.findMany({ where: { isActive: true } }),
    prisma.monitoringPerformanceLog.groupBy({
      by: ["operationKey"],
      _avg: { durationMs: true },
      _count: { id: true },
    }),
  ]);

  const checkMap = new Map(healthChecks.map((check) => [check.checkKey, check]));
  const perfMap = new Map(
    performanceByKey.map((entry) => [
      entry.operationKey,
      {
        latencyMs: Math.round(entry._avg.durationMs ?? 0),
        throughput: entry._count.id,
      },
    ]),
  );

  const registry = listHealthCheckDefinitions();

  return PLATFORM_SERVICE_TARGETS.map((service) => {
    const check =
      checkMap.get(service.checkKey) ??
      healthChecks.find((entry) => entry.serviceTarget.includes(service.key));
    const perf = perfMap.get(service.key) ?? perfMap.get(service.checkKey);
    const registryEntry = registry.find((entry) => entry.checkKey === service.checkKey);

    const slowLogs = performanceByKey.find((entry) => entry.operationKey.includes(service.key));
    const throughput = perf?.throughput ?? slowLogs?._count.id ?? 0;
    const latencyMs = perf?.latencyMs ?? 100;
    const errorRatePct =
      throughput > 0 && slowLogs
        ? Math.round(((slowLogs._count.id * 0.05) / throughput) * 1000) / 10
        : 0;

    return {
      key: service.key,
      name: service.name,
      status: check?.status ?? (registryEntry?.isActive ? "HEALTHY" : "UNKNOWN"),
      latencyMs,
      errorRatePct,
      throughput,
    };
  });
}

async function buildInfrastructureMetrics(): Promise<ControlCenterInfrastructureMetrics> {
  const [latestSnapshot, workerCheck] = await Promise.all([
    prisma.monitoringMetricSnapshot.findFirst({ orderBy: { capturedAt: "desc" } }),
    prisma.monitoringHealthCheck.findFirst({
      where: { checkKey: "worker.background" },
    }),
  ]);

  if (!latestSnapshot) {
    return {
      cpuUsagePct: 0,
      memoryUsagePct: 0,
      diskUsagePct: 0,
      networkUsagePct: 0,
      queueLength: 0,
      workerCount: 0,
      workerStatus: workerCheck?.status ?? "UNKNOWN",
      capturedAt: null,
    };
  }

  return {
    cpuUsagePct: Math.round(latestSnapshot.cpuUsage * 10) / 10,
    memoryUsagePct: Math.round(latestSnapshot.memoryUsage * 10) / 10,
    diskUsagePct: Math.round(latestSnapshot.diskUsage * 10) / 10,
    networkUsagePct: Math.round(latestSnapshot.networkUsage * 10) / 10,
    queueLength: latestSnapshot.queueLength,
    workerCount: latestSnapshot.backgroundJobs,
    workerStatus: workerCheck?.status ?? "UNKNOWN",
    capturedAt: latestSnapshot.capturedAt.toISOString(),
  };
}

async function buildApiMonitoringMetrics(): Promise<ControlCenterApiMonitoringMetrics> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [apiLogs, slowLogs] = await Promise.all([
    prisma.apiRequestLog.findMany({
      where: { createdAt: { gte: dayAgo } },
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: {
        method: true,
        path: true,
        statusCode: true,
        responseTimeMs: true,
        createdAt: true,
      },
    }),
    prisma.monitoringPerformanceLog.findMany({
      where: { category: "API", isSlow: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { operationKey: true, durationMs: true },
    }),
  ]);

  const snapshot = buildMonitoringSnapshot(
    apiLogs.map((log) => ({
      id: "",
      method: log.method,
      path: log.path,
      statusCode: log.statusCode,
      responseTimeMs: log.responseTimeMs,
      clientType: null,
      createdAt: log.createdAt.toISOString(),
    })),
  );

  const endpointLatency = new Map<string, { totalMs: number; count: number }>();
  for (const log of apiLogs) {
    const endpoint = `${log.method} ${log.path}`;
    const current = endpointLatency.get(endpoint) ?? { totalMs: 0, count: 0 };
    endpointLatency.set(endpoint, {
      totalMs: current.totalMs + log.responseTimeMs,
      count: current.count + 1,
    });
  }

  const slowEndpoints = [...endpointLatency.entries()]
    .map(([endpoint, stats]) => ({
      endpoint,
      avgMs: Math.round(stats.totalMs / stats.count),
      count: stats.count,
    }))
    .sort((left, right) => right.avgMs - left.avgMs)
    .slice(0, 5);

  const topEndpoints = Object.entries(snapshot.byEndpoint)
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);

  const hourBuckets = new Map<string, { requests: number; errors: number }>();
  for (const log of apiLogs) {
    const hour = `${log.createdAt.getHours().toString().padStart(2, "0")}:00`;
    const bucket = hourBuckets.get(hour) ?? { requests: 0, errors: 0 };
    bucket.requests += 1;
    if (log.statusCode >= 400) {
      bucket.errors += 1;
    }
    hourBuckets.set(hour, bucket);
  }

  return {
    requestVolume: snapshot.totalRequests,
    avgResponseTimeMs: snapshot.avgResponseTimeMs,
    errorRatePct: Math.round(snapshot.errorRate * 10) / 10,
    successRatePct: Math.round(snapshot.successRate * 10) / 10,
    slowEndpoints:
      slowEndpoints.length > 0
        ? slowEndpoints
        : slowLogs.map((log) => ({
            endpoint: log.operationKey,
            avgMs: log.durationMs,
            count: 1,
          })),
    topEndpoints,
    usageTrends: [...hourBuckets.entries()].map(([hour, stats]) => ({
      hour,
      requests: stats.requests,
      errors: stats.errors,
    })),
  };
}

async function buildAiMonitoringMetrics(): Promise<ControlCenterAiMonitoringMetrics> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [aiToolTokens, aiAgentTokens, automationTokens, aiPerformance, aiErrors, latestSnapshot] =
    await Promise.all([
      prisma.aiToolExecution.aggregate({ _sum: { tokensUsed: true } }),
      prisma.aiAgentExecution.aggregate({ _sum: { tokensUsed: true } }),
      prisma.automationWorkflowExecution.aggregate({ _sum: { aiCostTokens: true } }),
      prisma.monitoringPerformanceLog.findMany({
        where: { category: "AI", createdAt: { gte: weekAgo } },
        select: { durationMs: true, operationKey: true, createdAt: true },
      }),
      prisma.monitoringErrorLog.count({
        where: { errorType: "AI_FAILURE", createdAt: { gte: weekAgo } },
      }),
      prisma.monitoringMetricSnapshot.findFirst({ orderBy: { capturedAt: "desc" } }),
    ]);

  const tokenUsage =
    (aiToolTokens._sum.tokensUsed ?? 0) +
    (aiAgentTokens._sum.tokensUsed ?? 0) +
    (automationTokens._sum.aiCostTokens ?? 0);

  const durations = aiPerformance.map((log) => log.durationMs);
  const trend = buildPerformanceTrend(durations);

  const modelMap = new Map<string, { totalMs: number; count: number }>();
  for (const log of aiPerformance) {
    const model = log.operationKey || "default";
    const current = modelMap.get(model) ?? { totalMs: 0, count: 0 };
    modelMap.set(model, {
      totalMs: current.totalMs + log.durationMs,
      count: current.count + 1,
    });
  }

  const dayMap = new Map<string, number>();
  for (const log of aiPerformance) {
    const day = log.createdAt.toISOString().slice(0, 10);
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }

  return {
    tokenUsage,
    avgResponseTimeMs: trend.avgMs,
    errorCount: aiErrors,
    queueLength: latestSnapshot?.queueLength ?? 0,
    costTrendCents: Math.round(tokenUsage * 0.002),
    modelPerformance: [...modelMap.entries()]
      .map(([model, stats]) => ({
        model,
        avgMs: Math.round(stats.totalMs / stats.count),
        executions: stats.count,
      }))
      .slice(0, 5),
    usageTrends: [...dayMap.entries()].map(([day, tokens]) => ({ day, tokens })),
  };
}

export async function queryControlCenterAlerts(
  query: ControlCenterAlertQuery = {},
): Promise<ControlCenterAlertDirectoryResult> {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? CONTROL_CENTER_MONITORING_PAGE_SIZE;

  const where: Prisma.MonitoringAlertWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.alertType) {
    where.alertType = query.alertType;
  }

  const [alerts, total, ruleGroups] = await Promise.all([
    prisma.monitoringAlert.findMany({
      where,
      orderBy: { triggeredAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { business: { select: { businessName: true } } },
    }),
    prisma.monitoringAlert.count({ where }),
    prisma.monitoringAlert.groupBy({
      by: ["alertType"],
      _count: { id: true },
    }),
  ]);

  const items: ControlCenterAlertItem[] = alerts.map((alert) => {
    const serialized = serializeAlert(alert);
    const metadata =
      alert.metadata && typeof alert.metadata === "object" && !Array.isArray(alert.metadata)
        ? (alert.metadata as Record<string, unknown>)
        : {};

    return {
      id: alert.id,
      alertType: alert.alertType,
      title: serialized.title,
      message: alert.message,
      status: alert.status,
      severity: alert.alertType.replace(/_/g, " "),
      businessId: alert.businessId,
      businessName: alert.business?.businessName ?? null,
      triggeredAt: serialized.triggeredAt,
      acknowledgedAt: alert.acknowledgedAt?.toISOString() ?? null,
      resolvedAt: alert.resolvedAt?.toISOString() ?? null,
      escalated: metadata.escalated === true,
    };
  });

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
    rules: ruleGroups.map((group) => ({
      alertType: group.alertType,
      count: group._count.id,
    })),
  };
}

export async function queryControlCenterLogs(
  query: ControlCenterLogQuery = {},
): Promise<ControlCenterLogDirectoryResult> {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? CONTROL_CENTER_MONITORING_PAGE_SIZE;

  const where: Prisma.MonitoringStructuredLogWhereInput = {};

  if (query.level) {
    where.level = query.level;
  }

  if (query.source) {
    where.source = { contains: query.source, mode: "insensitive" };
  }

  if (query.businessId) {
    where.businessId = query.businessId;
  }

  if (query.from || query.to) {
    where.createdAt = {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      ...(query.to ? { lte: new Date(query.to) } : {}),
    };
  }

  const logs = await prisma.monitoringStructuredLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { business: { select: { businessName: true } } },
  });

  let filtered = logs.filter((log) => matchesLogLevelFilter(log.level, query.level ?? undefined));

  if (query.search?.trim()) {
    filtered = filtered.filter((log) =>
      matchesLogSearch(query.search!.trim(), log.message, log.source),
    );
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  const items: ControlCenterLogItem[] = paged.map((log) => {
    const serialized = serializeStructuredLog(log);
    return {
      id: log.id,
      level: log.level,
      message: serialized.message,
      source: serialized.source,
      businessId: log.businessId,
      businessName: log.business?.businessName ?? null,
      correlationId: serialized.correlationId,
      createdAt: serialized.createdAt,
    };
  });

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

export async function queryControlCenterIncidents(
  query: ControlCenterIncidentQuery = {},
): Promise<ControlCenterIncidentDirectoryResult> {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = query.pageSize ?? CONTROL_CENTER_MONITORING_PAGE_SIZE;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const errors = await prisma.monitoringErrorLog.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { business: { select: { businessName: true } } },
  });

  let items: ControlCenterIncidentItem[] = errors.map((error) => {
    const meta = parseIncidentMetadata(error.metadata);

    return {
      id: error.id,
      title: error.message.slice(0, 120),
      severity: error.errorType,
      status: meta.resolutionStatus === "RESOLVED" ? "RESOLVED" : "OPEN",
      rootCause: meta.rootCause,
      resolutionStatus: meta.resolutionStatus,
      assignedStaff: meta.assignedStaff,
      businessId: error.businessId,
      businessName: error.business?.businessName ?? null,
      createdAt: error.createdAt.toISOString(),
      resolvedAt: meta.resolvedAt,
      timeline: meta.timeline.length
        ? meta.timeline
        : [{ at: error.createdAt.toISOString(), event: "Incident detected" }],
    };
  });

  if (query.active === true) {
    items = items.filter((item) => item.status !== "RESOLVED");
  } else if (query.active === false) {
    items = items.filter((item) => item.status === "RESOLVED");
  }

  const total = items.length;
  const start = (page - 1) * pageSize;
  const pagedItems = items.slice(start, start + pageSize);

  return {
    items: pagedItems,
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

export async function exportControlCenterLogs(query: ControlCenterLogQuery = {}): Promise<string> {
  const directory = await queryControlCenterLogs({ ...query, page: 1, pageSize: 500 });

  const header = "timestamp,level,source,business,message,correlationId";
  const rows = directory.items.map((log) =>
    [
      log.createdAt,
      log.level,
      log.source,
      log.businessName ?? "",
      `"${log.message.replace(/"/g, '""')}"`,
      log.correlationId ?? "",
    ].join(","),
  );

  return [header, ...rows].join("\n");
}

export async function getControlCenterMonitoringManagementBundle(
  operator: ControlCenterOperatorContext,
  logQuery: ControlCenterLogQuery = {},
  alertQuery: ControlCenterAlertQuery = {},
  incidentQuery: ControlCenterIncidentQuery = {},
): Promise<ControlCenterMonitoringManagementBundle> {
  const permissions = buildPermissions(operator);

  const [widgets, services, infrastructure, apiMonitoring, aiMonitoring, alerts, logs, incidents] =
    await Promise.all([
      buildDashboardWidgets(),
      buildServiceMonitoring(),
      buildInfrastructureMetrics(),
      buildApiMonitoringMetrics(),
      buildAiMonitoringMetrics(),
      queryControlCenterAlerts(alertQuery),
      queryControlCenterLogs(logQuery),
      queryControlCenterIncidents(incidentQuery),
    ]);

  return {
    widgets,
    permissions,
    services,
    infrastructure,
    apiMonitoring,
    aiMonitoring,
    alerts,
    logs,
    incidents,
    refreshedAt: new Date().toISOString(),
  };
}

async function logControlCenterMonitoringAudit(
  eventType: "ALERT_ACKNOWLEDGED" | "ALERT_RESOLVED" | "CONFIG_CHANGED",
  metadata: Record<string, unknown>,
  operator: ControlCenterOperatorContext,
): Promise<void> {
  const businessId = await resolvePlatformBusinessId();

  await prisma.monitoringPlatformAuditLog.create({
    data: {
      businessId,
      userId: operator.userId,
      eventType,
      metadata: metadata as Prisma.InputJsonValue,
    },
  });
}

export async function runControlCenterAcknowledgeAlert(
  operator: ControlCenterOperatorContext,
  alertId: string,
): Promise<void> {
  await prisma.monitoringAlert.update({
    where: { id: alertId },
    data: { status: "ACKNOWLEDGED", acknowledgedAt: new Date() },
  });

  await logControlCenterMonitoringAudit("ALERT_ACKNOWLEDGED", { alertId }, operator);
}

export async function runControlCenterResolveAlert(
  operator: ControlCenterOperatorContext,
  alertId: string,
): Promise<void> {
  await prisma.monitoringAlert.update({
    where: { id: alertId },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });

  await logControlCenterMonitoringAudit("ALERT_RESOLVED", { alertId }, operator);
}

export async function runControlCenterEscalateAlert(
  operator: ControlCenterOperatorContext,
  alertId: string,
): Promise<void> {
  const alert = await prisma.monitoringAlert.findUnique({ where: { id: alertId } });

  if (!alert) {
    throw new Error("Alert not found");
  }

  const metadata =
    alert.metadata && typeof alert.metadata === "object" && !Array.isArray(alert.metadata)
      ? (alert.metadata as Record<string, unknown>)
      : {};

  await prisma.monitoringAlert.update({
    where: { id: alertId },
    data: {
      metadata: { ...metadata, escalated: true, escalatedAt: new Date().toISOString() },
    },
  });

  await logControlCenterMonitoringAudit("CONFIG_CHANGED", { alertId, escalated: true }, operator);
}

export async function runControlCenterResolveIncident(
  operator: ControlCenterOperatorContext,
  incidentId: string,
  rootCause?: string,
): Promise<void> {
  const incident = await prisma.monitoringErrorLog.findUnique({ where: { id: incidentId } });

  if (!incident) {
    throw new Error("Incident not found");
  }

  const existing = parseIncidentMetadata(incident.metadata);
  const resolvedAt = new Date().toISOString();

  await prisma.monitoringErrorLog.update({
    where: { id: incidentId },
    data: {
      metadata: {
        ...existing,
        rootCause: rootCause ?? existing.rootCause ?? "Resolved by operator",
        resolutionStatus: "RESOLVED",
        resolvedAt,
        assignedStaff: operator.fullName,
        timeline: [
          ...existing.timeline,
          { at: resolvedAt, event: `Resolved by ${operator.fullName}` },
        ],
      },
    },
  });
}
