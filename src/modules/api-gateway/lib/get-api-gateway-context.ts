import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeApiGatewayAuditLog,
  serializeApiGatewayDashboard,
  serializeApiRateLimitPolicy,
  serializeApiRequestLog,
  serializeApiRoute,
  serializeApiWebhookDelivery,
  serializeApiWebhookRegistration,
} from "@/modules/api-gateway/utils/api-gateway-utils";
import {
  ensureApiGatewayDefaults,
  getApiGatewayDashboard,
  getOpenApiRegistry,
  listApiGatewayAuditLogs,
  listApiRateLimitPolicies,
  listApiRequestLogs,
  listApiRoutes,
  listApiWebhookDeliveries,
  listApiWebhookRegistrations,
  listRegisteredApiRoutes,
} from "@/services/api-gateway.service";

export const getApiGatewayOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.API_GATEWAY_VIEW });
  await ensureApiGatewayDefaults(context.business.id);
  const dashboard = await getApiGatewayDashboard(context.business.id);

  return {
    context,
    dashboard: serializeApiGatewayDashboard(dashboard),
  };
});

export const getApiGatewayRoutesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.API_GATEWAY_VIEW });
  const routes = await listApiRoutes(context.business.id);

  return {
    context,
    routes: routes.map(serializeApiRoute),
  };
});

export const getApiGatewayRegistryContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.API_GATEWAY_VIEW });
  const registrations = await listRegisteredApiRoutes();

  return {
    context,
    registrations,
  };
});

export const getApiGatewayRateLimitsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.API_GATEWAY_VIEW });
  const policies = await listApiRateLimitPolicies(context.business.id);

  return {
    context,
    policies: policies.map(serializeApiRateLimitPolicy),
  };
});

export const getApiGatewayWebhooksContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.API_GATEWAY_VIEW });
  const [registrations, deliveries] = await Promise.all([
    listApiWebhookRegistrations(context.business.id),
    listApiWebhookDeliveries(context.business.id),
  ]);

  return {
    context,
    registrations: registrations.map(serializeApiWebhookRegistration),
    deliveries: deliveries.map(serializeApiWebhookDelivery),
  };
});

export const getApiGatewayMonitoringContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.API_GATEWAY_VIEW });
  const logs = await listApiRequestLogs(context.business.id);

  return {
    context,
    logs: logs.map(serializeApiRequestLog),
  };
});

export const getApiGatewayOpenApiContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.API_GATEWAY_VIEW });
  const entries = await getOpenApiRegistry(context.business.id);

  return {
    context,
    entries,
  };
});

export const getApiGatewayAuditContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.API_GATEWAY_VIEW });
  const auditLogs = await listApiGatewayAuditLogs(context.business.id);

  return {
    context,
    auditLogs: auditLogs.map(serializeApiGatewayAuditLog),
  };
});
