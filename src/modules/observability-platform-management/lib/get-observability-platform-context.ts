import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { resolveAuthorizationContext } from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import { OBSERVABILITY_PLATFORM_ROUTES } from "@/modules/observability-platform-management/constants/routes";
import {
  serializeAlert,
  serializeAuditEntry,
  serializeIncident,
  serializeLog,
  serializeMetric,
  serializeObservabilitySummary,
  serializePerformanceSummary,
  serializeServiceHealth,
  serializeTrace,
} from "@/modules/observability-platform-management/lib/observability-platform-validation";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  getObservabilityDashboardOverview,
  searchObservability,
  aggregateAuditTimeline,
} from "@/services/observability-platform-manager.service";
import { resolveObservabilityPlatformPermissions } from "@/services/observability-platform-permission.service";
import { listMetrics } from "@/services/platform-metrics.service";
import { listPlatformLogs } from "@/services/platform-logging.service";
import { listIncidents } from "@/services/platform-incident-manager.service";
import { listAlerts } from "@/services/platform-alert-manager.service";
import { getServiceHealth } from "@/services/platform-health-monitor.service";
import { getPerformanceSummary } from "@/services/platform-performance-monitor.service";
import { listTraces } from "@/services/platform-tracing.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

export interface ObservabilityPlatformContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: ReturnType<typeof resolveObservabilityPlatformPermissions>;
}

async function resolveObservabilityBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();
  const authorization = await resolveAuthorizationContext(user, business);
  return { business, authorization };
}

export const getObservabilityPlatformContext = cache(
  async (): Promise<ObservabilityPlatformContext> => {
    const user = await requireApplicationAccess();
    const loaded = await resolveObservabilityBusiness(user);
    const permissionsFlags = resolveObservabilityPlatformPermissions(
      loaded.authorization.permissions,
      loaded.authorization.isOwner,
    );

    if (!permissionsFlags.canView) redirect(ROUTES.application);

    return {
      user,
      business: loaded.business,
      authorization: loaded.authorization,
      permissionsFlags,
    };
  },
);

export async function requireObservabilityPlatformActionContext(
  permission: string,
): Promise<ObservabilityPlatformContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolveObservabilityBusiness(user);
  const permissionsFlags = resolveObservabilityPlatformPermissions(
    loaded.authorization.permissions,
    loaded.authorization.isOwner,
  );

  const allowed = loaded.authorization.isOwner || loaded.authorization.permissions.has(permission);
  if (!allowed) throw permissionDenied();

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags,
  };
}

export const getObservabilityDashboardContext = cache(async () => {
  const context = await getObservabilityPlatformContext();
  const overview = await getObservabilityDashboardOverview(context.user.id);
  return {
    ...context,
    summary: serializeObservabilitySummary(overview),
    serviceHealth: overview.serviceHealth.map(serializeServiceHealth),
    recentMetrics: overview.metrics.recent.slice(0, 10).map(serializeMetric),
  };
});

export const getObservabilityMetricsContext = cache(async (service?: string) => {
  const context = await getObservabilityPlatformContext();
  const metrics = await listMetrics(context.user.id, { service, limit: 100 });
  return { ...context, metrics: metrics.map(serializeMetric), serviceFilter: service ?? "" };
});

export const getObservabilityLogsContext = cache(
  async (filters?: { service?: string; level?: string; search?: string }) => {
    const context = await getObservabilityPlatformContext();
    if (!context.permissionsFlags.canViewLogs) redirect(OBSERVABILITY_PLATFORM_ROUTES.dashboard());
    const logs = await listPlatformLogs(context.user.id, {
      service: filters?.service,
      level: filters?.level as "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL" | undefined,
      search: filters?.search,
      limit: 100,
    });
    return {
      ...context,
      logs: logs.map(serializeLog),
      filters: filters ?? {},
    };
  },
);

export const getObservabilityIncidentsContext = cache(async () => {
  const context = await getObservabilityPlatformContext();
  const incidents = await listIncidents(context.user.id);
  return { ...context, incidents: incidents.map(serializeIncident) };
});

export const getObservabilityAlertsContext = cache(async () => {
  const context = await getObservabilityPlatformContext();
  const alerts = await listAlerts(context.user.id);
  return { ...context, alerts: alerts.map(serializeAlert) };
});

export const getObservabilityHealthContext = cache(async () => {
  const context = await getObservabilityPlatformContext();
  const serviceHealth = await getServiceHealth(context.user.id);
  const overview = await getObservabilityDashboardOverview(context.user.id);
  return {
    ...context,
    serviceHealth: serviceHealth.map(serializeServiceHealth),
    systemHealth: overview.systemHealth,
  };
});

export const getObservabilityPerformanceContext = cache(async () => {
  const context = await getObservabilityPlatformContext();
  const performance = await getPerformanceSummary(context.user.id);
  return {
    ...context,
    performance: serializePerformanceSummary(performance),
    latencySeries: performance.latencySeries,
    throughputSeries: performance.throughputSeries,
  };
});

export const getObservabilityTracesContext = cache(async (service?: string) => {
  const context = await getObservabilityPlatformContext();
  if (!context.permissionsFlags.canViewLogs) redirect(OBSERVABILITY_PLATFORM_ROUTES.dashboard());
  const traces = await listTraces(context.user.id, { service, limit: 50 });
  return { ...context, traces: traces.map(serializeTrace), serviceFilter: service ?? "" };
});

export const getObservabilityAuditContext = cache(async () => {
  const context = await getObservabilityPlatformContext();
  const timeline = await aggregateAuditTimeline(context.user.id);
  return { ...context, timeline: timeline.map(serializeAuditEntry) };
});

export const getObservabilitySearchContext = cache(async (query?: string) => {
  const context = await getObservabilityPlatformContext();
  const trimmed = query?.trim() ?? "";
  if (!trimmed) return { ...context, search: "", logs: [], metrics: [] };
  const results = await searchObservability(context.user.id, trimmed);
  return {
    ...context,
    search: trimmed,
    logs: results.logs.map(serializeLog),
    metrics: results.metrics.map(serializeMetric),
  };
});
