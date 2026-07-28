import { registerApiRouteDefinition } from "@/modules/api-gateway/registry/route-registry";
import type { RegisteredApiRouteDefinition } from "@/modules/api-gateway/types/api-gateway-types";

const DEFAULT_ROUTES: Omit<RegisteredApiRouteDefinition, "isActive">[] = [
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
