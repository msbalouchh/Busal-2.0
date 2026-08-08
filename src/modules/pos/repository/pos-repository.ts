import "server-only";

import { Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";
import {
  POS_CASH_DRAWER_EVENT_TYPES,
  POS_ORDER_STATUSES,
  POS_SHIFT_STATUSES,
} from "@/modules/pos/constants/pos-status";
import type { PosTenantScope } from "@/modules/pos/lib/pos-scope";
import {
  appendPosDiscount,
  appendPosRefund,
  appendPosTransaction,
  composePosNotes,
  decimalToPence,
  defaultBranchPosMeta,
  mapCartSessionToRecord,
  mapDomainPaymentToPrisma,
  mapRestaurantOrderToRecord,
  mapStaffToEmployee,
  penceToDecimal,
  splitPosNotes,
  type RestaurantOrderWithRelations,
  type StoredPosBranchMeta,
  type StoredPosMeta,
} from "@/modules/pos/lib/pos-mappers";
import { createOmsOrderFromSession } from "@/modules/orders/services/pos-oms-bridge.service";
import { recordOrderPayment, refundOrderPayment } from "@/modules/payments/services/payment-platform.service";
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

const DEFAULT_PAGE_SIZE = 25;

const restaurantOrderInclude = {
  items: true,
  payments: { include: { receipt: true } },
  restaurantTable: { select: { id: true, tableName: true } },
} satisfies Prisma.RestaurantOrderInclude;

export interface PosSearchResult {
  records: PosRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function scopeWhere(scope: PosTenantScope): Prisma.RestaurantOrderWhereInput {
  return {
    businessId: scope.businessId,
    branchId: scope.branchId,
  };
}

async function generateOrderNumber(businessId: string): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = randomBytes(2).toString("hex").toUpperCase();
    const orderNumber = `POS-${Date.now().toString().slice(-6)}-${suffix}`;
    const existing = await prisma.restaurantOrder.findFirst({
      where: { businessId, orderNumber },
      select: { id: true },
    });
    if (!existing) {
      return orderNumber;
    }
  }
  throw new Error("Unable to generate order number");
}

