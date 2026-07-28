import type { SearchEntityType } from "@prisma/client";

import type { SearchableEntityDefinition } from "@/modules/search-platform/types/search-platform-types";

const registry = new Map<SearchEntityType, SearchableEntityDefinition>();

export function registerSearchableEntity(definition: SearchableEntityDefinition): void {
  registry.set(definition.entityType, definition);
}

export function getSearchableEntity(
  entityType: SearchEntityType,
): SearchableEntityDefinition | undefined {
  return registry.get(entityType);
}

export function listSearchableEntities(): SearchableEntityDefinition[] {
  return Array.from(registry.values());
}

export function isSearchableEntityRegistered(entityType: SearchEntityType): boolean {
  return registry.has(entityType);
}

export function clearSearchRegistry(): void {
  registry.clear();
}

export function getRequiredPermissionForEntity(entityType: SearchEntityType): string | null {
  return registry.get(entityType)?.requiredPermission ?? null;
}
