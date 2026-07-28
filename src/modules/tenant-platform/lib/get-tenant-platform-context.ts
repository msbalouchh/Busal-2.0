import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeResourceLimit,
  serializeResourceUsage,
  serializeTenantActivity,
  serializeTenantAuditLog,
  serializeTenantPlatformDashboard,
  serializeTenantPolicy,
  serializeTenantRecord,
  serializeTenantSettings,
} from "@/modules/tenant-platform/utils/tenant-platform-utils";
import {
  ensureTenantPlatformDefaults,
  getTenantAnalytics,
  getTenantPlatformDashboard,
  getTenantRecord,
  getTenantResourceLimit,
  getTenantResourceUsage,
  getTenantSettings,
  listRegisteredTenantPolicies,
  listTenantActivityEvents,
  listTenantPlatformAuditLogs,
  listTenantPolicies,
  logTenantDashboardAccess,
  runTenantHealthCheck,
} from "@/services/tenant-platform.service";

export const getTenantPlatformOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.TENANT_PLATFORM_VIEW });
  await ensureTenantPlatformDefaults(context.business.id);
  await logTenantDashboardAccess(context, "overview");
  const dashboard = await getTenantPlatformDashboard(context.business.id);

  return {
    context,
    dashboard: serializeTenantPlatformDashboard(dashboard),
  };
});

export const getTenantPlatformLifecycleContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.TENANT_PLATFORM_VIEW });
  const tenant = await getTenantRecord(context.business.id);

  return {
    context,
    tenant: tenant ? serializeTenantRecord(tenant) : null,
  };
});

export const getTenantPlatformBusinessContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.TENANT_PLATFORM_VIEW });
  const [tenant, settings] = await Promise.all([
    getTenantRecord(context.business.id),
    getTenantSettings(context.business.id),
  ]);

  return {
    context,
    tenant: tenant ? serializeTenantRecord(tenant) : null,
    settings: settings ? serializeTenantSettings(settings) : null,
  };
});

export const getTenantPlatformResourcesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.TENANT_PLATFORM_VIEW });
  const [limits, usage] = await Promise.all([
    getTenantResourceLimit(context.business.id),
    getTenantResourceUsage(context.business.id),
  ]);

  return {
    context,
    limits: limits ? serializeResourceLimit(limits) : null,
    usage: usage ? serializeResourceUsage(usage) : null,
  };
});

export const getTenantPlatformSettingsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.TENANT_PLATFORM_VIEW });
  const settings = await getTenantSettings(context.business.id);

  return {
    context,
    settings: settings ? serializeTenantSettings(settings) : null,
  };
});

export const getTenantPlatformHealthContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.TENANT_PLATFORM_VIEW });
  const health = await runTenantHealthCheck(context);

  return { context, health };
});

export const getTenantPlatformSecurityContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.TENANT_PLATFORM_VIEW });
  const [policies, registrations] = await Promise.all([
    listTenantPolicies(context.business.id),
    listRegisteredTenantPolicies(),
  ]);

  return {
    context,
    policies: policies.map(serializeTenantPolicy),
    registrations,
  };
});

export const getTenantPlatformAnalyticsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.TENANT_PLATFORM_VIEW });
  const analytics = await getTenantAnalytics(context);

  return { context, analytics };
});

export const getTenantPlatformActivityContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.TENANT_PLATFORM_VIEW });
  const activities = await listTenantActivityEvents(context.business.id);

  return {
    context,
    activities: activities.map(serializeTenantActivity),
  };
});

export const getTenantPlatformAuditContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.TENANT_PLATFORM_VIEW });
  const auditLogs = await listTenantPlatformAuditLogs(context.business.id);

  return {
    context,
    auditLogs: auditLogs.map(serializeTenantAuditLog),
  };
});