async function generateReceiptNumber(businessId: string): Promise<string> {
  const sequence = await prisma.receiptSequence.upsert({
    where: { businessId },
    create: { businessId, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });

  return `RCP-${String(sequence.lastNumber).padStart(6, "0")}`;
}

/** Prisma-backed POS repository with tenant scoping. */
export class PosRepository {
  private async loadBranchMeta(scope: PosTenantScope): Promise<StoredPosBranchMeta> {
    const settings = await prisma.branchSettings.findUnique({
      where: { branchId: scope.branchId },
      select: { settings: true },
    });

    const raw = settings?.settings;
    if (raw && typeof raw === "object" && raw !== null && "posOperations" in raw) {
      return (raw as unknown as { posOperations: StoredPosBranchMeta }).posOperations;
    }

    return defaultBranchPosMeta(scope);
  }

  private async saveBranchMeta(scope: PosTenantScope, meta: StoredPosBranchMeta): Promise<void> {
    const existing = await prisma.branchSettings.findUnique({
      where: { branchId: scope.branchId },
      select: { settings: true },
    });

    const settingsObject =
      existing?.settings && typeof existing.settings === "object" && existing.settings !== null
        ? (existing.settings as Record<string, unknown>)
        : {};

    await prisma.branchSettings.upsert({
      where: { branchId: scope.branchId },
      create: {
        branchId: scope.branchId,
        settings: { ...settingsObject, posOperations: meta } as unknown as Prisma.InputJsonValue,
      },
      update: {
        settings: { ...settingsObject, posOperations: meta } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private async loadAllRecords(scope: PosTenantScope): Promise<PosRecord[]> {
    const branchMeta = await this.loadBranchMeta(scope);

    const [restaurantOrders, activeSessions] = await Promise.all([
      prisma.restaurantOrder.findMany({
        where: scopeWhere(scope),
        include: restaurantOrderInclude,
        orderBy: [{ placedAt: "desc" }],
        take: 200,
      }),
      prisma.orderSession.findMany({
        where: {
          businessId: scope.businessId,
          branchId: scope.branchId,
          status: "ACTIVE",
          order: null,
        },
        include: {
          cart: {
            include: {
              items: { include: { menuItem: { select: { name: true } } } },
              orderSessions: true,
            },
          },
        },
        orderBy: [{ updatedAt: "desc" }],
      }),
    ]);

    const orderRecords = restaurantOrders.map((order) =>
      mapRestaurantOrderToRecord(order as RestaurantOrderWithRelations, scope, branchMeta),
    );

    const draftRecords = activeSessions
      .filter((session) => session.cart.items.length > 0)
      .map((session) => mapCartSessionToRecord(session.cart, session, scope, branchMeta));

    return [...draftRecords, ...orderRecords];
  }

  async listRecords(scope: PosTenantScope): Promise<PosRecord[]> {
    return this.loadAllRecords(scope);
  }

  async listRegisters(scope: PosTenantScope): Promise<PosRegister[]> {
    const meta = await this.loadBranchMeta(scope);
    return meta.registers ?? [];
  }

  async listTerminals(scope: PosTenantScope): Promise<PosTerminal[]> {
    const meta = await this.loadBranchMeta(scope);
    return meta.terminals ?? [];
  }

  async listShifts(scope: PosTenantScope): Promise<PosShift[]> {
    const meta = await this.loadBranchMeta(scope);
    return meta.shifts ?? [];
  }

  async listEmployees(scope: PosTenantScope): Promise<PosEmployee[]> {
    const staff = await prisma.staff.findMany({
      where: { businessId: scope.businessId, branchId: scope.branchId },
      select: { id: true, firstName: true, lastName: true, email: true },
      take: 50,
    });

    return staff.map((member) => mapStaffToEmployee(member, scope));
  }

  async listCashDrawers(scope: PosTenantScope): Promise<PosCashDrawer[]> {
    const meta = await this.loadBranchMeta(scope);
    return meta.cashDrawers ?? [];
  }

  async getActiveSession(scope: PosTenantScope): Promise<PosSession | null> {
    const meta = await this.loadBranchMeta(scope);
    return meta.activeSession ?? null;
  }

  async findById(scope: PosTenantScope, orderId: string): Promise<PosRecord | null> {
    const branchMeta = await this.loadBranchMeta(scope);

    const restaurantOrder = await prisma.restaurantOrder.findFirst({
      where: { id: orderId, ...scopeWhere(scope) },
      include: restaurantOrderInclude,
    });

    if (restaurantOrder) {
      return mapRestaurantOrderToRecord(
        restaurantOrder as RestaurantOrderWithRelations,
        scope,
        branchMeta,
      );
    }

    const session = await prisma.orderSession.findFirst({
      where: { id: orderId, businessId: scope.businessId, branchId: scope.branchId },
      include: {
        cart: {
          include: {
            items: { include: { menuItem: { select: { name: true } } } },
            orderSessions: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    return mapCartSessionToRecord(session.cart, session, scope, branchMeta);
  }

  async search(
    scope: PosTenantScope,
    query: PosSearchQuery & PosSearchSchemaInput = {
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      sortBy: "createdAt",
      sortDirection: "desc",
    },
  ): Promise<PosSearchResult> {
    let records = await this.loadAllRecords(scope);

    if (query.status) {
      records = records.filter((record) => record.order.status === query.status);
    }

    if (query.paymentType) {
      records = records.filter((record) =>
        record.payments.some((payment) => payment.paymentType === query.paymentType),
      );
    }

    if (query.registerId) {
      records = records.filter((record) => record.order.registerId === query.registerId);
    }

    if (query.shiftId) {
      records = records.filter((record) =>
        record.transactions.some((transaction) => transaction.shiftId === query.shiftId),
      );
    }

    if (query.employeeId) {
      records = records.filter((record) => record.order.employeeId === query.employeeId);
    }

    if (query.tableId) {
      records = records.filter((record) => record.order.tableId === query.tableId);
    }

    if (query.query) {
      const term = query.query.toLowerCase();
      records = records.filter(
        (record) =>
          record.order.orderNumber.toLowerCase().includes(term) ||
          (record.order.tableLabel?.toLowerCase().includes(term) ?? false) ||
          record.cartItems.some((item) => item.name.toLowerCase().includes(term)),
      );
    }

    records.sort((a, b) => {
      const direction = query.sortDirection === "asc" ? 1 : -1;
      switch (query.sortBy) {
        case "orderNumber":
          return a.order.orderNumber.localeCompare(b.order.orderNumber) * direction;
        case "totalCents":
          return (a.order.totalCents - b.order.totalCents) * direction;
        case "status":
          return a.order.status.localeCompare(b.order.status) * direction;
        case "createdAt":
        default:
          return (
            (new Date(a.order.createdAt).getTime() - new Date(b.order.createdAt).getTime()) *
            direction
          );
      }
    });

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? query.limit ?? DEFAULT_PAGE_SIZE;
    const total = records.length;
    const start = (page - 1) * pageSize;

    return {
      records: records.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async createSale(scope: PosTenantScope, input: CreatePosSaleInput | CreatePosSaleSchemaInput): Promise<PosRecord> {
    const orderNumber = await generateOrderNumber(scope.businessId);
    const subtotalCents = input.items.reduce(
      (sum, item) => sum + item.unitPriceCents * item.quantity,
      0,
    );
    const taxCents = Math.round(subtotalCents * 0.2);
    const totalCents = subtotalCents + taxCents;

    const qrCode = await prisma.qRCode.findFirst({
      where: { businessId: scope.businessId, slug: `pos-${scope.branchId}` },
      select: { id: true },
    });

    const qrCodeId =
      qrCode?.id ??
      (
        await prisma.qRCode.create({
          data: {
            businessId: scope.businessId,
            branchId: scope.branchId,
            slug: `pos-${scope.branchId}`,
            code: `POS-${scope.branchId.slice(0, 8).toUpperCase()}`,
            isActive: true,
          },
          select: { id: true },
        })
      ).id;

    const qrSession = await prisma.qRMenuSession.create({
      data: {
        businessId: scope.businessId,
        qrCodeId,
        sessionToken: `pos-sale-${randomBytes(8).toString("hex")}`,
        deviceInfo: "POS Platform Sale",
      },
    });

    const cart = await prisma.cart.create({
      data: {
        businessId: scope.businessId,
        branchId: scope.branchId,
        qrMenuSessionId: qrSession.id,
        subtotal: penceToDecimal(subtotalCents),
        items: {
          create: input.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: penceToDecimal(item.unitPriceCents),
            totalPrice: penceToDecimal(item.unitPriceCents * item.quantity),
            notes: item.notes ?? null,
          })),
        },
      },
    });

    const orderSession = await prisma.orderSession.create({
      data: {
        businessId: scope.businessId,
        branchId: scope.branchId,
        cartId: cart.id,
        qrMenuSessionId: qrSession.id,
        tableId: input.tableId ?? null,
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const meta: StoredPosMeta = {
      registerId: scope.registerId,
      terminalId: scope.terminalId,
      shiftId: scope.shiftId,
      employeeId: scope.userId,
      sessionId: input.sessionId,
      source: input.source,
    };

    await prisma.orderSession.update({
      where: { id: orderSession.id },
      data: {
        status: "READY",
        orderNotes: composePosNotes(null, meta),
      },
    });

    const orderData = await createOmsOrderFromSession(orderSession.id, scope.branchId);

    await prisma.restaurantOrder.update({
      where: { id: orderData.id },
      data: {
        notes: composePosNotes(null, meta),
        customerId: input.customerId ?? null,
        restaurantTableId: input.tableId ?? null,
      },
    });

    const record = await this.findById(scope, orderData.id);
    if (!record) {
      throw new Error("Failed to create POS sale");
    }
    return record;
  }

  private async mutateRestaurantOrderMeta(
    scope: PosTenantScope,
    orderId: string,
    updater: (meta: StoredPosMeta, record: PosRecord) => StoredPosMeta,
    orderUpdater?: (record: PosRecord) => Prisma.RestaurantOrderUpdateInput,
  ): Promise<PosRecord | null> {
    const order = await prisma.restaurantOrder.findFirst({
      where: { id: orderId, ...scopeWhere(scope) },
      select: { id: true, notes: true },
    });

    if (!order) {
      return null;
    }

    const record = await this.findById(scope, orderId);
    if (!record) {
      return null;
    }

    const { guestNotes, meta } = splitPosNotes(order.notes);
    const nextMeta = updater(meta, record);

    await prisma.restaurantOrder.update({
      where: { id: orderId },
      data: {
        notes: composePosNotes(guestNotes, nextMeta),
        ...(orderUpdater?.(record) ?? {}),
      },
    });

    return this.findById(scope, orderId);
  }

  async applyDiscount(scope: PosTenantScope, input: ApplyPosDiscountInput | ApplyPosDiscountSchemaInput): Promise<PosRecord | null> {
    return this.mutateRestaurantOrderMeta(scope, input.orderId, (meta, record) => {
      let discountCents = input.amountCents ?? 0;
      if (input.valueBps && !input.amountCents) {
        discountCents = Math.round((record.order.subtotalCents * input.valueBps) / 10000);
      }

      const discount = {
        orderId: input.orderId,
        cartItemId: null,
        discountType: input.discountType,
        label: input.label,
        promoCode: input.promoCode ?? null,
        valueBps: input.valueBps ?? null,
        amountCents: discountCents,
        appliedByEmployeeId: input.appliedByEmployeeId,
        appliedAt: new Date().toISOString(),
      };

      return appendPosDiscount(meta, discount);
    }, (record) => {
      const discountCents =
        input.amountCents ??
        (input.valueBps ? Math.round((record.order.subtotalCents * input.valueBps) / 10000) : 0);
      const subtotal = record.order.subtotalCents;
      const newDiscount = record.order.discountCents + discountCents;
      const tax = Math.round((subtotal - newDiscount) * 0.2);
      const total = subtotal - newDiscount + tax + record.order.tipCents;

      return {
        discountAmount: penceToDecimal(newDiscount),
        taxAmount: penceToDecimal(tax),
        totalAmount: penceToDecimal(total),
      };
    });
  }

  async splitBill(scope: PosTenantScope, input: SplitPosBillInput | SplitPosBillSchemaInput): Promise<PosRecord | null> {
    return this.mutateRestaurantOrderMeta(scope, input.orderId, (meta, record) => {
      const splitId = `split-${Date.now()}`;
      const portionAmount = Math.round(record.order.totalCents / input.splitCount);

      return {
        ...meta,
        splitBill: {
          id: splitId,
          orderId: input.orderId,
          splitCount: input.splitCount,
          splitMethod: input.splitMethod,
          portions: Array.from({ length: input.splitCount }, (_, index) => ({
            id: `portion-${index + 1}`,
            splitBillId: splitId,
            label: `Guest ${index + 1}`,
            amountCents: portionAmount,
            itemIds: [],
            paymentId: null,
            isPaid: false,
          })),
          createdAt: new Date().toISOString(),
        },
      };
    });
  }

  async processPayment(
    scope: PosTenantScope,
    input: ProcessPosPaymentSchemaInput,
  ): Promise<PosRecord | null> {
    const record = await this.findById(scope, input.orderId);
    if (!record) {
      return null;
    }

    const restaurantOrder = await prisma.restaurantOrder.findFirst({
      where: { id: input.orderId, ...scopeWhere(scope) },
      select: { id: true, notes: true, totalAmount: true },
    });

    if (!restaurantOrder) {
      return null;
    }

    const business = await prisma.business.findUnique({
      where: { id: scope.businessId },
      select: { ownerId: true },
    });

    if (!business?.ownerId) {
      return null;
    }

    const paymentSummary = await recordOrderPayment(business.ownerId, {
      branchId: scope.branchId,
      orderId: input.orderId,
      paymentMethod: mapDomainPaymentToPrisma(input.paymentType),
      amountPaid: input.amountCents / 100,
      amountTendered: (input.amountTenderedCents ?? input.amountCents) / 100,
      tipAmount: (input.tipCents ?? 0) / 100,
      transactionReference: input.reference ?? null,
    });

    const latestPayment = paymentSummary.payments.at(-1);
    const { guestNotes, meta } = splitPosNotes(restaurantOrder.notes);
    const nextMeta = appendPosTransaction(
      {
        ...meta,
        tipCents: (meta.tipCents ?? 0) + (input.tipCents ?? 0),
        serviceChargeCents: (meta.serviceChargeCents ?? 0) + (input.serviceChargeCents ?? 0),
        paymentTypeOverride: input.paymentType,
      },
      {
        tenantId: scope.tenantId,
        businessId: scope.businessId,
        branchId: scope.branchId,
        shiftId: scope.shiftId,
        orderId: input.orderId,
        paymentId: latestPayment?.id ?? input.orderId,
        refundId: null,
        transactionType: "sale",
        amountCents: input.amountCents,
        currency: "GBP",
        paymentType: input.paymentType,
        employeeId: input.processedByEmployeeId,
        occurredAt: new Date().toISOString(),
      },
    );

    await prisma.restaurantOrder.update({
      where: { id: input.orderId },
      data: {
        notes: composePosNotes(guestNotes, nextMeta),
        ...(paymentSummary.remainingBalance <= 0 || paymentSummary.paymentStatus === "PAID"
          ? { status: "COMPLETED", completedAt: new Date(), paymentStatus: "PAID" }
          : { paymentStatus: "PARTIALLY_PAID" }),
      },
    });

    return this.findById(scope, input.orderId);
  }

  async processRefund(
    scope: PosTenantScope,
    input: ProcessPosRefundInput | ProcessPosRefundSchemaInput,
  ): Promise<PosRecord | null> {
    const payment = await prisma.orderPayment.findFirst({
      where: { id: input.paymentId, businessId: scope.businessId },
      select: { id: true, amountPaid: true, orderId: true },
    });

    if (!payment || payment.orderId !== input.orderId) {
      return null;
    }

    const business = await prisma.business.findUnique({
      where: { id: scope.businessId },
      select: { ownerId: true },
    });

    if (!business?.ownerId) {
      return null;
    }

    const isSuspicious = input.amountCents > 5000 || input.reason === "fraud_suspected";

    await refundOrderPayment(business.ownerId, {
      branchId: scope.branchId,
      paymentId: payment.id,
      amount: input.amountCents / 100,
    });

    return this.mutateRestaurantOrderMeta(scope, input.orderId, (meta) =>
      appendPosRefund(meta, {
        orderId: input.orderId,
        paymentId: input.paymentId,
        refundNumber: `RF-${input.orderId.slice(0, 8).toUpperCase()}`,
        reason: input.reason,
        amountCents: input.amountCents,
        currency: "GBP",
        isSuspicious,
        processedByEmployeeId: input.processedByEmployeeId,
        processedAt: new Date().toISOString(),
        approvedByEmployeeId: isSuspicious ? scope.userId : null,
      }),
    );
  }

  async voidOrder(scope: PosTenantScope, orderId: string, reason?: string): Promise<PosRecord | null> {
    return this.mutateRestaurantOrderMeta(
      scope,
      orderId,
      (meta) => ({ ...meta, isVoid: true }),
      () => ({ status: "CANCELLED", cancelledAt: new Date() }),
    );
  }

  async transferTable(scope: PosTenantScope, input: TransferPosTableInput): Promise<PosRecord | null> {
    return this.mutateRestaurantOrderMeta(
      scope,
      input.orderId,
      (meta) => ({
        ...meta,
        transferredFromTableId: input.fromTableId,
      }),
      () => ({ restaurantTable: { connect: { id: input.toTableId } } }),
    );
  }

  async mergeBills(scope: PosTenantScope, input: MergePosBillsInput): Promise<PosRecord | null> {
    const target = await this.findById(scope, input.targetOrderId);
    if (!target) {
      return null;
    }

    for (const sourceOrderId of input.sourceOrderIds) {
      if (sourceOrderId === input.targetOrderId) {
        continue;
      }

      await this.mutateRestaurantOrderMeta(
        scope,
        sourceOrderId,
        (meta) => ({
          ...meta,
          isMerged: true,
          mergedIntoOrderId: input.targetOrderId,
        }),
        () => ({ status: "CANCELLED", cancelledAt: new Date() }),
      );
    }

    return this.findById(scope, input.targetOrderId);
  }

  async openShift(scope: PosTenantScope, input: OpenPosShiftSchemaInput): Promise<PosShift> {
    const meta = await this.loadBranchMeta(scope);
    const now = new Date().toISOString();
    const shiftId = `${scope.branchId}-shift-${Date.now()}`;

    const shift: PosShift = {
      id: shiftId,
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      registerId: input.registerId,
      employeeId: scope.userId,
      status: POS_SHIFT_STATUSES.OPEN,
      openedAt: now,
      closedAt: null,
      openingCashCents: input.openingCashCents,
      closingCashCents: null,
      expectedCashCents: null,
      varianceCents: null,
      totalSalesCents: 0,
      totalRefundsCents: 0,
      transactionCount: 0,
    };

    await this.saveBranchMeta(scope, {
      ...meta,
      shifts: [shift, ...(meta.shifts ?? [])],
    });

    return shift;
  }

  async closeShift(scope: PosTenantScope, input: ClosePosShiftSchemaInput): Promise<PosShift | null> {
    const meta = await this.loadBranchMeta(scope);
    const shift = meta.shifts?.find((entry) => entry.id === input.shiftId);
    if (!shift) {
      return null;
    }

    const records = await this.loadAllRecords(scope);
    const shiftSales = records
      .flatMap((record) => record.transactions)
      .filter((transaction) => transaction.shiftId === input.shiftId && transaction.transactionType === "sale")
      .reduce((sum, transaction) => sum + transaction.amountCents, 0);

    const updatedShift: PosShift = {
      ...shift,
      status: POS_SHIFT_STATUSES.CLOSED,
      closedAt: new Date().toISOString(),
      closingCashCents: input.closingCashCents,
      expectedCashCents: shift.openingCashCents + shiftSales,
      varianceCents: input.closingCashCents - (shift.openingCashCents + shiftSales),
      totalSalesCents: shiftSales,
    };

    await this.saveBranchMeta(scope, {
      ...meta,
      shifts: (meta.shifts ?? []).map((entry) => (entry.id === input.shiftId ? updatedShift : entry)),
    });

    return updatedShift;
  }

  async openCashDrawer(scope: PosTenantScope, input: CashDrawerActionSchemaInput): Promise<PosCashDrawer | null> {
    const meta = await this.loadBranchMeta(scope);
    const drawer = meta.cashDrawers?.find((entry) => entry.id === input.drawerId);
    if (!drawer) {
      return null;
    }

    const now = new Date().toISOString();
    const updatedDrawer: PosCashDrawer = {
      ...drawer,
      isOpen: true,
      lastOpenedAt: now,
      events: [
        ...drawer.events,
        {
          id: `drawer-event-${Date.now()}`,
          drawerId: drawer.id,
          eventType: POS_CASH_DRAWER_EVENT_TYPES.OPEN,
          amountCents: input.amountCents,
          reason: input.reason ?? "Manual open",
          employeeId: scope.userId,
          occurredAt: now,
        },
      ],
    };

    await this.saveBranchMeta(scope, {
      ...meta,
      cashDrawers: (meta.cashDrawers ?? []).map((entry) =>
        entry.id === input.drawerId ? updatedDrawer : entry,
      ),
    });

    return updatedDrawer;
  }

  async closeCashDrawer(scope: PosTenantScope, input: CashDrawerActionSchemaInput): Promise<PosCashDrawer | null> {
    const meta = await this.loadBranchMeta(scope);
    const drawer = meta.cashDrawers?.find((entry) => entry.id === input.drawerId);
    if (!drawer) {
      return null;
    }

    const now = new Date().toISOString();
    const updatedDrawer: PosCashDrawer = {
      ...drawer,
      isOpen: false,
      currentBalanceCents: input.amountCents,
      expectedBalanceCents: input.amountCents,
      lastClosedAt: now,
      events: [
        ...drawer.events,
        {
          id: `drawer-event-${Date.now()}`,
          drawerId: drawer.id,
          eventType: POS_CASH_DRAWER_EVENT_TYPES.CLOSE,
          amountCents: input.amountCents,
          reason: input.reason ?? "Shift close",
          employeeId: scope.userId,
          occurredAt: now,
        },
      ],
    };

    await this.saveBranchMeta(scope, {
      ...meta,
      cashDrawers: (meta.cashDrawers ?? []).map((entry) =>
        entry.id === input.drawerId ? updatedDrawer : entry,
      ),
    });

    return updatedDrawer;
  }

  async reprintReceipt(scope: PosTenantScope, orderId: string): Promise<PosRecord | null> {
    const receipt = await prisma.receipt.findFirst({
      where: { orderId, businessId: scope.businessId },
      select: { id: true, printCount: true },
    });

    if (!receipt) {
      return null;
    }

    await prisma.receipt.update({
      where: { id: receipt.id },
      data: {
        printCount: receipt.printCount + 1,
        lastPrintedAt: new Date(),
        lastPrintStatus: "PRINTED",
      },
    });

    return this.findById(scope, orderId);
  }
}

export const posRepository = new PosRepository();
