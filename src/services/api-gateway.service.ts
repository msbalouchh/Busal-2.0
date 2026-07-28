import "server-only";

import type {
  ApiAuthMethod,
  ApiGatewayAuditEventType,
  ApiRateLimitScope,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  evaluatePermission,
  toPermissionEvaluationContext,
} from "@/modules/iam/engine/permission-engine";
import {
  buildAuthContext,
  detectAuthMethod,
  parseApiKey,
} from "@/modules/api-gateway/engine/auth-engine";
import { authorizeGatewayRequest } from "@/modules/api-gateway/engine/authorization-engine";
import { buildMonitoringSnapshot } from "@/modules/api-gateway/engine/monitoring-engine";
import { checkRateLimit } from "@/modules/api-gateway/engine/rate-limit-engine";
import { matchRoute, resolveApiVersion } from "@/modules/api-gateway/engine/routing-engine";
import { validateGatewayRequest } from "@/modules/api-gateway/engine/validation-engine";
import {
  DEFAULT_WEBHOOK_RETRY_POLICY,
  generateWebhookSignature,
  resolveNextRetry,
  shouldMoveToDeadLetter,
  verifyWebhookSecret,
} from "@/modules/api-gateway/engine/webhook-engine";
import { ensureBootstrapApiGateway } from "@/modules/api-gateway/plugins/bootstrap-api-gateway";
import {
  listApiRouteDefinitions,
  registerApiRouteDefinition,
} from "@/modules/api-gateway/registry/route-registry";
import type {
  ApiGatewayDashboardMetrics,
  DeliverWebhookInput,
  GatewayRequestInput,
  GatewayRequestResult,
  OpenApiRegistryEntry,
  RegisterWebhookInput,
  RegisteredApiRouteDefinition,
} from "@/modules/api-gateway/types/api-gateway-types";

function assertPermission(platform: BusinessContext, permission: string): void {
  const context = toPermissionEvaluationContext({
    permissions: platform.permissions,
    roleSlug: platform.roleSlug,
    isOwner: platform.isOwner,
    businessId: platform.business.id,
    branchId: platform.branchId,
  });

  if (!evaluatePermission(context, permission)) {
    throw new Error(`Permission denied: ${permission} required`);
  }
}

