import type { TenantSelection } from "@/modules/tenant/types/entities";

/**
 * Mock tenant isolation guard.
 * Future: enforce via Prisma middleware + Supabase RLS.
 */
export function assertSameTenant(expectedTenantId: string, actualTenantId: string): void {
  if (expectedTenantId !== actualTenantId) {
    throw new Error(
      `[tenant] Isolation violation: expected tenant ${expectedTenantId}, received ${actualTenantId}`,
    );
  }
}

export function assertSelectionIntegrity(selection: TenantSelection): void {
  const values = [
    selection.tenantId,
    selection.organizationId,
    selection.workspaceId,
    selection.businessId,
    selection.branchId,
  ];

  if (values.some((value) => value.trim().length === 0)) {
    throw new Error("[tenant] Incomplete tenant selection");
  }
}
