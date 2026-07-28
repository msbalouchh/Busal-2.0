import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import {
  ALL_PERMISSION_CODES,
  PERMISSION_CODES,
} from "../src/modules/authorization/constants/permissions";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";
import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import {
  buildAlertDeliveryPayload,
  resolveAlertChannels,
} from "../src/modules/monitoring-platform/engine/alert-engine";
import {
  buildHealthEndpointResponse,
  evaluateHealthStatus,
  resolveHealthEndpointPath,
} from "../src/modules/monitoring-platform/engine/health-engine";
import {
  matchesCorrelationFilter,
  matchesLogLevelFilter,
  matchesLogSearch,
  resolveRetentionCutoff,
} from "../src/modules/monitoring-platform/engine/logging-engine";
import {
  aggregateMetrics,
  normalizeMetricSnapshot,
  shouldTriggerHighCpuAlert,
  shouldTriggerHighMemoryAlert,
} from "../src/modules/monitoring-platform/engine/metrics-engine";
import {
  buildPerformanceTrend,
  calculateAverageResponseTime,
  isSlowRequest,
} from "../src/modules/monitoring-platform/engine/performance-engine";
import {
  MONITORING_ALERT_TYPES,
  MONITORING_HEALTH_TARGET_TYPES,
  MONITORING_LOG_LEVELS,
  MONITORING_PLATFORM_ROUTES,
} from "../src/modules/monitoring-platform/constants/routes";
import {
  ensureBootstrapMonitoringPlatform,
  getDefaultHealthCheckCount,
} from "../src/modules/monitoring-platform/plugins/bootstrap-monitoring-platform";
import {
  isHealthCheckRegistered,
  listHealthCheckDefinitions,
} from "../src/modules/monitoring-platform/registry/health-check-registry";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import {
  acknowledgeMonitoringAlert,
  applyRetentionPolicies,
  ensureMonitoringPlatformDefaults,
  getMonitoringPlatformDashboard,
  listMonitoringPlatformAuditLogs,
  logDashboardAccess,
  recordErrorLog,
  recordMetricSnapshot,
  recordPerformanceLog,
  recordStructuredLog,
  registerModuleHealthCheck,
  resolveMonitoringAlert,
  runHealthChecks,
  searchStructuredLogs,
  triggerMonitoringAlert,
  upsertRetentionPolicy,
} from "../src/services/monitoring-platform.service";
import { mapProfileToAuthUser } from "../src/services/user.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function buildPlatformContext(businessId: string): Promise<BusinessContext> {
  const businessRecord = await prisma.business.findUnique({
    where: { id: businessId },
    include: { owner: true },
  });

  assert(businessRecord?.owner, "Business owner missing");

  const business = await getOwnedBusinessById(businessRecord.ownerId, businessId);
  assert(business, "Business profile missing");

  const user = mapProfileToAuthUser(
    businessRecord.owner.id,
    businessRecord.owner.email,
    businessRecord.owner,
    {},
  );
  const authorization = await resolveAuthorizationContext(user, business);

  return {
    user,
    business,
    branch: null,
    branchId: null,
    roleSlug: authorization.roleSlug,
    permissions: Array.from(authorization.permissions),
    authorization,
    staffSession: null,
    isOwner: authorization.isOwner,
    accessibleBusinesses: [
      { id: business.id, name: business.businessName ?? "Business", isOnboarded: true },
    ],
    accessibleBranches: [],
  };
}

