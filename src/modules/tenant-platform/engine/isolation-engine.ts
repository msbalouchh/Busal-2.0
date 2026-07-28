export function assertTenantIsolation(
  requestedBusinessId: string,
  contextBusinessId: string,
): boolean {
  return requestedBusinessId === contextBusinessId;
}

export function validateCrossTenantAccess(
  sourceBusinessId: string,
  targetBusinessId: string,
): { allowed: boolean; reason: string } {
  if (sourceBusinessId === targetBusinessId) {
    return { allowed: true, reason: "Same tenant scope" };
  }
  return { allowed: false, reason: "Cross-tenant access denied" };
}

export function enforceTenantScope<T extends { businessId: string }>(
  records: T[],
  businessId: string,
): T[] {
  return records.filter((record) => record.businessId === businessId);
}
