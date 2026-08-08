import type {
  Cart,
  CartItem,
  OrderPayment,
  OrderPaymentMethod,
  OrderReceipt,
  OrderSession,
  Payment,
  PaymentMethod,
  Prisma,
  Receipt,
  RestaurantOrder,
  RestaurantOrderItem,
  RestaurantOrderStatus,
} from "@prisma/client";

import {
  POS_HELD_ORDER_PREFIX,
  POS_ORDER_TYPE_PREFIX,
} from "@/modules/pos/constants/routes";
import {
  POS_ORDER_STATUSES,
  POS_PAYMENT_TYPES,
  POS_RECEIPT_CHANNELS,
  POS_SHIFT_STATUSES,
  type PosOrderSource,
  type PosOrderStatus,
  type PosPaymentType,
} from "@/modules/pos/constants/pos-status";
import type { PosTenantScope } from "@/modules/pos/lib/pos-scope";
import type {
  PosAiContext,
  PosAnalytics,
  PosCart,
  PosCartItem,
  PosCashDrawer,
  PosDiscount,
  PosEmployee,
  PosOrder,
  PosPayment,
  PosReceipt,
  PosRecord,
  PosRefund,
  PosRegister,
  PosSession,
  PosShift,
  PosSplitBill,
  PosTax,
  PosTerminal,
  PosTransaction,
} from "@/modules/pos/types/pos-platform";

export const POS_META_DELIMITER = "\n---BUSAL_POS_META---\n";

export interface StoredPosMeta {
  discounts?: PosDiscount[];
  taxes?: PosTax[];
  splitBill?: PosSplitBill | null;
  refunds?: PosRefund[];
  transactions?: PosTransaction[];
  serviceChargeCents?: number;
  tipCents?: number;
  isVoid?: boolean;
  isMerged?: boolean;
  mergedIntoOrderId?: string | null;
  transferredFromTableId?: string | null;
  paymentTypeOverride?: PosPaymentType;
  registerId?: string;
  terminalId?: string;
  shiftId?: string;
  employeeId?: string;
  sessionId?: string;
  source?: PosOrderSource;
}

export interface StoredPosBranchMeta {
  registers?: PosRegister[];
  terminals?: PosTerminal[];
  shifts?: PosShift[];
  cashDrawers?: PosCashDrawer[];
  activeSession?: PosSession | null;
}

export type RestaurantOrderWithRelations = Prisma.RestaurantOrderGetPayload<{
  include: {
    items: true;
    payments: { include: { receipt: true } };
    restaurantTable: { select: { id: true; tableName: true } };
  };
}>;

export type CartWithRelations = Prisma.CartGetPayload<{
  include: {
    items: { include: { menuItem: { select: { name: true } } } };
    orderSessions: true;
  };
}>;

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function iso(value: Date | string | null | undefined): string {
  if (!value) {
    return new Date().toISOString();
  }
  return value instanceof Date ? value.toISOString() : value;
}

export function decimalToPence(value: Prisma.Decimal | number | string): number {
  return Math.round(Number(value) * 100);
}

export function penceToDecimal(pence: number): number {
  return pence / 100;
}

export function splitPosNotes(raw: string | null): {
  guestNotes: string | null;
  meta: StoredPosMeta;
} {
  if (!raw) {
    return { guestNotes: null, meta: {} };
  }

  const delimiterIndex = raw.indexOf(POS_META_DELIMITER);
  if (delimiterIndex === -1) {
    return { guestNotes: raw, meta: {} };
  }

  const guestNotes = raw.slice(0, delimiterIndex).trim() || null;
  const metaRaw = raw.slice(delimiterIndex + POS_META_DELIMITER.length).trim();

  try {
    return { guestNotes, meta: JSON.parse(metaRaw) as StoredPosMeta };
  } catch {
    return { guestNotes: raw, meta: {} };
  }
}

export function composePosNotes(guestNotes: string | null, meta: StoredPosMeta): string | null {
  const hasMeta =
    (meta.discounts?.length ?? 0) > 0 ||
    (meta.taxes?.length ?? 0) > 0 ||
    meta.splitBill ||
    (meta.refunds?.length ?? 0) > 0 ||
    (meta.transactions?.length ?? 0) > 0 ||
    (meta.serviceChargeCents ?? 0) > 0 ||
    (meta.tipCents ?? 0) > 0 ||
    meta.isVoid ||
    meta.isMerged ||
    meta.mergedIntoOrderId;

  if (!guestNotes && !hasMeta) {
    return null;
  }

  if (!hasMeta) {
    return guestNotes;
  }

  return `${guestNotes ?? ""}${POS_META_DELIMITER}${JSON.stringify(meta)}`;
}

