import { registerApiRouteDefinition } from "@/modules/api-gateway/registry/route-registry";
import type { RegisteredApiRouteDefinition } from "@/modules/api-gateway/types/api-gateway-types";

const DEFAULT_ROUTES: Omit<RegisteredApiRouteDefinition, "isActive">[] = [
  {
    routeKey: "v1.businesses.read",
    path: "/businesses",
    method: "GET",
    routeType: "PARTNER",
    serviceTarget: "platform-service",
    authMethods: ["API_KEY"],
    apiScopes: ["business:read"],
    version: "v1",
  },
  {
    routeKey: "v1.customers.list",
    path: "/customers",
    method: "GET",
    routeType: "PARTNER",
    serviceTarget: "crm-service",
    authMethods: ["API_KEY"],
    apiScopes: ["customers:read"],
    version: "v1",
  },
  {
    routeKey: "v1.customers.create",
    path: "/customers",
    method: "POST",
    routeType: "PARTNER",
    serviceTarget: "crm-service",
    authMethods: ["API_KEY"],
    apiScopes: ["customers:write"],
    version: "v1",
  },
  {
    routeKey: "v1.orders.list",
    path: "/orders",
    method: "GET",
    routeType: "PARTNER",
    serviceTarget: "orders-service",
    authMethods: ["API_KEY"],
    apiScopes: ["orders:read"],
    version: "v1",
  },
  {
    routeKey: "v1.orders.create",
    path: "/orders",
    method: "POST",
    routeType: "PARTNER",
    serviceTarget: "orders-service",
    authMethods: ["API_KEY"],
    apiScopes: ["orders:write"],
    version: "v1",
  },
  {
    routeKey: "v1.menu.list",
    path: "/menu",
    method: "GET",
    routeType: "PARTNER",
    serviceTarget: "menu-service",
    authMethods: ["API_KEY"],
    apiScopes: ["menu:read"],
    version: "v1",
  },
  {
    routeKey: "v1.reservations.list",
    path: "/reservations",
    method: "GET",
    routeType: "PARTNER",
    serviceTarget: "reservations-service",
    authMethods: ["API_KEY"],
    apiScopes: ["reservations:read"],
    version: "v1",
  },
  {
    routeKey: "v1.staff.list",
    path: "/staff",
    method: "GET",
    routeType: "PARTNER",
    serviceTarget: "staff-service",
    authMethods: ["API_KEY"],
    apiScopes: ["staff:read"],
    version: "v1",
  },
  {
    routeKey: "v1.inventory.list",
    path: "/inventory",
    method: "GET",
    routeType: "PARTNER",
    serviceTarget: "inventory-service",
    authMethods: ["API_KEY"],
    apiScopes: ["inventory:read"],
    version: "v1",
  },
  {
    routeKey: "v1.payments.list",
    path: "/payments",
    method: "GET",
    routeType: "PARTNER",
    serviceTarget: "finance-service",
    authMethods: ["API_KEY"],
    apiScopes: ["orders:read"],
    version: "v1",
  },
  {
    routeKey: "v1.analytics.read",
    path: "/analytics",
    method: "GET",
    routeType: "PARTNER",
    serviceTarget: "analytics-service",
    authMethods: ["API_KEY"],
    apiScopes: ["analytics:read"],
    version: "v1",
  },
  {
    routeKey: "internal.orders.list",
    path: "/internal/orders",
    method: "GET",
    routeType: "INTERNAL",
    serviceTarget: "orders-service",
    requiredPermission: "order.view",
    apiScopes: ["orders:read"],
  },
  {
    routeKey: "public.menu.view",
    path: "/public/menu",
    method: "GET",
    routeType: "PUBLIC",
    serviceTarget: "menu-service",
    authMethods: ["JWT", "API_KEY"],
    apiScopes: ["menu:read"],
  },
  {
    routeKey: "partner.crm.sync",
    path: "/partner/crm/sync",
    method: "POST",
    routeType: "PARTNER",
    serviceTarget: "crm-service",
    requiredPermission: "crm.manage",
    authMethods: ["OAUTH2", "API_KEY"],
    apiScopes: ["crm:write"],
  },
  {
    routeKey: "marketplace.assets.list",
    path: "/marketplace/assets",
    method: "GET",
    routeType: "MARKETPLACE",
    serviceTarget: "marketplace-service",
    requiredPermission: "marketplace.view",
    apiScopes: ["marketplace:read"],
  },
  {
    routeKey: "ai.tools.execute",
    path: "/ai/tools/execute",
    method: "POST",
    routeType: "AI",
    serviceTarget: "ai-service",
    requiredPermission: "ai.tool.execute",
    authMethods: ["JWT", "SERVICE_ACCOUNT"],
    apiScopes: ["ai:execute"],
  },
  {
    routeKey: "webhooks.inbound",
    path: "/webhooks/inbound",
    method: "POST",
    routeType: "WEBHOOK",
    serviceTarget: "webhook-service",
    authMethods: ["API_KEY"],
    apiScopes: ["webhooks:receive"],
  },
];

let bootstrapped = false;

export function ensureBootstrapApiGateway(): void {
  if (bootstrapped) {
    return;
  }

  for (const route of DEFAULT_ROUTES) {
    registerApiRouteDefinition({
      ...route,
      isActive: true,
      openapiSpec: {
        summary: route.routeKey,
        tags: [route.routeType.toLowerCase()],
      },
    });
  }

  bootstrapped = true;
}

export function resetBootstrapApiGateway(): void {
  bootstrapped = false;
}

export function getDefaultRouteCount(): number {
  return DEFAULT_ROUTES.length;
}

export const DEFAULT_REGISTERED_ROUTES = DEFAULT_ROUTES;
