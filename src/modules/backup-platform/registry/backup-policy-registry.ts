import type { RegisteredBackupPolicyDefinition } from "@/modules/backup-platform/types/backup-platform-types";

const registry = new Map<string, RegisteredBackupPolicyDefinition>();

export function registerBackupPolicyDefinition(definition: RegisteredBackupPolicyDefinition): void {
  registry.set(definition.policyKey, definition);
}

export function getBackupPolicyDefinition(
  policyKey: string,
): RegisteredBackupPolicyDefinition | undefined {
  return registry.get(policyKey);
}

export function listBackupPolicyDefinitions(): RegisteredBackupPolicyDefinition[] {
  return Array.from(registry.values());
}

export function isBackupPolicyRegistered(policyKey: string): boolean {
  return registry.has(policyKey);
}

export function clearBackupPolicyRegistry(): void {
  registry.clear();
}