export function mapPaymentMethodToDomain(method: PaymentMethod): PosPaymentType {
  switch (method) {
    case "CARD":
      return POS_PAYMENT_TYPES.CARD;
    default:
      return POS_PAYMENT_TYPES.CASH;
  }
}

export function mapDomainPaymentToPrisma(type: PosPaymentType): PaymentMethod {
  switch (type) {
    case POS_PAYMENT_TYPES.CARD:
    case POS_PAYMENT_TYPES.APPLE_PAY:
    case POS_PAYMENT_TYPES.GOOGLE_PAY:
      return "CARD";
    default:
      return "CASH";
  }
}

function mapFulfilmentToSource(fulfilmentType: string): PosOrderSource {
  switch (fulfilmentType) {
    case "TAKEAWAY":
      return "takeaway";
    case "DELIVERY":
      return "delivery";
    default:
      return "dine_in";
  }
}

function isHeldSessionNotes(notes: string | null): boolean {
  return Boolean(notes?.includes(POS_HELD_ORDER_PREFIX));
}

export function defaultBranchPosMeta(scope: PosTenantScope): StoredPosBranchMeta {
  const now = new Date().toISOString();
  const registerId = scope.registerId;
  const terminalId = scope.terminalId;
  const drawerId = `${scope.branchId}-drawer-main`;

  return {
    registers: [
      {
        id: registerId,
        tenantId: scope.tenantId,
        businessId: scope.businessId,
        branchId: scope.branchId,
        name: "Main Register",
        code: "REG-01",
        defaultTerminalId: terminalId,
        cashDrawerId: drawerId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
    terminals: [
      {
        id: terminalId,
        tenantId: scope.tenantId,
        businessId: scope.businessId,
        branchId: scope.branchId,
        registerId,
        name: "Terminal 1",
        deviceId: `device-${scope.branchId}`,
        isActive: true,
        isOfflineCapable: true,
        lastHeartbeatAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ],
    shifts: [
      {
        id: scope.shiftId,
        tenantId: scope.tenantId,
        businessId: scope.businessId,
        branchId: scope.branchId,
        registerId,
        employeeId: scope.userId,
        status: POS_SHIFT_STATUSES.OPEN,
        openedAt: now,
        closedAt: null,
        openingCashCents: 10000,
        closingCashCents: null,
        expectedCashCents: null,
        varianceCents: null,
        totalSalesCents: 0,
        totalRefundsCents: 0,
        transactionCount: 0,
      },
    ],
    cashDrawers: [
      {
        id: drawerId,
        registerId,
        tenantId: scope.tenantId,
        businessId: scope.businessId,
        branchId: scope.branchId,
        openingBalanceCents: 10000,
        currentBalanceCents: 10000,
        expectedBalanceCents: 10000,
        currency: "GBP",
        isOpen: true,
        lastOpenedAt: now,
        lastClosedAt: null,
        events: [],
      },
    ],
    activeSession: {
      id: `${scope.branchId}-pos-session`,
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      terminalId,
      registerId,
      shiftId: scope.shiftId,
      employeeId: scope.userId,
      startedAt: now,
      endedAt: null,
      isActive: true,
      isOffline: false,
      lastSyncAt: now,
    },
  };
}

function buildSession(scope: PosTenantScope, meta: StoredPosMeta, branchMeta: StoredPosBranchMeta): PosSession {
  return (
    branchMeta.activeSession ?? {
      id: meta.sessionId ?? `${scope.branchId}-pos-session`,
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      terminalId: meta.terminalId ?? scope.terminalId,
      registerId: meta.registerId ?? scope.registerId,
      shiftId: meta.shiftId ?? scope.shiftId,
      employeeId: meta.employeeId ?? scope.userId,
      startedAt: new Date().toISOString(),
      endedAt: null,
      isActive: true,
      isOffline: false,
      lastSyncAt: new Date().toISOString(),
    }
  );
}

function mapPayments(
  payments: Payment[],
  orderId: string,
  scope: PosTenantScope,
  meta: StoredPosMeta,
): PosPayment[] {
  return payments.map((payment) => ({
    id: payment.id,
    orderId,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    paymentType: meta.paymentTypeOverride ?? mapPaymentMethodToDomain(payment.method),
    amountCents: payment.amount,
    tipCents: meta.tipCents ?? 0,
    currency: "GBP",
    reference: payment.notes,
    cardLast4: payment.method === "CARD" ? "4242" : null,
    isSuccessful: payment.status === "COMPLETED",
    processedAt: iso(payment.createdAt),
    processedByEmployeeId: payment.staffId ?? scope.userId,
  }));
}

function mapReceipt(receipt: Receipt | undefined, order: PosOrder, meta: StoredPosMeta): PosReceipt | null {
  if (!receipt) {
    return null;
  }

  return {
    id: receipt.id,
    orderId: order.id,
    receiptNumber: receipt.receiptNumber,
    channel: "print",
    recipientEmail: receipt.deliveryEmail,
    recipientPhone: receipt.deliveryPhone,
    subtotalCents: receipt.subtotalPence,
    discountCents: receipt.discountPence,
    taxCents: receipt.taxPence,
    tipCents: meta.tipCents ?? 0,
    totalCents: receipt.totalPence,
    currency: receipt.currency,
    issuedAt: iso(receipt.createdAt),
    printedAt: receipt.lastPrintedAt ? iso(receipt.lastPrintedAt) : null,
  };
}

function buildAnalytics(order: PosOrder, items: PosCartItem[], payments: PosPayment[], meta: StoredPosMeta): PosAnalytics {
  const paymentMix: Partial<Record<PosPaymentType, number>> = {};
  for (const payment of payments) {
    paymentMix[payment.paymentType] = (paymentMix[payment.paymentType] ?? 0) + payment.amountCents;
  }

  return {
    orderId: order.id,
    avgTicketCents: order.totalCents,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    discountRateBps:
      order.subtotalCents > 0 ? Math.round((order.discountCents / order.subtotalCents) * 10000) : 0,
    taxRateBps: order.subtotalCents > 0 ? Math.round((order.taxCents / order.subtotalCents) * 10000) : 0,
    paymentMix,
    prepToPayMinutes: null,
    upsellCount: 0,
    refundRateBps:
      order.totalCents > 0
        ? Math.round(((meta.refunds?.reduce((sum, r) => sum + r.amountCents, 0) ?? 0) / order.totalCents) * 10000)
        : 0,
  };
}

function buildAiContext(order: PosOrder, items: PosCartItem[], meta: StoredPosMeta): PosAiContext {
  return {
    orderId: order.id,
    summary: `Order #${order.orderNumber} — ${items.length} item(s)`,
    suggestedUpsells: ["Side Salad", "Soft Drink", "Dessert"],
    recommendedDiscountBps: order.discountCents > 0 ? null : 500,
    busyHourScore: 0.65,
    revenueForecastCents: order.totalCents * 6,
    suspiciousRefundScore: (meta.refunds?.some((refund) => refund.isSuspicious) ?? false) ? 0.8 : 0.1,
    promotionSuggestions: ["LUNCH10", "DESSERT15"],
    insights: [],
    lastGeneratedAt: new Date().toISOString(),
  };
}


function mapOrderPaymentMethodToDomain(method: OrderPaymentMethod): PosPaymentType {
  switch (method) {
    case "CARD":
      return POS_PAYMENT_TYPES.CARD;
    default:
      return POS_PAYMENT_TYPES.CASH;
  }
}

function mapOrderPayments(
  payments: OrderPayment[],
  orderId: string,
  scope: PosTenantScope,
  meta: StoredPosMeta,
): PosPayment[] {
  return payments.map((payment) => ({
    id: payment.id,
    orderId,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    paymentType: meta.paymentTypeOverride ?? mapOrderPaymentMethodToDomain(payment.paymentMethod),
    amountCents: decimalToPence(payment.amountPaid),
    tipCents: decimalToPence(payment.tipAmount),
    currency: payment.currency,
    reference: payment.transactionReference,
    cardLast4: payment.paymentMethod === "CARD" ? "4242" : null,
    isSuccessful: payment.status === "PAID",
    processedAt: iso(payment.paidAt ?? payment.createdAt),
    processedByEmployeeId: payment.processedByStaffId ?? scope.userId,
  }));
}

function mapOrderReceipt(
  receipt: OrderReceipt | null | undefined,
  order: PosOrder,
  meta: StoredPosMeta,
): PosReceipt | null {
  if (!receipt) {
    return null;
  }

  return {
    id: receipt.id,
    orderId: order.id,
    receiptNumber: receipt.receiptNumber,
    channel: POS_RECEIPT_CHANNELS.PRINT,
    recipientEmail: null,
    recipientPhone: null,
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    taxCents: order.taxCents,
    tipCents: order.tipCents,
    totalCents: order.totalCents,
    currency: "GBP",
    issuedAt: iso(receipt.createdAt),
    printedAt: receipt.printedCount > 0 ? iso(receipt.updatedAt) : null,
  };
}

function mapRestaurantStatusToDomain(
  status: RestaurantOrderStatus,
  meta: StoredPosMeta,
  amountPaidPence: number,
  totalPence: number,
): PosOrderStatus {
  if (meta.isVoid || status === "CANCELLED") {
    return POS_ORDER_STATUSES.VOID;
  }

  if (meta.isMerged) {
    return POS_ORDER_STATUSES.MERGED;
  }

  if ((meta.refunds?.length ?? 0) > 0) {
    const refundTotal = (meta.refunds ?? []).reduce((sum, refund) => sum + refund.amountCents, 0);
    return refundTotal >= totalPence
      ? POS_ORDER_STATUSES.REFUNDED
      : POS_ORDER_STATUSES.PARTIALLY_REFUNDED;
  }

  if (amountPaidPence >= totalPence && totalPence > 0) {
    return POS_ORDER_STATUSES.PAID;
  }

  if (amountPaidPence > 0) {
    return POS_ORDER_STATUSES.PARTIALLY_PAID;
  }

  if (status === "COMPLETED" || status === "SERVED") {
    return POS_ORDER_STATUSES.PAID;
  }

  return POS_ORDER_STATUSES.OPEN;
}

export function mapRestaurantOrderToRecord(
  order: RestaurantOrderWithRelations,
  scope: PosTenantScope,
  branchMeta: StoredPosBranchMeta,
): PosRecord {
  const { meta } = splitPosNotes(order.notes);
  const subtotalCents = decimalToPence(order.subtotal);
  const discountCents = decimalToPence(order.discountAmount);
  const taxCents = decimalToPence(order.taxAmount);
  const totalCents = decimalToPence(order.totalAmount);
  const serviceChargeCents = decimalToPence(order.serviceCharge);
  const amountPaidPence = order.payments
    .filter((payment) => payment.status === "PAID")
    .reduce((sum, payment) => sum + decimalToPence(payment.amountPaid), 0);
  const session = buildSession(scope, meta, branchMeta);

  const cartItems: PosCartItem[] = order.items.map((item) => ({
    id: item.id,
    cartId: order.id,
    menuItemId: item.productId,
    name: item.productNameSnapshot,
    quantity: item.quantity,
    unitPriceCents: decimalToPence(item.unitPrice),
    totalPriceCents: decimalToPence(item.totalAmount),
    modifiers: [],
    notes: item.specialInstructions,
    taxRateBps: 2000,
    discountCents: decimalToPence(item.discountAmount),
  }));

  const posOrder: PosOrder = {
    id: order.id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    sessionId: session.id,
    registerId: meta.registerId ?? scope.registerId,
    terminalId: meta.terminalId ?? scope.terminalId,
    orderNumber: order.orderNumber,
    status: mapRestaurantStatusToDomain(order.status, meta, amountPaidPence, totalCents),
    source: meta.source ?? mapFulfilmentToSource(order.orderType),
    tableId: order.restaurantTableId,
    tableLabel: order.restaurantTable?.tableName ?? null,
    reservationId: order.reservationId,
    customerId: order.customerId,
    employeeId: meta.employeeId ?? order.staffId ?? scope.userId,
    guestCount: null,
    subtotalCents,
    discountCents,
    taxCents,
    tipCents: decimalToPence(order.tipAmount) || (meta.tipCents ?? 0),
    totalCents: totalCents + serviceChargeCents,
    currency: "GBP",
    kitchenOrderId: null,
    isSplit: Boolean(meta.splitBill),
    isMerged: meta.isMerged ?? false,
    mergedIntoOrderId: meta.mergedIntoOrderId ?? null,
    transferredFromTableId: meta.transferredFromTableId ?? null,
    createdAt: iso(order.placedAt),
    updatedAt: iso(order.updatedAt),
    paidAt: amountPaidPence >= totalCents ? iso(order.completedAt ?? order.updatedAt) : null,
  };

  const cart: PosCart = {
    id: order.id,
    sessionId: session.id,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    orderId: order.id,
    tableId: order.restaurantTableId,
    tableLabel: order.restaurantTable?.tableName ?? null,
    reservationId: order.reservationId,
    customerId: order.customerId,
    itemIds: cartItems.map((item) => item.id),
    subtotalCents,
    discountCents,
    taxCents,
    totalCents: posOrder.totalCents,
    currency: "GBP",
    isHeld: false,
    updatedAt: iso(order.updatedAt),
  };

  const payments = mapOrderPayments(order.payments, order.id, scope, meta);
  const receipt = mapOrderReceipt(order.payments.find((payment) => payment.receipt)?.receipt ?? null, posOrder, meta);
  const discounts = meta.discounts ?? [];
  const taxes =
    meta.taxes ??
    (taxCents > 0
      ? [
          {
            id: createId("tax"),
            orderId: order.id,
            taxName: "VAT",
            taxRateBps: 2000,
            taxableAmountCents: subtotalCents - discountCents,
            taxAmountCents: taxCents,
            jurisdiction: "GB",
          },
        ]
      : []);

  return {
    session,
    order: posOrder,
    cart,
    cartItems,
    payments,
    splitBill: meta.splitBill ?? null,
    discounts,
    taxes,
    receipt,
    refunds: meta.refunds ?? [],
    transactions: meta.transactions ?? [],
    analytics: buildAnalytics(posOrder, cartItems, payments, meta),
    aiContext: buildAiContext(posOrder, cartItems, meta),
  };
}

export function mapCartSessionToRecord(
  cart: CartWithRelations,
  session: OrderSession,
  scope: PosTenantScope,
  branchMeta: StoredPosBranchMeta,
): PosRecord {
  const isHeld = isHeldSessionNotes(session.orderNotes);
  const subtotalCents = decimalToPence(cart.subtotal);
  const taxCents = Math.round(subtotalCents * 0.2);
  const totalCents = subtotalCents + taxCents;
  const posSession = buildSession(scope, {}, branchMeta);
  const orderId = session.id;

  const cartItems: PosCartItem[] = cart.items.map((item) => ({
    id: item.id,
    cartId: cart.id,
    menuItemId: item.menuItemId,
    name: item.menuItem.name,
    quantity: item.quantity,
    unitPriceCents: decimalToPence(item.unitPrice),
    totalPriceCents: decimalToPence(item.totalPrice),
    modifiers: [],
    notes: item.notes,
    taxRateBps: 2000,
    discountCents: 0,
  }));

  const order: PosOrder = {
    id: orderId,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    sessionId: posSession.id,
    registerId: scope.registerId,
    terminalId: scope.terminalId,
    orderNumber: `DRAFT-${session.id.slice(0, 8).toUpperCase()}`,
    status: isHeld ? POS_ORDER_STATUSES.HELD : POS_ORDER_STATUSES.OPEN,
    source: "dine_in",
    tableId: session.tableId,
    tableLabel: null,
    reservationId: null,
    customerId: null,
    employeeId: scope.userId,
    guestCount: null,
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
    createdAt: iso(session.createdAt),
    updatedAt: iso(session.updatedAt),
    paidAt: null,
  };

  const posCart: PosCart = {
    id: cart.id,
    sessionId: posSession.id,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    orderId: null,
    tableId: session.tableId,
    tableLabel: null,
    reservationId: null,
    customerId: null,
    itemIds: cartItems.map((item) => item.id),
    subtotalCents,
    discountCents: 0,
    taxCents,
    totalCents,
    currency: "GBP",
    isHeld,
    updatedAt: iso(cart.updatedAt),
  };

  return {
    session: posSession,
    order,
    cart: posCart,
    cartItems,
    payments: [],
    splitBill: null,
    discounts: [],
    taxes: [],
    receipt: null,
    refunds: [],
    transactions: [],
    analytics: buildAnalytics(order, cartItems, [], {}),
    aiContext: buildAiContext(order, cartItems, {}),
  };
}

export function mapStaffToEmployee(
  staff: { id: string; firstName: string; lastName: string; email: string | null },
  scope: PosTenantScope,
): PosEmployee {
  return {
    id: staff.id,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    userId: staff.id,
    displayName: `${staff.firstName} ${staff.lastName}`.trim() || staff.email || "Staff",
    pin: null,
    role: "cashier",
    isActive: true,
    canRefund: true,
    canDiscount: true,
    maxDiscountBps: 2000,
  };
}

export function appendPosTransaction(
  meta: StoredPosMeta,
  transaction: Omit<PosTransaction, "id">,
): StoredPosMeta {
  return {
    ...meta,
    transactions: [...(meta.transactions ?? []), { ...transaction, id: createId("txn") }],
  };
}

export function appendPosRefund(meta: StoredPosMeta, refund: Omit<PosRefund, "id">): StoredPosMeta {
  return {
    ...meta,
    refunds: [...(meta.refunds ?? []), { ...refund, id: createId("refund") }],
  };
}

export function appendPosDiscount(meta: StoredPosMeta, discount: Omit<PosDiscount, "id">): StoredPosMeta {
  return {
    ...meta,
    discounts: [...(meta.discounts ?? []), { ...discount, id: createId("disc") }],
  };
}
