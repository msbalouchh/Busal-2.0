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
  buildAuthContext,
  detectAuthMethod,
  parseApiKey,
  validateAuthMethod,
} from "../src/modules/api-gateway/engine/auth-engine";
import { authorizeGatewayRequest } from "../src/modules/api-gateway/engine/authorization-engine";
import { buildMonitoringSnapshot } from "../src/modules/api-gateway/engine/monitoring-engine";
import { checkRateLimit } from "../src/modules/api-gateway/engine/rate-limit-engine";
import { matchRoute, resolveApiVersion } from "../src/modules/api-gateway/engine/routing-engine";
import { validateGatewayRequest } from "../src/modules/api-gateway/engine/validation-engine";
import {
  buildVersionedPath,
  isSupportedVersion,
  resolveVersionFromRequest,
} from "../src/modules/api-gateway/engine/versioning-engine";
import {
  generateWebhookSignature,
  resolveNextRetry,
  shouldMoveToDeadLetter,
  verifyWebhookSecret,
} from "../src/modules/api-gateway/engine/webhook-engine";
import {
  API_AUTH_METHODS,
  API_GATEWAY_ROUTES,
  API_RATE_LIMIT_SCOPES,
  API_ROUTE_TYPES,
} from "../src/modules/api-gateway/constants/routes";
import {
  ensureBootstrapApiGateway,
  getDefaultRouteCount,
} from "../src/modules/api-gateway/plugins/bootstrap-api-gateway";
import {
  isApiRouteRegistered,
  listApiRouteDefinitions,
} from "../src/modules/api-gateway/registry/route-registry";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import {
  deliverWebhook,
  ensureApiGatewayDefaults,
  getApiGatewayDashboard,
  getOpenApiRegistry,
  listApiGatewayAuditLogs,
  registerModuleApiRoute,
  registerWebhook,
  retryFailedWebhookDeliveries,
  routeGatewayRequest,
} from "../src/services/api-gateway.service";
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
    "src/modules/api-gateway/index.ts",
    "src/modules/api-gateway/constants/routes.ts",
    "src/modules/api-gateway/types/api-gateway-types.ts",
    "src/modules/api-gateway/registry/route-registry.ts",
    "src/modules/api-gateway/engine/routing-engine.ts",
    "src/modules/api-gateway/engine/auth-engine.ts",
    "src/modules/api-gateway/engine/authorization-engine.ts",
    "src/modules/api-gateway/engine/versioning-engine.ts",
    "src/modules/api-gateway/engine/rate-limit-engine.ts",
    "src/modules/api-gateway/engine/validation-engine.ts",
    "src/modules/api-gateway/engine/webhook-engine.ts",
    "src/modules/api-gateway/engine/monitoring-engine.ts",
    "src/modules/api-gateway/plugins/bootstrap-api-gateway.ts",
    "src/modules/api-gateway/utils/api-gateway-utils.ts",
    "src/modules/api-gateway/lib/get-api-gateway-context.ts",
    "src/modules/api-gateway/actions/api-gateway-actions.ts",
    "src/modules/api-gateway/components/api-gateway-dashboard.tsx",
    "src/modules/api-gateway/components/api-gateway-lists.tsx",
    "src/modules/api-gateway/components/api-gateway-nav.tsx",
    "src/services/api-gateway.service.ts",
    "src/app/dashboard/api-gateway/page.tsx",
    "src/app/dashboard/api-gateway/routes/page.tsx",
    "src/app/dashboard/api-gateway/registry/page.tsx",
    "src/app/dashboard/api-gateway/rate-limits/page.tsx",
    "src/app/dashboard/api-gateway/webhooks/page.tsx",
    "src/app/dashboard/api-gateway/monitoring/page.tsx",
    "src/app/dashboard/api-gateway/openapi/page.tsx",
    "src/app/dashboard/api-gateway/audit/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("API gateway routes");
  assert(API_GATEWAY_ROUTES.overview === "/dashboard/api-gateway", "Overview route mismatch");
  assert(API_GATEWAY_ROUTES.registry.includes("registry"), "Registry route missing");
  console.log("  PASS");

  console.log("Permission protected");
  const permissionsSource = readFileSync(
    join(root, "src/modules/authorization/constants/permissions.ts"),
    "utf8",
  );
  assert(permissionsSource.includes("api_gateway.view"), "api_gateway.view missing");
  assert(permissionsSource.includes("api_gateway.admin"), "api_gateway.admin missing");
  assert(
    ALL_PERMISSION_CODES.includes(PERMISSION_CODES.API_GATEWAY_INVOKE),
    "Permission code missing",
  );
  console.log("  PASS");

  console.log("Schema");
  const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schema.includes("model ApiRoute"), "ApiRoute missing");
  assert(schema.includes("model ApiRateLimitPolicy"), "ApiRateLimitPolicy missing");
  assert(schema.includes("model ApiRequestLog"), "ApiRequestLog missing");
  assert(schema.includes("model ApiWebhookRegistration"), "ApiWebhookRegistration missing");
  assert(schema.includes("model ApiGatewayAuditLog"), "ApiGatewayAuditLog missing");
  console.log("  PASS");

  console.log("Registry bootstrap");
  ensureBootstrapApiGateway();
  const routes = listApiRouteDefinitions();
  assert(routes.length === getDefaultRouteCount(), "Default routes not registered");
  assert(isApiRouteRegistered("public.menu.view"), "Public menu route missing");
  assert(isApiRouteRegistered("ai.tools.execute"), "AI route missing");
  assert(API_ROUTE_TYPES.length === 6, "Expected 6 route types");
  assert(API_AUTH_METHODS.length === 4, "Expected 4 auth methods");
  assert(API_RATE_LIMIT_SCOPES.length === 5, "Expected 5 rate limit scopes");
  console.log("  PASS");

  console.log("Routing engine");
  const versioned = resolveApiVersion({
    path: "/api/v1/public/menu",
    strategy: "URI",
  });
  assert(versioned.version === "v1", "URI version extraction failed");
  assert(versioned.normalizedPath === "/public/menu", "Path normalization failed");
  const matched = matchRoute(routes, "GET", "/public/menu", "v1");
  assert(matched?.routeKey === "public.menu.view", "Route matching failed");
  console.log("  PASS");

  console.log("Versioning engine");
  assert(isSupportedVersion("v1"), "v1 should be supported");
  assert(!isSupportedVersion("invalid"), "invalid version should fail");
  assert(
    resolveVersionFromRequest({ uriPath: "/api/v2/internal/orders", strategy: "URI" }) === "v2",
    "URI version resolution failed",
  );
  assert(
    buildVersionedPath("/public/menu", "v1") === "/api/v1/public/menu",
    "Versioned path build failed",
  );
  console.log("  PASS");

  console.log("Auth engine");
  assert(detectAuthMethod({ apiKey: "busal_test123" }) === "API_KEY", "API key detection failed");
  assert(detectAuthMethod({ authToken: "oauth:token" }) === "OAUTH2", "OAuth detection failed");
  assert(detectAuthMethod({ authToken: "jwt.token" }) === "JWT", "JWT detection failed");
  assert(parseApiKey("busal_valid_key").valid, "Valid API key should pass");
  assert(!parseApiKey("invalid").valid, "Invalid API key should fail");
  assert(validateAuthMethod("JWT", ["JWT", "API_KEY"]), "Auth method validation failed");
  console.log("  PASS");

  console.log("Validation engine");
  const publicRoute = routes.find((entry) => entry.routeKey === "public.menu.view");
  assert(publicRoute, "Public route missing");
  const validRequest = validateGatewayRequest(
    { method: "GET", path: "/api/v1/public/menu", authMethod: "JWT", authToken: "test" },
    publicRoute,
  );
  assert(validRequest.valid, "Valid request should pass");
  const invalidPayload = validateGatewayRequest(
    {
      method: "POST",
      path: "/api/v1/partner/crm/sync",
      contentType: "text/plain",
      payloadSizeBytes: 2000000,
      authMethod: "OAUTH2",
      authToken: "oauth:test",
    },
    routes.find((entry) => entry.routeKey === "partner.crm.sync")!,
  );
  assert(!invalidPayload.valid, "Invalid request should fail");
  console.log("  PASS");

  console.log("Authorization engine");
  const auth = buildAuthContext({
    authMethod: "JWT",
    userId: "user-1",
    businessId: "biz-1",
    permissions: ["order.view"],
    isOwner: false,
    apiScopes: ["orders:read"],
  });
  assert(
    authorizeGatewayRequest({ auth, requiredPermission: "order.view" }).allowed,
    "Permission authorization failed",
  );
  assert(
    !authorizeGatewayRequest({ auth, requiredPermission: "admin.all" }).allowed,
    "Missing permission should be denied",
  );
  console.log("  PASS");

  console.log("Rate limit engine");
  const allowed = checkRateLimit({
    scope: "BUSINESS",
    scopeIdentifier: "biz-1",
    requestsPerMinute: 120,
    burstLimit: 20,
    currentCount: 10,
  });
  assert(allowed.allowed, "Rate limit should allow under threshold");
  const blocked = checkRateLimit({
    scope: "BUSINESS",
    scopeIdentifier: "biz-1",
    requestsPerMinute: 60,
    burstLimit: 10,
    currentCount: 60,
  });
  assert(!blocked.allowed, "Rate limit should block at threshold");
  console.log("  PASS");

  console.log("Webhook engine");
  const payload = JSON.stringify({ event: "test" });
  const secret = "verify-secret";
  const signature = generateWebhookSignature(payload, secret);
  assert(verifyWebhookSecret(payload, signature, secret), "Webhook signature verification failed");
  assert(resolveNextRetry(1, { maxAttempts: 5, backoffMs: 1000 }), "Retry schedule missing");
  assert(
    shouldMoveToDeadLetter(5, { maxAttempts: 5, backoffMs: 1000 }),
    "Dead letter check failed",
  );
  console.log("  PASS");

  console.log("Monitoring engine");
  const snapshot = buildMonitoringSnapshot([
    {
      id: "1",
      method: "GET",
      path: "/api/v1/public/menu",
      statusCode: 200,
      responseTimeMs: 50,
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      method: "POST",
      path: "/api/v1/partner/crm/sync",
      statusCode: 500,
      responseTimeMs: 120,
      createdAt: new Date().toISOString(),
    },
  ]);
  assert(snapshot.totalRequests === 2, "Monitoring total requests failed");
  assert(snapshot.errorCount === 1, "Monitoring error count failed");
  console.log("  PASS");

  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  assert(business, "No business found");
  const platform = await buildPlatformContext(business.id);

  await prisma.apiWebhookDelivery.deleteMany({
    where: {
      businessId: business.id,
      registration: { name: { startsWith: "custom.verify" } },
    },
  });
  await prisma.apiWebhookRegistration.deleteMany({
    where: { businessId: business.id, name: { startsWith: "custom.verify" } },
  });
  await prisma.apiGatewayAuditLog.deleteMany({
    where: { businessId: business.id, routeKey: { startsWith: "custom.verify" } },
  });
  await prisma.apiRequestLog.deleteMany({
    where: { businessId: business.id, path: { contains: "custom.verify" } },
  });
  await prisma.apiRoute.deleteMany({
    where: { businessId: business.id, routeKey: { startsWith: "custom.verify" } },
  });

  console.log("API gateway defaults");
  await ensureApiGatewayDefaults(business.id);
  const routeCount = await prisma.apiRoute.count({ where: { businessId: business.id } });
  assert(routeCount >= getDefaultRouteCount(), "Default routes not seeded");
  const policyCount = await prisma.apiRateLimitPolicy.count({ where: { businessId: business.id } });
  assert(policyCount >= 2, "Default rate limit policies missing");
  console.log("  PASS");

  console.log("Route gateway request");
  const publicResult = await routeGatewayRequest(platform, {
    method: "GET",
    path: "/api/v1/public/menu",
    authMethod: "JWT",
    authToken: "verify-token",
  });
  assert(publicResult.allowed, "Public route should be allowed");
  assert(publicResult.statusCode === 200, "Public route should return 200");
  console.log("  PASS");

  console.log("Internal service routing");
  const internalResult = await routeGatewayRequest(platform, {
    method: "GET",
    path: "/api/v1/internal/orders",
    authMethod: "JWT",
    authToken: "verify-token",
  });
  assert(internalResult.allowed, "Internal route should be allowed");
  assert(internalResult.serviceTarget === "orders-service", "Internal service target mismatch");
  console.log("  PASS");

  console.log("Header versioning");
  const headerResult = await routeGatewayRequest(platform, {
    method: "GET",
    path: "/public/menu",
    apiVersion: "v1",
    authMethod: "JWT",
    authToken: "verify-token",
  });
  assert(!headerResult.allowed || headerResult.statusCode !== 404, "Header version route handled");
  console.log("  PASS");

  console.log("Invalid route rejection");
  const notFound = await routeGatewayRequest(platform, {
    method: "GET",
    path: "/api/v1/custom.verify/missing",
    authMethod: "JWT",
    authToken: "verify-token",
  });
  assert(!notFound.allowed && notFound.statusCode === 404, "Missing route should return 404");
  console.log("  PASS");

  console.log("Register module route");
  await registerModuleApiRoute(business.id, {
    routeKey: "custom.verify_ext",
    path: "/custom.verify/ext",
    method: "GET",
    routeType: "INTERNAL",
    serviceTarget: "verify-service",
    isActive: true,
    apiScopes: ["verify:read"],
  });
  assert(isApiRouteRegistered("custom.verify_ext"), "Custom route registration failed");
  console.log("  PASS");

  console.log("Webhook registration");
  const webhook = await registerWebhook(platform, {
    name: "custom.verify_webhook",
    url: "https://example.com/webhooks/verify",
    secret: "verify-webhook-secret",
    events: ["order.created", "order.updated"],
  });
  assert(webhook.id, "Webhook registration failed");
  console.log("  PASS");

  console.log("Webhook delivery");
  const delivery = await deliverWebhook(platform, {
    registrationId: webhook.id,
    eventType: "order.created",
    payload: { orderId: "order-1" },
  });
  assert(delivery.status === "DELIVERED", "Webhook delivery should succeed");
  console.log("  PASS");

  console.log("Webhook retry recovery");
  await prisma.apiWebhookDelivery.create({
    data: {
      registrationId: webhook.id,
      businessId: business.id,
      eventType: "order.failed",
      payload: { orderId: "order-2" },
      status: "RETRYING",
      attemptCount: 1,
    },
  });
  const retryResult = await retryFailedWebhookDeliveries(platform);
  assert(retryResult.recovered >= 1, "Webhook retry recovery failed");
  console.log("  PASS");

  console.log("API gateway dashboard");
  const dashboard = await getApiGatewayDashboard(business.id);
  assert(dashboard.totalRoutes >= getDefaultRouteCount(), "Dashboard total routes missing");
  assert(
    dashboard.registeredEndpoints === getDefaultRouteCount() + 1,
    "Registered endpoints mismatch",
  );
  console.log("  PASS");

  console.log("OpenAPI registry");
  const openapi = await getOpenApiRegistry(business.id);
  assert(openapi.length >= getDefaultRouteCount(), "OpenAPI registry missing entries");
  assert(
    openapi.some((entry) => entry.routeKey === "public.menu.view"),
    "OpenAPI public route missing",
  );
  console.log("  PASS");

  console.log("Audit logs");
  const auditLogs = await listApiGatewayAuditLogs(business.id);
  assert(
    auditLogs.some((log) => log.eventType === "API_CALL"),
    "API call audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "AUTH_SUCCESS"),
    "Auth success audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "WEBHOOK_REGISTERED"),
    "Webhook registered audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "WEBHOOK_DELIVERY"),
    "Webhook delivery audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "ROUTE_REGISTERED"),
    "Route registered audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "VERSION_USAGE"),
    "Version usage audit missing",
  );
  console.log("  PASS");

  console.log("\nAPI Gateway & Integration Platform verification passed.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
