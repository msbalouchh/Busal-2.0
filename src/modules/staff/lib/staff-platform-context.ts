import type { StaffPlatformContext } from "@/modules/staff/types/staff-platform";

export interface StaffPlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId: string;
  branchId: string;
  userId?: string;
}

export function buildStaffPlatformContext(input: StaffPlatformInput): StaffPlatformContext {
  return {
    tenantId: input.tenantId ?? input.businessId,
    workspaceId: input.workspaceId ?? input.businessId,
    businessId: input.businessId,
    branchId: input.branchId,
    userId: input.userId ?? "system",
  };
}
