import type { RegisteredFeatureDefinition } from "@/modules/feature-flags/types/feature-flags-types";

const registry = new Map<string, RegisteredFeatureDefinition>();

export function registerFeatureDefinition(definition: RegisteredFeatureDefinition): void {
  registry.set(definition.key, definition);
}

export function getFeatureDefinition(key: string): RegisteredFeatureDefinition | undefined {
  return registry.get(key);
}

export function listFeatureDefinitions(): RegisteredFeatureDefinition[] {
  return Array.from(registry.values());
}

export function isFeatureRegistered(key: string): boolean {
  return registry.has(key);
}

export function clearFeatureRegistry(): void {
  registry.clear();
}
