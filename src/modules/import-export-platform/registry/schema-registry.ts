import type { RegisteredImportExportSchemaDefinition } from "@/modules/import-export-platform/types/import-export-platform-types";

const registry = new Map<string, RegisteredImportExportSchemaDefinition>();

export function registerImportExportSchemaDefinition(
  definition: RegisteredImportExportSchemaDefinition,
): void {
  registry.set(definition.schemaKey, definition);
}

export function getImportExportSchemaDefinition(
  schemaKey: string,
): RegisteredImportExportSchemaDefinition | undefined {
  return registry.get(schemaKey);
}

export function listImportExportSchemaDefinitions(): RegisteredImportExportSchemaDefinition[] {
  return Array.from(registry.values());
}

export function isImportExportSchemaRegistered(schemaKey: string): boolean {
  return registry.has(schemaKey);
}

export function clearImportExportSchemaRegistry(): void {
  registry.clear();
}