async function logGatewayAudit(input: {
  businessId?: string | null;
  userId?: string | null;
  routeId?: string | null;
  routeKey?: string | null;
  eventType: ApiGatewayAuditEventType;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.apiGatewayAuditLog.create({
    data: {
      businessId: input.businessId ?? null,
      userId: input.userId ?? null,
      routeId: input.routeId ?? null,
      routeKey: input.routeKey ?? null,
      eventType: input.eventType,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

async function syncRouteToDatabase(
  businessId: string,
  definition: RegisteredApiRouteDefinition,
): Promise<void> {
  await prisma.apiRoute.upsert({
    where: {
      businessId_routeKey_version: {
        businessId,
        routeKey: definition.routeKey,
        version: definition.version ?? "v1",
      },
    },
    create: {
      businessId,
      routeKey: definition.routeKey,
      path: definition.path,
      method: definition.method,
      routeType: definition.routeType,
      serviceTarget: definition.serviceTarget,
      version: definition.version ?? "v1",
      versionStrategy: definition.versionStrategy ?? "URI",
      requiredPermission: definition.requiredPermission ?? null,
      apiScopes: (definition.apiScopes ?? []) as Prisma.InputJsonValue,
      authMethods: (definition.authMethods ?? ["JWT", "API_KEY"]) as Prisma.InputJsonValue,
      maxPayloadBytes: definition.maxPayloadBytes ?? 1048576,
      allowedContentTypes: (definition.allowedContentTypes ?? [
        "application/json",
      ]) as Prisma.InputJsonValue,
      requestSchema: definition.requestSchema
        ? (definition.requestSchema as Prisma.InputJsonValue)
        : undefined,
      openapiSpec: definition.openapiSpec
        ? (definition.openapiSpec as Prisma.InputJsonValue)
        : undefined,
      metadata: definition.metadata ? (definition.metadata as Prisma.InputJsonValue) : undefined,
      isActive: definition.isActive,
    },
    update: {
      path: definition.path,
      method: definition.method,
      routeType: definition.routeType,
      serviceTarget: definition.serviceTarget,
      requiredPermission: definition.requiredPermission ?? null,
      isActive: definition.isActive,
    },
  });
}

async function getRecentRequestCount(
  businessId: string,
  scope: ApiRateLimitScope,
  scopeIdentifier: string,
): Promise<number> {
  const since = new Date(Date.now() - 60_000);

  if (scope === "IP") {
    return prisma.apiRequestLog.count({
      where: { businessId, ipAddress: scopeIdentifier, createdAt: { gte: since } },
    });
  }

  if (scope === "USER") {
    return prisma.apiRequestLog.count({
      where: { businessId, userId: scopeIdentifier, createdAt: { gte: since } },
    });
  }

  return prisma.apiRequestLog.count({
    where: { businessId, clientId: scopeIdentifier, createdAt: { gte: since } },
  });
}

export async function ensureApiGatewayDefaults(businessId: string): Promise<void> {
  ensureBootstrapApiGateway();

  for (const definition of listApiRouteDefinitions()) {
    await syncRouteToDatabase(businessId, definition);
  }

  const defaultPolicies = [
    { name: "Business Default", scope: "BUSINESS" as const, scopeIdentifier: businessId },
    { name: "IP Default", scope: "IP" as const, scopeIdentifier: "*" },
  ];

  for (const policy of defaultPolicies) {
    const existing = await prisma.apiRateLimitPolicy.findFirst({
      where: { businessId, scope: policy.scope, scopeIdentifier: policy.scopeIdentifier },
    });

    if (!existing) {
      await prisma.apiRateLimitPolicy.create({
        data: {
          businessId,
          name: policy.name,
          scope: policy.scope,
          scopeIdentifier: policy.scopeIdentifier,
          requestsPerMinute: 120,
          burstLimit: 20,
        },
      });
    }
  }
}

export async function registerModuleApiRoute(
  businessId: string,
  definition: RegisteredApiRouteDefinition,
): Promise<void> {
  ensureBootstrapApiGateway();
  registerApiRouteDefinition(definition);
  await syncRouteToDatabase(businessId, definition);

  await logGatewayAudit({
    businessId,
    routeKey: definition.routeKey,
    eventType: "ROUTE_REGISTERED",
    metadata: { path: definition.path, method: definition.method },
  });
}

export async function routeGatewayRequest(
  platform: BusinessContext,
  request: GatewayRequestInput,
): Promise<GatewayRequestResult> {
  assertPermission(platform, PERMISSION_CODES.API_GATEWAY_INVOKE);

  const start = Date.now();
  ensureBootstrapApiGateway();

  const dbRoutes = await prisma.apiRoute.findMany({
    where: { businessId: platform.business.id, isActive: true },
  });

  const registryRoutes: RegisteredApiRouteDefinition[] = dbRoutes.map((route) => ({
    routeKey: route.routeKey,
    path: route.path,
    method: route.method,
    routeType: route.routeType,
    serviceTarget: route.serviceTarget,
    version: route.version,
    versionStrategy: route.versionStrategy,
    requiredPermission: route.requiredPermission,
    apiScopes: route.apiScopes as string[],
    authMethods: route.authMethods as ApiAuthMethod[],
    maxPayloadBytes: route.maxPayloadBytes,
    allowedContentTypes: route.allowedContentTypes as string[],
    requestSchema: route.requestSchema as Record<string, unknown> | undefined,
    isActive: route.isActive,
  }));

  const { version, normalizedPath } = resolveApiVersion({
    path: request.path,
    headerVersion: request.apiVersion,
    strategy: "URI",
  });

  const matched = matchRoute(registryRoutes, request.method, normalizedPath, version);

  if (!matched) {
    const responseTimeMs = Date.now() - start;
    await logGatewayRequest(platform, request, {
      statusCode: 404,
      responseTimeMs,
      errorMessage: "Route not found",
    });

    return {
      allowed: false,
      statusCode: 404,
      responseTimeMs,
      error: "Route not found",
    };
  }

  const routeDefinition = registryRoutes.find((r) => r.routeKey === matched.routeKey)!;
  const validation = validateGatewayRequest(request, routeDefinition);

  if (!validation.valid) {
    const responseTimeMs = Date.now() - start;
    await logGatewayRequest(platform, request, {
      statusCode: 400,
      responseTimeMs,
      routeId: matched.routeId,
      errorMessage: validation.errors.join("; "),
    });

    return {
      allowed: false,
      statusCode: 400,
      responseTimeMs,
      error: validation.errors.join("; "),
    };
  }

  const authMethod = detectAuthMethod(request) ?? "JWT";
  const apiKeyValid = request.apiKey ? parseApiKey(request.apiKey).valid : true;

  if (request.apiKey && !apiKeyValid) {
    await logGatewayAudit({
      businessId: platform.business.id,
      userId: platform.user.id,
      routeKey: matched.routeKey,
      eventType: "AUTH_FAILURE",
    });

    return {
      allowed: false,
      statusCode: 401,
      responseTimeMs: Date.now() - start,
      error: "Invalid API key",
    };
  }

  const auth = buildAuthContext({
    authMethod,
    userId: platform.user.id,
    businessId: platform.business.id,
    branchId: platform.branchId,
    roleSlug: platform.roleSlug,
    permissions: platform.permissions,
    isOwner: platform.isOwner,
    apiScopes: matched.apiScopes,
  });

  const authorization = authorizeGatewayRequest({
    auth,
    requiredPermission: matched.requiredPermission,
    requiredScopes: matched.apiScopes,
  });

  if (!authorization.allowed) {
    await logGatewayAudit({
      businessId: platform.business.id,
      userId: platform.user.id,
      routeKey: matched.routeKey,
      eventType: "PERMISSION_DENIED",
      metadata: { reason: authorization.reason },
    });

    await logGatewayRequest(platform, request, {
      statusCode: 403,
      responseTimeMs: Date.now() - start,
      routeId: matched.routeId,
      errorMessage: authorization.reason,
      authMethod,
    });

    return {
      allowed: false,
      statusCode: 403,
      responseTimeMs: Date.now() - start,
      error: authorization.reason,
    };
  }

  const rateLimitPolicy = await prisma.apiRateLimitPolicy.findFirst({
    where: {
      businessId: platform.business.id,
      scope: "BUSINESS",
      scopeIdentifier: platform.business.id,
      isActive: true,
    },
  });

  if (rateLimitPolicy) {
    const currentCount = await getRecentRequestCount(
      platform.business.id,
      "BUSINESS",
      platform.business.id,
    );

    const rateCheck = checkRateLimit({
      scope: "BUSINESS",
      scopeIdentifier: platform.business.id,
      requestsPerMinute: rateLimitPolicy.requestsPerMinute,
      burstLimit: rateLimitPolicy.burstLimit,
      currentCount,
    });

    if (!rateCheck.allowed) {
      await logGatewayAudit({
        businessId: platform.business.id,
        userId: platform.user.id,
        routeKey: matched.routeKey,
        eventType: "RATE_LIMIT_VIOLATION",
      });

      return {
        allowed: false,
        statusCode: 429,
        responseTimeMs: Date.now() - start,
        error: "Rate limit exceeded",
        rateLimited: true,
      };
    }
  }

  await logGatewayAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    routeKey: matched.routeKey,
    eventType: "AUTH_SUCCESS",
    metadata: { authMethod },
  });

  await logGatewayAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    routeKey: matched.routeKey,
    eventType: "VERSION_USAGE",
    metadata: { version },
  });

  const responseTimeMs = Date.now() - start;

  await logGatewayRequest(platform, request, {
    statusCode: 200,
    responseTimeMs,
    routeId: matched.routeId,
    authMethod,
    apiVersion: version,
  });

  return {
    allowed: true,
    statusCode: 200,
    route: matched,
    serviceTarget: matched.serviceTarget,
    responseTimeMs,
  };
}

async function logGatewayRequest(
  platform: BusinessContext,
  request: GatewayRequestInput,
  input: {
    statusCode: number;
    responseTimeMs: number;
    routeId?: string;
    errorMessage?: string;
    authMethod?: ApiAuthMethod;
    apiVersion?: string;
  },
): Promise<void> {
  const dbRoute = input.routeId
    ? await prisma.apiRoute.findFirst({
        where: { businessId: platform.business.id, routeKey: input.routeId },
      })
    : null;

  await prisma.apiRequestLog.create({
    data: {
      businessId: platform.business.id,
      routeId: dbRoute?.id ?? null,
      userId: platform.user.id,
      method: request.method.toUpperCase(),
      path: request.path,
      apiVersion: input.apiVersion ?? null,
      statusCode: input.statusCode,
      responseTimeMs: input.responseTimeMs,
      clientType: detectAuthMethod(request) ?? null,
      clientId: request.clientId ?? platform.user.id,
      ipAddress: request.ipAddress ?? null,
      authMethod: input.authMethod ?? null,
      errorMessage: input.errorMessage ?? null,
    },
  });

  await logGatewayAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    routeId: dbRoute?.id ?? null,
    routeKey: dbRoute?.routeKey ?? null,
    eventType: "API_CALL",
    metadata: {
      statusCode: input.statusCode,
      responseTimeMs: input.responseTimeMs,
    },
  });
}

