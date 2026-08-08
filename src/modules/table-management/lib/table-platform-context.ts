import type { TablePlatformContext } from "@/modules/table-management/types/table-management";

export interface TablePlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId: string;
  branchId: string;
  userId?: string;
}

export function buildTablePlatformContext(input: TablePlatformInput): TablePlatformContext {
  return {
    tenantId: input.tenantId ?? input.businessId,
    workspaceId: input.workspaceId ?? input.businessId,
    businessId: input.businessId,
    branchId: input.branchId,
    userId: input.userId ?? "system",
  };
}
