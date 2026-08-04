import { POS_ORDER_STATUSES } from "@/modules/pos/constants/pos-status";
import { DEFAULT_POS_SCOPE } from "@/modules/pos/constants/mock-data";
import { posRepository } from "@/modules/pos/repository/pos-repository";
import type { PosPlatformContext, PosRecord } from "@/modules/pos/types/pos-platform";

export interface PosPlatformSnapshot {
  context: PosPlatformContext;
  records: PosRecord[];
  orderCount: number;
  openCount: number;
  paidCount: number;
  heldCount: number;
  refundedCount: number;
  totalSalesCents: number;
  totalRefundsCents: number;
  avgTicketCents: number;
  activeShiftOpen: boolean;
}

export interface PosPlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId?: string;
  branchId?: string;
  userId?: string;
  registerId?: string;
  terminalId?: string;
  shiftId?: string;
}

export function buildPosPlatformContext(input: PosPlatformInput = {}): PosPlatformContext {
  return {
    tenantId: input.tenantId ?? DEFAULT_POS_SCOPE.tenantId,
    workspaceId: input.workspaceId ?? DEFAULT_POS_SCOPE.workspaceId,
    businessId: input.businessId ?? DEFAULT_POS_SCOPE.businessId,
    branchId: input.branchId ?? DEFAULT_POS_SCOPE.branchId,
    userId: input.userId ?? DEFAULT_POS_SCOPE.userId,
    registerId: input.registerId ?? DEFAULT_POS_SCOPE.registerId,
    terminalId: input.terminalId ?? DEFAULT_POS_SCOPE.terminalId,
    shiftId: input.shiftId ?? DEFAULT_POS_SCOPE.shiftId,
  };
}

export function buildPosPlatformSnapshot(input: PosPlatformInput = {}): PosPlatformSnapshot {
  const context = buildPosPlatformContext(input);
  const records = posRepository
    .listRecords()
    .filter(
      (record) =>
        record.order.tenantId === context.tenantId &&
        record.order.businessId === context.businessId,
    );

  const countByStatus = (status: string) =>
    records.filter((record) => record.order.status === status).length;

  const paidRecords = records.filter((r) => r.order.status === POS_ORDER_STATUSES.PAID);
  const salesSum = paidRecords.reduce((sum, r) => sum + r.order.totalCents, 0);
  const refundSum = records.reduce(
    (sum, r) => sum + r.refunds.reduce((rs, ref) => rs + ref.amountCents, 0),
    0,
  );

  const shift = posRepository.listShifts().find((s) => s.id === context.shiftId);

  return {
    context,
    records,
    orderCount: records.length,
    openCount: countByStatus(POS_ORDER_STATUSES.OPEN),
    paidCount: countByStatus(POS_ORDER_STATUSES.PAID),
    heldCount: countByStatus(POS_ORDER_STATUSES.HELD),
    refundedCount: records.filter((r) => r.refunds.length > 0).length,
    totalSalesCents: salesSum,
    totalRefundsCents: refundSum,
    avgTicketCents: paidRecords.length > 0 ? Math.round(salesSum / paidRecords.length) : 0,
    activeShiftOpen: shift?.status === "open",
  };
}

export function getDefaultPosSnapshot(): PosPlatformSnapshot {
  return buildPosPlatformSnapshot();
}

export function getOpenPosOrders(limit = 10): PosRecord[] {
  return posRepository.search({ status: POS_ORDER_STATUSES.OPEN, limit });
}

export function getHeldPosOrders(): PosRecord[] {
  return posRepository.search({ status: POS_ORDER_STATUSES.HELD });
}