export async function registerWebhook(
  platform: BusinessContext,
  input: RegisterWebhookInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.API_GATEWAY_MANAGE);

  const registration = await prisma.apiWebhookRegistration.create({
    data: {
      businessId: platform.business.id,
      name: input.name,
      url: input.url,
      secret: input.secret,
      events: input.events as Prisma.InputJsonValue,
      retryPolicy: (input.retryPolicy ??
        DEFAULT_WEBHOOK_RETRY_POLICY) as unknown as Prisma.InputJsonValue,
    },
  });

  await logGatewayAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "WEBHOOK_REGISTERED",
    metadata: { registrationId: registration.id, url: input.url },
  });

  return { id: registration.id };
}

export async function deliverWebhook(
  platform: BusinessContext,
  input: DeliverWebhookInput,
): Promise<{ id: string; status: string }> {
  assertPermission(platform, PERMISSION_CODES.API_GATEWAY_MANAGE);

  const registration = await prisma.apiWebhookRegistration.findFirst({
    where: { id: input.registrationId, businessId: platform.business.id, isActive: true },
  });

  if (!registration) {
    throw new Error("Webhook registration not found");
  }

  const payloadString = JSON.stringify(input.payload);
  const signature = generateWebhookSignature(payloadString, registration.secret);

  const delivery = await prisma.apiWebhookDelivery.create({
    data: {
      registrationId: registration.id,
      businessId: platform.business.id,
      eventType: input.eventType,
      payload: input.payload as Prisma.InputJsonValue,
      status: "PENDING",
    },
  });

  const verified = verifyWebhookSecret(payloadString, signature, registration.secret);
  const policy =
    (registration.retryPolicy as { maxAttempts: number; backoffMs: number }) ??
    DEFAULT_WEBHOOK_RETRY_POLICY;

  if (verified) {
    await prisma.apiWebhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "DELIVERED",
        attemptCount: 1,
        responseStatus: 200,
        deliveredAt: new Date(),
      },
    });
  } else {
    const nextRetry = resolveNextRetry(1, policy);
    await prisma.apiWebhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: nextRetry ? "RETRYING" : "DEAD_LETTER",
        attemptCount: 1,
        errorMessage: "Signature verification simulated failure",
        nextRetryAt: nextRetry,
      },
    });
  }

  await logGatewayAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "WEBHOOK_DELIVERY",
    metadata: { deliveryId: delivery.id, eventType: input.eventType },
  });

  const updated = await prisma.apiWebhookDelivery.findUnique({ where: { id: delivery.id } });
  return { id: delivery.id, status: updated?.status ?? "PENDING" };
}