async function main() {
  console.log("Module structure");
  const moduleFiles = [
    "src/modules/monitoring-platform/index.ts",
    "src/modules/monitoring-platform/constants/routes.ts",
    "src/modules/monitoring-platform/types/monitoring-platform-types.ts",
    "src/modules/monitoring-platform/registry/health-check-registry.ts",
    "src/modules/monitoring-platform/engine/health-engine.ts",
    "src/modules/monitoring-platform/engine/metrics-engine.ts",
    "src/modules/monitoring-platform/engine/performance-engine.ts",
    "src/modules/monitoring-platform/engine/logging-engine.ts",
    "src/modules/monitoring-platform/engine/alert-engine.ts",
    "src/modules/monitoring-platform/plugins/bootstrap-monitoring-platform.ts",
    "src/modules/monitoring-platform/utils/monitoring-platform-utils.ts",
    "src/modules/monitoring-platform/lib/get-monitoring-platform-context.ts",
    "src/modules/monitoring-platform/actions/monitoring-platform-actions.ts",
    "src/modules/monitoring-platform/components/monitoring-platform-dashboard.tsx",
    "src/modules/monitoring-platform/components/monitoring-platform-lists.tsx",
    "src/modules/monitoring-platform/components/monitoring-platform-nav.tsx",
    "src/services/monitoring-platform.service.ts",
    "src/app/dashboard/monitoring-platform/page.tsx",
    "src/app/dashboard/monitoring-platform/health/page.tsx",
    "src/app/dashboard/monitoring-platform/metrics/page.tsx",
    "src/app/dashboard/monitoring-platform/performance/page.tsx",
    "src/app/dashboard/monitoring-platform/errors/page.tsx",
    "src/app/dashboard/monitoring-platform/logs/page.tsx",
    "src/app/dashboard/monitoring-platform/alerts/page.tsx",
    "src/app/dashboard/monitoring-platform/retention/page.tsx",
    "src/app/dashboard/monitoring-platform/registry/page.tsx",
    "src/app/dashboard/monitoring-platform/audit/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Monitoring platform routes");
  assert(
    MONITORING_PLATFORM_ROUTES.overview === "/dashboard/monitoring-platform",
    "Overview route mismatch",
  );
  assert(MONITORING_PLATFORM_ROUTES.registry.includes("registry"), "Registry route missing");
  console.log("  PASS");

  console.log("Permission protected");
  const permissionsSource = readFileSync(
    join(root, "src/modules/authorization/constants/permissions.ts"),
    "utf8",
  );
  assert(
    permissionsSource.includes("monitoring_platform.view"),
    "monitoring_platform.view missing",
  );
  assert(
    permissionsSource.includes("monitoring_platform.admin"),
    "monitoring_platform.admin missing",
  );
  assert(
    ALL_PERMISSION_CODES.includes(PERMISSION_CODES.MONITORING_PLATFORM_MANAGE),
    "Permission code missing",
  );
  console.log("  PASS");

  console.log("Schema");
  const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schema.includes("model MonitoringHealthCheck"), "MonitoringHealthCheck missing");
  assert(schema.includes("model MonitoringMetricSnapshot"), "MonitoringMetricSnapshot missing");
  assert(schema.includes("model MonitoringErrorLog"), "MonitoringErrorLog missing");
  assert(schema.includes("model MonitoringAlert"), "MonitoringAlert missing");
  assert(schema.includes("model MonitoringPlatformAuditLog"), "MonitoringPlatformAuditLog missing");
  console.log("  PASS");

  console.log("Registry bootstrap");
  ensureBootstrapMonitoringPlatform();
  const checks = listHealthCheckDefinitions();
  assert(checks.length === getDefaultHealthCheckCount(), "Default health checks not registered");
  assert(isHealthCheckRegistered("platform.core"), "Platform health check missing");
  assert(isHealthCheckRegistered("ai.platform"), "AI health check missing");
  assert(MONITORING_HEALTH_TARGET_TYPES.length === 9, "Expected 9 health target types");
  assert(MONITORING_LOG_LEVELS.length === 5, "Expected 5 log levels");
  assert(MONITORING_ALERT_TYPES.length === 9, "Expected 9 alert types");
  console.log("  PASS");

  console.log("Health engine");
  assert(evaluateHealthStatus({ targetType: "PLATFORM" }) === "HEALTHY", "Healthy check failed");
  assert(
    evaluateHealthStatus({ targetType: "DATABASE", lastError: true }) === "UNHEALTHY",
    "Unhealthy check failed",
  );
  const healthResponse = buildHealthEndpointResponse([
    {
      checkKey: "test",
      name: "Test",
      targetType: "SERVICE",
      status: "HEALTHY",
    },
  ]);
  assert(healthResponse.status === "HEALTHY", "Health endpoint response failed");
  assert(
    resolveHealthEndpointPath("platform.core") === "/api/v1/monitoring/health/platform.core",
    "Health endpoint path failed",
  );
  console.log("  PASS");

  console.log("Metrics engine");
  const normalized = normalizeMetricSnapshot({ cpuUsage: 45, memoryUsage: 60 });
  assert(normalized.cpuUsage === 45, "Metric normalization failed");
  const aggregated = aggregateMetrics([
    {
      cpuUsage: 50,
      memoryUsage: 60,
      diskUsage: 40,
      networkUsage: 10,
      databaseConnections: 5,
      activeSessions: 20,
      queueLength: 3,
      backgroundJobs: 2,
      cacheHitRate: 90,
      storageUsageBytes: BigInt(1000),
    },
  ]);
  assert(aggregated.avgCpuUsage === 50, "Metric aggregation failed");
  assert(shouldTriggerHighCpuAlert(90), "High CPU alert threshold failed");
  assert(shouldTriggerHighMemoryAlert(95), "High memory alert threshold failed");
  console.log("  PASS");

  console.log("Performance engine");
  assert(isSlowRequest(1500), "Slow request detection failed");
  assert(calculateAverageResponseTime([100, 200, 300]) === 200, "Average response time failed");
  const trend = buildPerformanceTrend([100, 500, 1200, 200]);
  assert(trend.slowCount === 1, "Performance trend failed");
  console.log("  PASS");

  console.log("Logging engine");
  assert(matchesLogLevelFilter("ERROR", "ERROR"), "Log level filter failed");
  assert(matchesLogSearch("test", "test message", "service"), "Log search failed");
  assert(matchesCorrelationFilter("corr-1", "corr-1"), "Correlation filter failed");
  assert(resolveRetentionCutoff(30) < new Date(), "Retention cutoff failed");
  console.log("  PASS");

  console.log("Alert engine");
  assert(resolveAlertChannels(undefined).includes("IN_APP"), "Default alert channel failed");
  const payload = buildAlertDeliveryPayload({
    alertType: "API_FAILURE",
    title: "API Failure",
    message: "Gateway error",
    businessId: "biz-1",
  });
  assert(payload.alertType === "API_FAILURE", "Alert delivery payload failed");
  console.log("  PASS");

  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  assert(business, "No business found");
  const platform = await buildPlatformContext(business.id);

  await prisma.monitoringPlatformAuditLog.deleteMany({
    where: {
      businessId: business.id,
      eventType: "CHECK_REGISTERED",
    },
  });
  await prisma.monitoringAlert.deleteMany({
    where: { businessId: business.id, title: { startsWith: "custom.verify" } },
  });
  await prisma.monitoringStructuredLog.deleteMany({
    where: { businessId: business.id, source: { startsWith: "custom.verify" } },
  });
  await prisma.monitoringErrorLog.deleteMany({
    where: { businessId: business.id, message: { startsWith: "custom.verify" } },
  });
  await prisma.monitoringPerformanceLog.deleteMany({
    where: { businessId: business.id, operationKey: { startsWith: "custom.verify" } },
  });
  await prisma.monitoringMetricSnapshot.deleteMany({
    where: { businessId: business.id, snapshotKey: { startsWith: "custom.verify" } },
  });
  await prisma.monitoringHealthCheck.deleteMany({
    where: { businessId: business.id, checkKey: { startsWith: "custom.verify" } },
  });
  await prisma.monitoringRetentionPolicy.deleteMany({
    where: { businessId: business.id, name: { startsWith: "custom.verify" } },
  });

  console.log("Monitoring platform defaults");
  await ensureMonitoringPlatformDefaults(business.id);
  const checkCount = await prisma.monitoringHealthCheck.count({
    where: { businessId: business.id },
  });
  assert(checkCount >= getDefaultHealthCheckCount(), "Default health checks not seeded");
  const policyCount = await prisma.monitoringRetentionPolicy.count({
    where: { businessId: business.id },
  });
  assert(policyCount >= 1, "Default retention policy missing");
  console.log("  PASS");

  console.log("Run health checks");
  const health = await runHealthChecks(business.id);
  assert(health.status === "HEALTHY", "Health checks should be healthy");
  assert(health.checks.length >= getDefaultHealthCheckCount(), "Health check count mismatch");
  console.log("  PASS");

  console.log("Record metric snapshot");
  const snapshot = await recordMetricSnapshot(platform, {
    snapshotKey: "custom.verify_snapshot",
    cpuUsage: 55,
    memoryUsage: 70,
    databaseConnections: 10,
    queueLength: 5,
  });
  assert(snapshot.id, "Metric snapshot not created");
  console.log("  PASS");

  console.log("Record performance log");
  const perf = await recordPerformanceLog(platform, {
    category: "API",
    operationKey: "custom.verify_api_call",
    durationMs: 1500,
    correlationId: "corr-verify-1",
    requestId: "req-verify-1",
  });
  assert(perf.id, "Performance log not created");
  const perfRecord = await prisma.monitoringPerformanceLog.findUnique({ where: { id: perf.id } });
  assert(perfRecord?.isSlow, "Slow request should be flagged");
  console.log("  PASS");

  console.log("Record error log");
  const error = await recordErrorLog(platform, {
    errorType: "API_ERROR",
    message: "custom.verify API error",
    stackTrace: "Error: test\n  at verify",
    correlationId: "corr-verify-1",
    requestId: "req-verify-1",
  });
  assert(error.id, "Error log not created");
  console.log("  PASS");

  console.log("Record structured log");
  const log = await recordStructuredLog(platform, {
    level: "INFO",
    message: "custom.verify structured log entry",
    source: "custom.verify-service",
    correlationId: "corr-verify-1",
  });
  assert(log.id, "Structured log not created");
  console.log("  PASS");

  console.log("Search structured logs");
  const searchResults = await searchStructuredLogs(business.id, {
    query: "custom.verify",
    level: "INFO",
    correlationId: "corr-verify-1",
  });
  assert(searchResults.length >= 1, "Structured log search failed");
  console.log("  PASS");

  console.log("Trigger monitoring alert");
  const alert = await triggerMonitoringAlert(platform, {
    alertType: "API_FAILURE",
    title: "custom.verify API Failure",
    message: "API gateway returned 500",
    channels: ["IN_APP", "EMAIL", "WEBHOOK"],
  });
  assert(alert.id, "Alert not created");
  console.log("  PASS");

  console.log("Acknowledge and resolve alert");
  await acknowledgeMonitoringAlert(platform, alert.id);
  const acknowledged = await prisma.monitoringAlert.findUnique({ where: { id: alert.id } });
  assert(acknowledged?.status === "ACKNOWLEDGED", "Alert acknowledge failed");
  await resolveMonitoringAlert(platform, alert.id);
  const resolved = await prisma.monitoringAlert.findUnique({ where: { id: alert.id } });
  assert(resolved?.status === "RESOLVED", "Alert resolve failed");
  console.log("  PASS");

  console.log("Upsert retention policy");
  const policy = await upsertRetentionPolicy(platform, {
    name: "custom.verify_retention",
    logRetentionDays: 14,
    metricsRetentionDays: 30,
    alertHistoryDays: 60,
    archiveEnabled: true,
  });
  assert(policy.id, "Retention policy not created");
  console.log("  PASS");

  console.log("Register module health check");
  await registerModuleHealthCheck(business.id, {
    checkKey: "custom.verify_ext",
    name: "Verify Extension",
    targetType: "SERVICE",
    serviceTarget: "verify-service",
    isActive: true,
  });
  assert(isHealthCheckRegistered("custom.verify_ext"), "Custom health check registration failed");
  console.log("  PASS");

  console.log("Monitoring platform dashboard");
  const dashboard = await getMonitoringPlatformDashboard(business.id);
  assert(
    dashboard.totalHealthChecks >= getDefaultHealthCheckCount() + 1,
    "Dashboard health checks missing",
  );
  assert(
    dashboard.registeredChecks >= getDefaultHealthCheckCount() + 1,
    "Registered checks mismatch",
  );
  console.log("  PASS");

  console.log("Apply retention policies");
  const retention = await applyRetentionPolicies(business.id);
  assert(retention.archived >= 0, "Retention apply failed");
  console.log("  PASS");

  console.log("Dashboard access audit");
  await logDashboardAccess(platform, "overview");
  console.log("  PASS");

  console.log("Audit logs");
  const auditLogs = await listMonitoringPlatformAuditLogs(business.id);
  assert(
    auditLogs.some((entry) => entry.eventType === "HEALTH_CHECK"),
    "Health check audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "ALERT_TRIGGERED"),
    "Alert triggered audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "ALERT_ACKNOWLEDGED"),
    "Alert acknowledged audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "ALERT_RESOLVED"),
    "Alert resolved audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "CONFIG_CHANGED"),
    "Config changed audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "CHECK_REGISTERED"),
    "Check registered audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "DASHBOARD_ACCESS"),
    "Dashboard access audit missing",
  );
  console.log("  PASS");

  console.log("\nMonitoring & Observability Platform verification passed.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
