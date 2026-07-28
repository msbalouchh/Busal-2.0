import type { ConfigScope } from "@prisma/client";

import type { RegisteredSettingDefinition } from "@/modules/settings-engine/types/settings-engine-types";

const registry = new Map<string, RegisteredSettingDefinition>();

export function registerSettingDefinition(definition: RegisteredSettingDefinition): void {
  registry.set(definition.key, definition);
}

export function getSettingDefinition(key: string): RegisteredSettingDefinition | undefined {
  return registry.get(key);
}

export function listSettingDefinitions(): RegisteredSettingDefinition[] {
  return Array.from(registry.values());
}

export function listSettingDefinitionsByModule(module: string): RegisteredSettingDefinition[] {
  return listSettingDefinitions().filter((definition) => definition.module === module);
}

export function listSettingDefinitionsByCategory(category: string): RegisteredSettingDefinition[] {
  return listSettingDefinitions().filter((definition) => definition.category === category);
}

export function isSettingRegistered(key: string): boolean {
  return registry.has(key);
}

export function clearSettingsRegistry(): void {
  registry.clear();
}

export function supportsScope(
  definition: RegisteredSettingDefinition,
  scope: ConfigScope,
): boolean {
  if (!definition.supportedScopes?.length) {
    return true;
  }

  return definition.supportedScopes.includes(scope);
}
