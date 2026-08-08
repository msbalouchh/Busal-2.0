import type { PosPlatformContext } from "@/modules/pos/types/pos-platform";

export interface PosPlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId: string;
  branchId: string;
  userId?: string;
  registerId?: string;
  terminalId?: string;
  shiftId?: string;
}

export function buildPosPlatformContext(input: PosPlatformInput): PosPlatformContext {
  return {
    tenantId: input.tenantId ?? input.businessId,
    workspaceId: input.workspaceId ?? input.businessId,
    businessId: input.businessId,
    branchId: input.branchId,
    userId: input.userId ?? "system",
    registerId: input.registerId ?? `${input.branchId}-register-main`,
    terminalId: input.terminalId ?? `${input.branchId}-terminal-main`,
    shiftId: input.shiftId ?? `${input.branchId}-shift-active`,
  };
}
