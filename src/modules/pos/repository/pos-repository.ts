import { POS_ORDER_STATUSES } from "@/modules/pos/constants/pos-status";
import {
  DEFAULT_POS_SCOPE,
  MOCK_POS_CASH_DRAWER,
  MOCK_POS_EMPLOYEES,
  MOCK_POS_RECORDS,
  MOCK_POS_REGISTERS,
  MOCK_POS_SHIFTS,
  MOCK_POS_TERMINALS,
} from "@/modules/pos/constants/mock-data";
import type {
  ApplyPosDiscountInput,
  CreatePosSaleInput,
  MergePosBillsInput,
  PosCashDrawer,
  PosEmployee,
  PosRecord,
  PosRegister,
  PosSearchQuery,
  PosSession,
  PosShift,
  PosTerminal,
  ProcessPosPaymentInput,
  ProcessPosRefundInput,
  SplitPosBillInput,
  TransferPosTableInput,
} from "@/modules/pos/types/pos-platform";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateOrderNumber(): string {
  return String(2000 + Math.floor(Math.random() * 9000));
}

/** In-memory POS repository (mock only, no backend). */
export class PosRepository {
  private records: PosRecord[] = structuredClone(MOCK_POS_RECORDS);
  private registers: PosRegister[] = structuredClone(MOCK_POS_REGISTERS);
  private terminals: PosTerminal[] = structuredClone(MOCK_POS_TERMINALS);
  private shifts: PosShift[] = structuredClone(MOCK_POS_SHIFTS);
  private employees: PosEmployee[] = structuredClone(MOCK_POS_EMPLOYEES);
  private cashDrawers: PosCashDrawer[] = [structuredClone(MOCK_POS_CASH_DRAWER)];

  listRecords(): PosRecord[] {
    return structuredClone(this.records);
  }

  listRegisters(): PosRegister[] {
    return structuredClone(this.registers);
  }

  listTerminals(): PosTerminal[] {
    return structuredClone(this.terminals);
  }

  listShifts(): PosShift[] {
    return structuredClone(this.shifts);
  }

  listEmployees(): PosEmployee[] {
    return structuredClone(this.employees);
  }

  listCashDrawers(): PosCashDrawer[] {
    return structuredClone(this.cashDrawers);
  }

  getActiveSession(): PosSession | null {
    const record = this.records[0];
    return record?.session.isActive ? structuredClone(record.session) : null;
  }

  findById(orderId: string): PosRecord | undefined {
    return this.records.find((record) => record.order.id === orderId);
  }

