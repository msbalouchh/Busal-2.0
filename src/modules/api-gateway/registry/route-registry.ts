import type { RegisteredApiRouteDefinition } from "@/modules/api-gateway/types/api-gateway-types";

const registry = new Map<string, RegisteredApiRouteDefinition>();

export function registerApiRouteDefinition(definition: RegisteredApiRouteDefinition): void {
  const key = `${definition.method}:${definition.path}:${definition.version ?? "v1"}`;
  registry.set(key, definition);
  registry.set(definition.routeKey, definition);
}

export function getApiRouteDefinition(routeKey: string): RegisteredApiRouteDefinition | undefined {
  return registry.get(routeKey);
}

export function listApiRouteDefinitions(): RegisteredApiRouteDefinition[] {
  const seen = new Set<string>();
  const results: RegisteredApiRouteDefinition[] = [];

  for (const definition of registry.values()) {
    if (seen.has(definition.routeKey)) {
      continue;
    }

    seen.add(definition.routeKey);
    results.push(definition);
  }

  return results;
}

export function isApiRouteRegistered(routeKey: string): boolean {
  return registry.has(routeKey);
}

export function clearApiRouteRegistry(): void {
  registry.clear();
}
