import "server-only";

import { DOMAIN_EVENT_TYPES } from "@/modules/platform-orchestration/constants/domain-events";
import {
  moduleScopeFromPlatform,
  publishModuleDomainEvent,
} from "@/modules/platform-orchestration/lib/publish-module-event";
import type { PosPlatformContext } from "@/modules/pos/types/pos-platform";
import {
  posRepository,
  type PosSearchResult,
} from "@/modules/pos/repository/pos-repository";
import type {
  ApplyPosDiscountInput,
  CreatePosSaleInput,
  MergePosBillsInput,
  PosRecord,
  PosSearchQuery,
  ProcessPosPaymentInput,
  ProcessPosRefundInput,
  SplitPosBillInput,
  TransferPosTableInput,
} from "@/modules/pos/types/pos-platform";
import type {
  ApplyPosDiscountSchemaInput,
  CashDrawerActionSchemaInput,
  ClosePosShiftSchemaInput,
  CreatePosSaleSchemaInput,
  OpenPosShiftSchemaInput,
  PosSearchSchemaInput,
  ProcessPosPaymentSchemaInput,
  ProcessPosRefundSchemaInput,
  SplitPosBillSchemaInput,
} from "@/modules/pos/validation/pos-schemas";
import type { PosTenantScope } from "@/modules/pos/lib/pos-scope";

/** Domain service for POS operations. */
export class PosService {
  async list(context: PosPlatformContext): Promise<PosRecord[]> {
    return posRepository.listRecords(this.toScope(context));
  }

  async getById(context: PosPlatformContext, orderId: string): Promise<PosRecord | null> {
    return posRepository.findById(this.toScope(context), orderId);
  }

  async search(
    query: PosSearchQuery & PosSearchSchemaInput,
    context: PosPlatformContext,
  ): Promise<PosSearchResult> {
    return posRepository.search(this.toScope(context), query);
  }

  async createSale(context: PosPlatformContext, input: CreatePosSaleInput | CreatePosSaleSchemaInput) {
    const record = await posRepository.createSale(this.toScope(context), input);
    await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
      eventType: DOMAIN_EVENT_TYPES.POS_TICKET_OPENED,
      aggregateId: record.order.id,
      payload: { orderId: record.order.id, posTicketId: record.order.id },
    });
    await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
      eventType: DOMAIN_EVENT_TYPES.ORDER_CREATED,
      aggregateId: record.order.id,
      payload: { orderId: record.order.id, source: "pos" },
    });
    return record;
  }

  async applyDiscount(context: PosPlatformContext, input: ApplyPosDiscountInput | ApplyPosDiscountSchemaInput) {
    return posRepository.applyDiscount(this.toScope(context), input);
  }

  async splitBill(context: PosPlatformContext, input: SplitPosBillInput | SplitPosBillSchemaInput) {
    return posRepository.splitBill(this.toScope(context), input);
  }

  async processPayment(context: PosPlatformContext, input: ProcessPosPaymentSchemaInput) {
    const record = await posRepository.processPayment(this.toScope(context), input);
    await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
      eventType: DOMAIN_EVENT_TYPES.PAYMENT_COMPLETED,
      aggregateId: input.orderId,
      payload: {
        orderId: input.orderId,
        amount: input.amountCents / 100,
        amountPence: input.amountCents,
        method: input.paymentType,
      },
      idempotencyKey: `payment.completed:pos:${input.orderId}:${Date.now()}`,
    });
    await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
      eventType: DOMAIN_EVENT_TYPES.POS_SALE_COMPLETED,
      aggregateId: input.orderId,
      payload: { orderId: input.orderId },
    });
    return record;
  }

  async processRefund(context: PosPlatformContext, input: ProcessPosRefundInput | ProcessPosRefundSchemaInput) {
    return posRepository.processRefund(this.toScope(context), input);
  }

  async voidOrder(context: PosPlatformContext, orderId: string, reason?: string) {
    return posRepository.voidOrder(this.toScope(context), orderId, reason);
  }

  async transferTable(context: PosPlatformContext, input: TransferPosTableInput) {
    return posRepository.transferTable(this.toScope(context), input);
  }

  async mergeBills(context: PosPlatformContext, input: MergePosBillsInput) {
    return posRepository.mergeBills(this.toScope(context), input);
  }

  async openShift(context: PosPlatformContext, input: OpenPosShiftSchemaInput) {
    return posRepository.openShift(this.toScope(context), input);
  }

  async closeShift(context: PosPlatformContext, input: ClosePosShiftSchemaInput) {
    return posRepository.closeShift(this.toScope(context), input);
  }

  async openCashDrawer(context: PosPlatformContext, input: CashDrawerActionSchemaInput) {
    return posRepository.openCashDrawer(this.toScope(context), input);
  }

  async closeCashDrawer(context: PosPlatformContext, input: CashDrawerActionSchemaInput) {
    return posRepository.closeCashDrawer(this.toScope(context), input);
  }

  async reprintReceipt(context: PosPlatformContext, orderId: string) {
    return posRepository.reprintReceipt(this.toScope(context), orderId);
  }

  async listRegisters(context: PosPlatformContext) {
    return posRepository.listRegisters(this.toScope(context));
  }

  async listTerminals(context: PosPlatformContext) {
    return posRepository.listTerminals(this.toScope(context));
  }

  async listShifts(context: PosPlatformContext) {
    return posRepository.listShifts(this.toScope(context));
  }

  async listEmployees(context: PosPlatformContext) {
    return posRepository.listEmployees(this.toScope(context));
  }

  async listCashDrawers(context: PosPlatformContext) {
    return posRepository.listCashDrawers(this.toScope(context));
  }

  async getActiveSession(context: PosPlatformContext) {
    return posRepository.getActiveSession(this.toScope(context));
  }

  private toScope(context: PosPlatformContext): PosTenantScope {
    return {
      tenantId: context.tenantId,
      workspaceId: context.workspaceId,
      businessId: context.businessId,
      branchId: context.branchId,
      userId: context.userId,
      registerId: context.registerId,
      terminalId: context.terminalId,
      shiftId: context.shiftId,
    };
  }
}

export const posService = new PosService();
