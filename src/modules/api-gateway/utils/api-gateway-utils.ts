import type {
  ApiGatewayAuditLog,
  ApiRateLimitPolicy,
  ApiRequestLog,
  ApiRoute,
  ApiWebhookDelivery,
  ApiWebhookRegistration,
} from "@prisma/client";

import type {
  ApiGatewayAuditLogView,
  ApiGatewayDashboardMetrics,
  ApiRateLimitPolicyView,
  ApiRequestLogView,
  ApiRouteView,
  ApiWebhookDeliveryView,
  ApiWebhookRegistrationView,
} from "@/modules/api-gateway/types/api-gateway-types";

export function serializeApiRoute(route: ApiRoute): ApiRouteView {
  return {
    id: route.id,
    routeKey: route.routeKey,
    path: route.path,
    method: route.method,
    routeType: route.routeType,
    serviceTarget: route.serviceTarget,
    version: route.version,
    isActive: route.isActive,
  };
}

export function serializeApiRateLimitPolicy(policy: ApiRateLimitPolicy): ApiRateLimitPolicyView {
  return {
    id: policy.id,
    name: policy.name,
    scope: policy.scope,
    scopeIdentifier: policy.scopeIdentifier,
    requestsPerMinute: policy.requestsPerMinute,
    burstLimit: policy.burstLimit,
  };
}

export function serializeApiRequestLog(log: ApiRequestLog): ApiRequestLogView {
  return {
    id: log.id,
    method: log.method,
    path: log.path,
    statusCode: log.statusCode,
    responseTimeMs: log.responseTimeMs,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeApiWebhookRegistration(
  registration: ApiWebhookRegistration,
): ApiWebhookRegistrationView {
  return {
    id: registration.id,
    name: registration.name,
    url: registration.url,
    events: registration.events as string[],
    isActive: registration.isActive,
  };
}

export function serializeApiWebhookDelivery(delivery: ApiWebhookDelivery): ApiWebhookDeliveryView {
  return {
    id: delivery.id,
    eventType: delivery.eventType,
    status: delivery.status,
    attemptCount: delivery.attemptCount,
    createdAt: delivery.createdAt.toISOString(),
  };
}

export function serializeApiGatewayAuditLog(log: ApiGatewayAuditLog): ApiGatewayAuditLogView {
  return {
    id: log.id,
    eventType: log.eventType,
    routeKey: log.routeKey,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeApiGatewayDashboard(
  metrics: ApiGatewayDashboardMetrics,
): ApiGatewayDashboardMetrics {
  return metrics;
}

export type ApiGatewayDashboardView = ApiGatewayDashboardMetrics;
