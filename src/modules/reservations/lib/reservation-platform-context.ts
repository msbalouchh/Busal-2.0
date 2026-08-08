import type { ReservationPlatformContext } from "@/modules/reservations/types/reservations";

export interface ReservationPlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId: string;
  branchId: string;
  userId?: string;
}

export function buildReservationPlatformContext(
  input: ReservationPlatformInput,
): ReservationPlatformContext {
  return {
    tenantId: input.tenantId ?? input.businessId,
    workspaceId: input.workspaceId ?? input.businessId,
    businessId: input.businessId,
    branchId: input.branchId,
    userId: input.userId ?? "system",
  };
}