export async function retryFailedWebhookDeliveries(
  platform: BusinessContext,
): Promise<{ recovered: number }> {
  assertPermission(platform, PERMISSION_CODES.API_GATEWAY_MANAGE);

  const failed = await prisma.apiWebhookDelivery.findMany({
    where: {
      businessId: platform.business.id,
      status: { in: ["FAILED", "RETRYING"] },
    },
    take: 50,
  });

  let recovered = 0;

  for (const delivery of failed) {
    const registration = await prisma.apiWebhookRegistration.findUnique({
      where: { id: delivery.registrationId },
    });

    if (!registration) {
      continue;
    }

    const policy =
      (registration.retryPolicy as { maxAttempts: number; backoffMs: number }) ??
      DEFAULT_WEBHOOK_RETRY_POLICY;

    if (shouldMoveToDeadLetter(delivery.attemptCount + 1, policy)) {
      await prisma.apiWebhookDelivery.update({
        where: { id: delivery.id },
        data: { status: "DEAD_LETTER" },
      });
      continue;
    }

    await prisma.apiWebhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "DELIVERED",
        attemptCount: delivery.attemptCount + 1,
        responseStatus: 200,
        deliveredAt: new Date(),
        nextRetryAt: null,
      },
    });

    recovered += 1;
  }

  return { recovered };
}

