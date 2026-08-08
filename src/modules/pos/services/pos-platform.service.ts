import "server-only";

import { POS_ORDER_STATUSES } from "@/modules/pos/constants/pos-status";
import { buildPosPlatformContext } from "@/modules/pos/lib/pos-platform-context";
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
  businessId: string;
  branchId: string;
  userId?: string;
  registerId?: string;
  terminalId?: string;
  shiftId?: string;
}

function countByStatus(records: PosRecord[], status: string): number {
  return records.filter((record) => record.order.status === status).length;
}

export async function buildPosPlatformSnapshot(input: PosPlatformInput): Promise<PosPlatformSnapshot> {
  const context = buildPosPlatformContext(input);
  const scope = {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
    registerId: context.registerId,
    terminalId: context.terminalId,
    shiftId: context.shiftId,
  };

  const [records, shifts] = await Promise.all([
    posRepository.listRecords(scope),
    posRepository.listShifts(scope),
  ]);

  const paidRecords = records.filter((record) => record.order.status === POS_ORDER_STATUSES.PAID);
  const salesSum = paidRecords.reduce((sum, record) => sum + record.order.totalCents, 0);
  const refundSum = records.reduce(
    (sum, record) => sum + record.refunds.reduce((refundTotal, refund) => refundTotal + refund.amountCents, 0),
    0,
  );

  const shift = shifts.find((entry) => entry.id === context.shiftId);

  return {
    context,
    records,
    orderCount: records.length,
    openCount: countByStatus(records, POS_ORDER_STATUSES.OPEN),
    paidCount: countByStatus(records, POS_ORDER_STATUSES.PAID),
    heldCount: countByStatus(records, POS_ORDER_STATUSES.HELD),
    refundedCount: records.filter((record) => record.refunds.length > 0).length,
    totalSalesCents: salesSum,
    totalRefundsCents: refundSum,
    avgTicketCents: paidRecords.length > 0 ? Math.round(salesSum / paidRecords.length) : 0,
    activeShiftOpen: shift?.status === "open",
  };
}

export async function getOpenPosOrders(input: PosPlatformInput, limit = 10): Promise<PosRecord[]> {
  const snapshot = await buildPosPlatformSnapshot(input);
  return snapshot.records
    .filter((record) => record.order.status === POS_ORDER_STATUSES.OPEN)
    .slice(0, limit);
}

export async function getHeldPosOrders(input: PosPlatformInput): Promise<PosRecord[]> {
  const snapshot = await buildPosPlatformSnapshot(input);
  return snapshot.records.filter((record) => record.order.status === POS_ORDER_STATUSES.HELD);
}

export { buildPosPlatformContext };