  search(query: PosSearchQuery = {}): PosRecord[] {
    let results = this.listRecords();

    if (query.tenantId) {
      results = results.filter((r) => r.order.tenantId === query.tenantId);
    }

    if (query.businessId) {
      results = results.filter((r) => r.order.businessId === query.businessId);
    }

    if (query.branchId) {
      results = results.filter((r) => r.order.branchId === query.branchId);
    }

    if (query.registerId) {
      results = results.filter((r) => r.order.registerId === query.registerId);
    }

    if (query.shiftId) {
      results = results.filter((r) => r.transactions.some((t) => t.shiftId === query.shiftId));
    }

    if (query.status) {
      results = results.filter((r) => r.order.status === query.status);
    }

    if (query.paymentType) {
      results = results.filter((r) => r.payments.some((p) => p.paymentType === query.paymentType));
    }

    if (query.employeeId) {
      results = results.filter((r) => r.order.employeeId === query.employeeId);
    }

    if (query.tableId) {
      results = results.filter((r) => r.order.tableId === query.tableId);
    }

    if (query.query) {
      const term = query.query.toLowerCase();
      results = results.filter(
        (r) =>
          r.order.orderNumber.toLowerCase().includes(term) ||
          (r.order.tableLabel?.toLowerCase().includes(term) ?? false) ||
          r.cartItems.some((item) => item.name.toLowerCase().includes(term)),
      );
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  createSale(input: CreatePosSaleInput): PosRecord {
    const orderId = createId("pos");
    const orderNumber = generateOrderNumber();
    const cartId = createId("cart");
    const now = new Date().toISOString();

    const cartItems = input.items.map((item) => ({
      id: createId("cart-item"),
      cartId,
      menuItemId: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      totalPriceCents: item.unitPriceCents * item.quantity,
      modifiers: item.modifiers ?? [],
      notes: item.notes ?? null,
      taxRateBps: 2000,
      discountCents: 0,
    }));

    const subtotalCents = cartItems.reduce((sum, item) => sum + item.totalPriceCents, 0);
    const taxCents = Math.round(subtotalCents * 0.2);
    const totalCents = subtotalCents + taxCents;

    const baseRecord = this.records[0];
    const session = baseRecord?.session ?? {
      id: input.sessionId,
      tenantId: DEFAULT_POS_SCOPE.tenantId,
      workspaceId: DEFAULT_POS_SCOPE.workspaceId,
      businessId: DEFAULT_POS_SCOPE.businessId,
      branchId: DEFAULT_POS_SCOPE.branchId,
      terminalId: DEFAULT_POS_SCOPE.terminalId,
      registerId: DEFAULT_POS_SCOPE.registerId,
      shiftId: DEFAULT_POS_SCOPE.shiftId,
      employeeId: DEFAULT_POS_SCOPE.employeeId,
      startedAt: now,
      endedAt: null,
      isActive: true,
      isOffline: false,
      lastSyncAt: now,
    };

    const record: PosRecord = {
      session,
      order: {
        id: orderId,
        tenantId: DEFAULT_POS_SCOPE.tenantId,
        workspaceId: DEFAULT_POS_SCOPE.workspaceId,
        businessId: DEFAULT_POS_SCOPE.businessId,
        branchId: DEFAULT_POS_SCOPE.branchId,
        sessionId: input.sessionId,
        registerId: DEFAULT_POS_SCOPE.registerId,
        terminalId: DEFAULT_POS_SCOPE.terminalId,
        orderNumber,
        status: POS_ORDER_STATUSES.OPEN,
        source: input.source ?? "dine_in",
        tableId: input.tableId ?? null,
        tableLabel: input.tableLabel ?? null,
        reservationId: input.reservationId ?? null,
        customerId: input.customerId ?? null,
        employeeId: DEFAULT_POS_SCOPE.employeeId,
        guestCount: input.guestCount ?? null,
        subtotalCents,
        discountCents: 0,
        taxCents,
        tipCents: 0,
        totalCents,
        currency: "GBP",
        kitchenOrderId: null,
        isSplit: false,
        isMerged: false,
        mergedIntoOrderId: null,
        transferredFromTableId: null,
        createdAt: now,
        updatedAt: now,
        paidAt: null,
      },
      cart: {
        id: cartId,
        sessionId: input.sessionId,
        tenantId: DEFAULT_POS_SCOPE.tenantId,
        businessId: DEFAULT_POS_SCOPE.businessId,
        branchId: DEFAULT_POS_SCOPE.branchId,
        orderId,
        tableId: input.tableId ?? null,
        tableLabel: input.tableLabel ?? null,
        reservationId: input.reservationId ?? null,
        customerId: input.customerId ?? null,
        itemIds: cartItems.map((i) => i.id),
        subtotalCents,
        discountCents: 0,
        taxCents,
        totalCents,
        currency: "GBP",
        isHeld: false,
        updatedAt: now,
      },
      cartItems,
      payments: [],
      splitBill: null,
      discounts: [],
      taxes: [
        {
          id: createId("tax"),
          orderId,
          taxName: "VAT",
          taxRateBps: 2000,
          taxableAmountCents: subtotalCents,
          taxAmountCents: taxCents,
          jurisdiction: "GB",
        },
      ],
      receipt: null,
      refunds: [],
      transactions: [],
      analytics: {
        orderId,
        avgTicketCents: totalCents,
        itemCount: cartItems.reduce((sum, i) => sum + i.quantity, 0),
        discountRateBps: 0,
        taxRateBps: 2000,
        paymentMix: {},
        prepToPayMinutes: null,
        upsellCount: 0,
        refundRateBps: 0,
      },
      aiContext: {
        orderId,
        summary: `#${orderNumber} — quick sale`,
        suggestedUpsells: ["Side Salad", "Soft Drink"],
        recommendedDiscountBps: null,
        busyHourScore: 0.65,
        revenueForecastCents: null,
        suspiciousRefundScore: 0,
        promotionSuggestions: [],
        insights: [],
        lastGeneratedAt: now,
      },
    };

    this.records.push(record);
    return structuredClone(record);
  }

  applyDiscount(input: ApplyPosDiscountInput): PosRecord | null {
    const record = this.findById(input.orderId);

    if (!record) {
      return null;
    }

    const now = new Date().toISOString();
    let discountCents = input.amountCents ?? 0;

    if (input.valueBps && !input.amountCents) {
      discountCents = Math.round((record.order.subtotalCents * input.valueBps) / 10000);
    }

    record.discounts.push({
      id: createId("disc"),
      orderId: input.orderId,
      cartItemId: null,
      discountType: input.discountType,
      label: input.label,
      promoCode: input.promoCode ?? null,
      valueBps: input.valueBps ?? null,
      amountCents: discountCents,
      appliedByEmployeeId: input.appliedByEmployeeId,
      appliedAt: now,
    });

    record.order.discountCents += discountCents;
    record.cart.discountCents += discountCents;
    record.order.totalCents =
      record.order.subtotalCents - record.order.discountCents + record.order.taxCents;
    record.cart.totalCents = record.order.totalCents;
    record.order.updatedAt = now;

    return structuredClone(record);
  }

  splitBill(input: SplitPosBillInput): PosRecord | null {
    const record = this.findById(input.orderId);

    if (!record) {
      return null;
    }

    const now = new Date().toISOString();
    const splitId = createId("split");
    const portionAmount = Math.round(record.order.totalCents / input.splitCount);

    record.splitBill = {
      id: splitId,
      orderId: input.orderId,
      splitCount: input.splitCount,
      splitMethod: input.splitMethod,
      portions: Array.from({ length: input.splitCount }, (_, i) => ({
        id: createId("portion"),
        splitBillId: splitId,
        label: `Guest ${i + 1}`,
        amountCents: portionAmount,
        itemIds: [],
        paymentId: null,
        isPaid: false,
      })),
      createdAt: now,
    };

    record.order.isSplit = true;
    record.order.updatedAt = now;

    return structuredClone(record);
  }

  processPayment(input: ProcessPosPaymentInput): PosRecord | null {
    const record = this.findById(input.orderId);

    if (!record) {
      return null;
    }

    const now = new Date().toISOString();
    const paymentId = createId("pay");
    const tipCents = input.tipCents ?? 0;

    record.payments.push({
      id: paymentId,
      orderId: input.orderId,
      tenantId: record.order.tenantId,
      businessId: record.order.businessId,
      branchId: record.order.branchId,
      paymentType: input.paymentType,
      amountCents: input.amountCents,
      tipCents,
      currency: record.order.currency,
      reference: input.reference ?? null,
      cardLast4: input.paymentType === "card" ? "4242" : null,
      isSuccessful: true,
      processedAt: now,
      processedByEmployeeId: input.processedByEmployeeId,
    });

    record.order.status = POS_ORDER_STATUSES.PAID;
    record.order.tipCents = tipCents;
    record.order.paidAt = now;
    record.order.updatedAt = now;

    record.transactions.push({
      id: createId("txn"),
      tenantId: record.order.tenantId,
      businessId: record.order.businessId,
      branchId: record.order.branchId,
      shiftId: DEFAULT_POS_SCOPE.shiftId,
      orderId: input.orderId,
      paymentId,
      refundId: null,
      transactionType: "sale",
      amountCents: input.amountCents,
      currency: record.order.currency,
      paymentType: input.paymentType,
      employeeId: input.processedByEmployeeId,
      occurredAt: now,
    });

    return structuredClone(record);
  }

  processRefund(input: ProcessPosRefundInput): PosRecord | null {
    const record = this.findById(input.orderId);

    if (!record) {
      return null;
    }

    const now = new Date().toISOString();
    const refundId = createId("refund");
    const isSuspicious = input.amountCents > 5000;

    record.refunds.push({
      id: refundId,
      orderId: input.orderId,
      paymentId: input.paymentId,
      refundNumber: `RF-${record.order.orderNumber}`,
      reason: input.reason,
      amountCents: input.amountCents,
      currency: record.order.currency,
      isSuspicious,
      processedByEmployeeId: input.processedByEmployeeId,
      processedAt: now,
      approvedByEmployeeId: isSuspicious ? "emp-manager-1" : null,
    });

    record.order.status =
      input.amountCents >= record.order.totalCents
        ? POS_ORDER_STATUSES.REFUNDED
        : POS_ORDER_STATUSES.PARTIALLY_REFUNDED;
    record.order.updatedAt = now;

    record.transactions.push({
      id: createId("txn"),
      tenantId: record.order.tenantId,
      businessId: record.order.businessId,
      branchId: record.order.branchId,
      shiftId: DEFAULT_POS_SCOPE.shiftId,
      orderId: input.orderId,
      paymentId: null,
      refundId,
      transactionType: "refund",
      amountCents: -input.amountCents,
      currency: record.order.currency,
      paymentType: null,
      employeeId: input.processedByEmployeeId,
      occurredAt: now,
    });

    return structuredClone(record);
  }

  transferTable(input: TransferPosTableInput): PosRecord | null {
    const record = this.findById(input.orderId);

    if (!record) {
      return null;
    }

    const now = new Date().toISOString();
    record.order.transferredFromTableId = input.fromTableId;
    record.order.tableId = input.toTableId;
    record.order.tableLabel = input.toTableLabel;
    record.cart.tableId = input.toTableId;
    record.cart.tableLabel = input.toTableLabel;
    record.order.status = POS_ORDER_STATUSES.TRANSFERRED;
    record.order.updatedAt = now;

    return structuredClone(record);
  }

  mergeBills(input: MergePosBillsInput): PosRecord | null {
    const target = this.findById(input.targetOrderId);

    if (!target) {
      return null;
    }

    const now = new Date().toISOString();

    for (const sourceId of input.sourceOrderIds) {
      const source = this.findById(sourceId);

      if (!source || sourceId === input.targetOrderId) {
        continue;
      }

      target.cartItems.push(...source.cartItems);
      target.order.subtotalCents += source.order.subtotalCents;
      target.order.discountCents += source.order.discountCents;
      target.order.taxCents += source.order.taxCents;
      target.order.totalCents += source.order.totalCents;
      source.order.status = POS_ORDER_STATUSES.MERGED;
      source.order.mergedIntoOrderId = input.targetOrderId;
      source.order.updatedAt = now;
    }

    target.order.isMerged = true;
    target.order.updatedAt = now;

    return structuredClone(target);
  }
}

export const posRepository = new PosRepository();
