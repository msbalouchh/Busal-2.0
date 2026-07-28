import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeAlert,
  serializeErrorLog,
  serializeHealthCheck,
  serializeMetricSnapshot,
  serializeMonitoringAuditLog,
  serializeMonitoringPlatformDashboard,
  serializePerformanceLog,
  serializeRetentionPolicy,
  serializeStructuredLog,
} from "@/modules/monitoring-platform/utils/monitoring-platform-utils";
import {
  ensureMonitoringPlatformDefaults,
  getMonitoringPlatformDashboard,
  listMonitoringAlerts,
  listMonitoringErrorLogs,
  listMonitoringHealthChecks,
  listMonitoringMetricSnapshots,
  listMonitoringPerformanceLogs,
  listMonitoringPlatformAuditLogs,
  listMonitoringRetentionPolicies,
  listMonitoringStructuredLogs,
  listRegisteredHealthChecks,
  logDashboardAccess,
} from "@/services/monitoring-platform.service";

export const getMonitoringPlatformOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.MONITORING_PLATFORM_VIEW });
  await ensureMonitoringPlatformDefaults(context.business.id);
  await logDashboardAccess(context, "overview");
  const dashboard = await getMonitoringPlatformDashboard(context.business.id);

  return {
    context,
    dashboard: serializeMonitoringPlatformDashboard(dashboard),
  };
});

export const getMonitoringPlatformHealthContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.MONITORING_PLATFORM_VIEW });
  const checks = await listMonitoringHealthChecks(context.business.id);

  return {
    context,
    checks: checks.map(serializeHealthCheck),
  };
});

export const getMonitoringPlatformMetricsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.MONITORING_PLATFORM_VIEW });
  const snapshots = await listMonitoringMetricSnapshots(context.business.id);

  return {
    context,
    snapshots: snapshots.map(serializeMetricSnapshot),
  };
});

export const getMonitoringPlatformPerformanceContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.MONITORING_PLATFORM_VIEW });
  const logs = await listMonitoringPerformanceLogs(context.business.id);

  return {
    context,
    logs: logs.map(serializePerformanceLog),
  };
});

export const getMonitoringPlatformErrorsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.MONITORING_PLATFORM_VIEW });
  const errors = await listMonitoringErrorLogs(context.business.id);

  return {
    context,
    errors: errors.map(serializeErrorLog),
  };
});

export const getMonitoringPlatformLogsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.MONITORING_PLATFORM_VIEW });
  const logs = await listMonitoringStructuredLogs(context.business.id);

  return {
    context,
    logs: logs.map(serializeStructuredLog),
  };
});

export const getMonitoringPlatformAlertsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.MONITORING_PLATFORM_VIEW });
  const alerts = await listMonitoringAlerts(context.business.id);

  return {
    context,
    alerts: alerts.map(serializeAlert),
  };
});

export const getMonitoringPlatformRetentionContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.MONITORING_PLATFORM_VIEW });
  const policies = await listMonitoringRetentionPolicies(context.business.id);

  return {
    context,
    policies: policies.map(serializeRetentionPolicy),
  };
});

export const getMonitoringPlatformRegistryContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.MONITORING_PLATFORM_VIEW });
  const registrations = await listRegisteredHealthChecks();

  return {
    context,
    registrations,
  };
});

export const getMonitoringPlatformAuditContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.MONITORING_PLATFORM_VIEW });
  const auditLogs = await listMonitoringPlatformAuditLogs(context.business.id);

  return {
    context,
    auditLogs: auditLogs.map(serializeMonitoringAuditLog),
  };
});
