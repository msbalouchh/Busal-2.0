import type { RegisteredTenantPolicyDefinition } from "@/modules/tenant-platform/types/tenant-platform-types";

const registry = new Map<string, RegisteredTenantPolicyDefinition>();

export function registerTenantPolicyDefinition(definition: RegisteredTenantPolicyDefinition): void {
  registry.set(definition.policyKey, definition);
}

export function getTenantPolicyDefinition(
  policyKey: string,
): RegisteredTenantPolicyDefinition | undefined {
  return registry.get(policyKey);
}

export function listTenantPolicyDefinitions(): RegisteredTenantPolicyDefinition[] {
  return Array.from(registry.values());
}

export function isTenantPolicyRegistered(policyKey: string): boolean {
  return registry.has(policyKey);
}

export function clearTenantPolicyRegistry(): void {
  registry.clear();
}
