import type { RegisteredTranslationKeyDefinition } from "@/modules/localization-platform/types/localization-platform-types";

const registry = new Map<string, RegisteredTranslationKeyDefinition>();

export function registerTranslationKeyDefinition(
  definition: RegisteredTranslationKeyDefinition,
): void {
  registry.set(definition.key, definition);
}

export function getTranslationKeyDefinition(
  key: string,
): RegisteredTranslationKeyDefinition | undefined {
  return registry.get(key);
}

export function listTranslationKeyDefinitions(): RegisteredTranslationKeyDefinition[] {
  return Array.from(registry.values());
}

export function isTranslationKeyRegistered(key: string): boolean {
  return registry.has(key);
}

export function clearTranslationKeyRegistry(): void {
  registry.clear();
}
