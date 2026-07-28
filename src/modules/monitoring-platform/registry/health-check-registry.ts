import type { RegisteredHealthCheckDefinition } from "@/modules/monitoring-platform/types/monitoring-platform-types";

const registry = new Map<string, RegisteredHealthCheckDefinition>();

export function registerHealthCheckDefinition(definition: RegisteredHealthCheckDefinition): void {
  registry.set(definition.checkKey, definition);
}

export function getHealthCheckDefinition(
  checkKey: string,
): RegisteredHealthCheckDefinition | undefined {
  return registry.get(checkKey);
}

export function listHealthCheckDefinitions(): RegisteredHealthCheckDefinition[] {
  return Array.from(registry.values());
}

export function isHealthCheckRegistered(checkKey: string): boolean {
  return registry.has(checkKey);
}

export function clearHealthCheckRegistry(): void {
  registry.clear();
}