export async function getApiGatewayDashboard(
  businessId: string,
): Promise<ApiGatewayDashboardMetrics> {
  ensureBootstrapApiGateway();

  const [totalRoutes, activeRoutes, logs, rateLimitEvents, webhookDeliveries] = await Promise.all([
    prisma.apiRoute.count({ where: { businessId } }),
    prisma.apiRoute.count({ where: { businessId, isActive: true } }),
    prisma.apiRequestLog.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.apiGatewayAuditLog.count({
      where: { businessId, eventType: "RATE_LIMIT_VIOLATION" },
    }),
    prisma.apiWebhookDelivery.count({ where: { businessId } }),
  ]);

  const snapshot = buildMonitoringSnapshot(
    logs.map((log) => ({
      id: log.id,
      method: log.method,
      path: log.path,
      statusCode: log.statusCode,
      responseTimeMs: log.responseTimeMs,
      createdAt: log.createdAt.toISOString(),
    })),
  );

  const recentRequests = logs.filter(
    (log) => log.createdAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  ).length;

  return {
    totalRoutes,
    activeRoutes,
    totalRequests: snapshot.totalRequests,
    recentRequests,
    errorRate: snapshot.errorRate,
    successRate: snapshot.successRate,
    avgResponseTimeMs: snapshot.avgResponseTimeMs,
    rateLimitEvents,
    webhookDeliveries,
    registeredEndpoints: listApiRouteDefinitions().length,
  };
}

export async function getOpenApiRegistry(businessId: string): Promise<OpenApiRegistryEntry[]> {
  ensureBootstrapApiGateway();

  const routes = await prisma.apiRoute.findMany({
    where: { businessId, isActive: true },
    orderBy: { routeKey: "asc" },
  });

  return routes.map((route) => ({
    routeKey: route.routeKey,
    path: route.path,
    method: route.method,
    version: route.version,
    routeType: route.routeType,
    serviceTarget: route.serviceTarget,
    spec: (route.openapiSpec as Record<string, unknown> | null) ?? undefined,
  }));
}

export async function listApiRoutes(businessId: string) {
  return prisma.apiRoute.findMany({ where: { businessId }, orderBy: { routeKey: "asc" } });
}

export async function listApiRateLimitPolicies(businessId: string) {
  return prisma.apiRateLimitPolicy.findMany({ where: { businessId } });
}

export async function listApiRequestLogs(businessId: string) {
  return prisma.apiRequestLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listApiWebhookRegistrations(businessId: string) {
  return prisma.apiWebhookRegistration.findMany({ where: { businessId } });
}

export async function listApiWebhookDeliveries(businessId: string) {
  return prisma.apiWebhookDelivery.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listApiGatewayAuditLogs(businessId: string) {
  return prisma.apiGatewayAuditLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listRegisteredApiRoutes() {
  ensureBootstrapApiGateway();
  return listApiRouteDefinitions();
}

export { verifyWebhookSecret, generateWebhookSignature };
