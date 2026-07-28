import type { ApiVersionStrategy } from "@prisma/client";

import type {
  GatewayRouteMatch,
  RegisteredApiRouteDefinition,
} from "@/modules/api-gateway/types/api-gateway-types";

export function normalizePath(path: string): string {
  return path.replace(/\/+$/, "") || "/";
}

export function resolveApiVersion(input: {
  path: string;
  headerVersion?: string | null;
  strategy: ApiVersionStrategy;
}): { version: string; normalizedPath: string } {
  if (input.strategy === "HEADER" && input.headerVersion) {
    return { version: input.headerVersion, normalizedPath: normalizePath(input.path) };
  }

  const match = input.path.match(/^\/api\/(v\d+)(\/.*)?$/);
  if (match) {
    return {
      version: match[1]!,
      normalizedPath: normalizePath(match[2] ?? "/"),
    };
  }

  return { version: input.headerVersion ?? "v1", normalizedPath: normalizePath(input.path) };
}

export function matchRoute(
  routes: RegisteredApiRouteDefinition[],
  method: string,
  path: string,
  version: string,
): GatewayRouteMatch | null {
  const normalizedPath = normalizePath(path);
  const normalizedMethod = method.toUpperCase();

  const route = routes.find(
    (entry) =>
      entry.isActive &&
      entry.method.toUpperCase() === normalizedMethod &&
      normalizePath(entry.path) === normalizedPath &&
      (entry.version ?? "v1") === version,
  );

  if (!route) {
    return null;
  }

  return {
    routeId: route.routeKey,
    routeKey: route.routeKey,
    serviceTarget: route.serviceTarget,
    routeType: route.routeType,
    version,
    requiredPermission: route.requiredPermission,
    apiScopes: route.apiScopes ?? [],
  };
}

export function buildServiceTargetUrl(serviceTarget: string, path: string): string {
  return `${serviceTarget}://${normalizePath(path)}`;
}
