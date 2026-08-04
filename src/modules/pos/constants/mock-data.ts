import {
  POS_CASH_DRAWER_EVENT_TYPES,
  POS_DISCOUNT_TYPES,
  POS_ORDER_SOURCES,
  POS_ORDER_STATUSES,
  POS_PAYMENT_TYPES,
  POS_RECEIPT_CHANNELS,
  POS_SHIFT_STATUSES,
} from "@/modules/pos/constants/pos-status";
import type {
  PosCart,
  PosCartItem,
  PosCashDrawer,
  PosEmployee,
  PosOrder,
  PosPayment,
  PosRecord,
  PosRegister,
  PosSession,
  PosShift,
  PosTerminal,
} from "@/modules/pos/types/pos-platform";

export const DEFAULT_POS_SCOPE = {
  tenantId: "tenant-harbour",
  workspaceId: "ws-harbour-kitchen",
  businessId: "biz-harbour-kitchen",
  branchId: "branch-harbour-main",
  userId: "user-harbour-owner",
  registerId: "register-main",
  terminalId: "terminal-main-1",
  shiftId: "shift-current",
  sessionId: "session-active",
  employeeId: "emp-cashier-1",
} as const;

const NOW = "2026-02-15T19:00:00.000Z";

export const MOCK_POS_REGISTER: PosRegister = {
  id: DEFAULT_POS_SCOPE.registerId,
  tenantId: DEFAULT_POS_SCOPE.tenantId,
  businessId: DEFAULT_POS_SCOPE.businessId,
  branchId: DEFAULT_POS_SCOPE.branchId,
  name: "Main Register",
  code: "REG-01",
  defaultTerminalId: DEFAULT_POS_SCOPE.terminalId,
  cashDrawerId: "drawer-main",
  isActive: true,
  createdAt: NOW,
  updatedAt: NOW,
};

export const MOCK_POS_TERMINALS: PosTerminal[] = [
  {
    id: DEFAULT_POS_SCOPE.terminalId,
    tenantId: DEFAULT_POS_SCOPE.tenantId,
    businessId: DEFAULT_POS_SCOPE.businessId,
    branchId: DEFAULT_POS_SCOPE.branchId,
    registerId: DEFAULT_POS_SCOPE.registerId,
    name: "Terminal 1",
    deviceId: "device-pos-001",
    isActive: true,
    isOfflineCapable: true,
    lastHeartbeatAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "terminal-main-2",
    tenantId: DEFAULT_POS_SCOPE.tenantId,
    businessId: DEFAULT_POS_SCOPE.businessId,
    branchId: DEFAULT_POS_SCOPE.branchId,
    registerId: DEFAULT_POS_SCOPE.registerId,
    name: "Terminal 2",
    deviceId: "device-pos-002",
    isActive: true,
    isOfflineCapable: true,
    lastHeartbeatAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const MOCK_POS_SHIFT: PosShift = {
  id: DEFAULT_POS_SCOPE.shiftId,
  tenantId: DEFAULT_POS_SCOPE.tenantId,
  businessId: DEFAULT_POS_SCOPE.businessId,
  branchId: DEFAULT_POS_SCOPE.branchId,
  registerId: DEFAULT_POS_SCOPE.registerId,
  employeeId: DEFAULT_POS_SCOPE.employeeId,
  status: POS_SHIFT_STATUSES.OPEN,
  openedAt: "2026-02-15T10:00:00.000Z",
  closedAt: null,
  openingCashCents: 20000,
  closingCashCents: null,
  expectedCashCents: null,
  varianceCents: null,
  totalSalesCents: 485000,
  totalRefundsCents: 3500,
  transactionCount: 42,
};

export const MOCK_POS_EMPLOYEES: PosEmployee[] = [
  {
    id: DEFAULT_POS_SCOPE.employeeId,
    tenantId: DEFAULT_POS_SCOPE.tenantId,
    businessId: DEFAULT_POS_SCOPE.businessId,
    branchId: DEFAULT_POS_SCOPE.branchId,
    userId: DEFAULT_POS_SCOPE.userId,
    displayName: "Sarah Chen",
    pin: null,
    role: "cashier",
    isActive: true,
    canRefund: false,
    canDiscount: true,
    maxDiscountBps: 1000,
  },
  {
    id: "emp-manager-1",
    tenantId: DEFAULT_POS_SCOPE.tenantId,
    businessId: DEFAULT_POS_SCOPE.businessId,
    branchId: DEFAULT_POS_SCOPE.branchId,
    userId: "user-harbour-manager",
    displayName: "James Wright",
    pin: null,
    role: "manager",
    isActive: true,
    canRefund: true,
    canDiscount: true,
    maxDiscountBps: 2500,
  },
];

export const MOCK_POS_CASH_DRAWER: PosCashDrawer = {
  id: "drawer-main",
  registerId: DEFAULT_POS_SCOPE.registerId,
  tenantId: DEFAULT_POS_SCOPE.tenantId,
  businessId: DEFAULT_POS_SCOPE.businessId,
  branchId: DEFAULT_POS_SCOPE.branchId,
  openingBalanceCents: 20000,
  currentBalanceCents: 78500,
  expectedBalanceCents: 78000,
  currency: "GBP",
  isOpen: true,
  lastOpenedAt: "2026-02-15T10:00:00.000Z",
  lastClosedAt: null,
  events: [
    {
      id: "drawer-event-1",
      drawerId: "drawer-main",
      eventType: POS_CASH_DRAWER_EVENT_TYPES.OPEN,
      amountCents: 0,
      reason: "Shift open",
      employeeId: DEFAULT_POS_SCOPE.employeeId,
      occurredAt: "2026-02-15T10:00:00.000Z",
    },
  ],
};

export const MOCK_POS_SESSION: PosSession = {
  id: DEFAULT_POS_SCOPE.sessionId,
  tenantId: DEFAULT_POS_SCOPE.tenantId,
  workspaceId: DEFAULT_POS_SCOPE.workspaceId,
  businessId: DEFAULT_POS_SCOPE.businessId,
  branchId: DEFAULT_POS_SCOPE.branchId,
  terminalId: DEFAULT_POS_SCOPE.terminalId,
  registerId: DEFAULT_POS_SCOPE.registerId,
  shiftId: DEFAULT_POS_SCOPE.shiftId,
  employeeId: DEFAULT_POS_SCOPE.employeeId,
  startedAt: "2026-02-15T10:00:00.000Z",
  endedAt: null,
  isActive: true,
  isOffline: false,
  lastSyncAt: NOW,
};

function buildRecord(partial: {
  orderId: string;
  orderNumber: string;
  status: (typeof POS_ORDER_STATUSES)[keyof typeof POS_ORDER_STATUSES];
  source: (typeof POS_ORDER_SOURCES)[keyof typeof POS_ORDER_SOURCES];
  tableLabel?: string;
  paymentType?: (typeof POS_PAYMENT_TYPES)[keyof typeof POS_PAYMENT_TYPES];
  subtotalCents: number;
  discountCents?: number;
  isSplit?: boolean;
  hasRefund?: boolean;
  items: Array<{ name: string; qty: number; priceCents: number }>;
}): PosRecord {
  const cartId = `cart-${partial.orderId}`;
  const taxCents = Math.round(partial.subtotalCents * 0.2);
  const discountCents = partial.discountCents ?? 0;
  const totalCents = partial.subtotalCents - discountCents + taxCents;

  const cartItems: PosCartItem[] = partial.items.map((item, index) => ({
    id: `cart-item-${partial.orderId}-${index}`,
    cartId,
    menuItemId: `menu-${index}`,
    name: item.name,
    quantity: item.qty,
    unitPriceCents: item.priceCents,
    totalPriceCents: item.priceCents * item.qty,
    modifiers: [],
    notes: null,
    taxRateBps: 2000,
    discountCents: 0,
  }));

  const cart: PosCart = {
    id: cartId,
    sessionId: DEFAULT_POS_SCOPE.sessionId,
    tenantId: DEFAULT_POS_SCOPE.tenantId,
    businessId: DEFAULT_POS_SCOPE.businessId,
    branchId: DEFAULT_POS_SCOPE.branchId,
    orderId: partial.orderId,
    tableId: partial.tableLabel ? "table-12" : null,
    tableLabel: partial.tableLabel ?? null,
    reservationId: null,
    customerId: null,
    itemIds: cartItems.map((i) => i.id),
    subtotalCents: partial.subtotalCents,
    discountCents,
    taxCents,
    totalCents,
    currency: "GBP",
    isHeld: partial.status === POS_ORDER_STATUSES.HELD,
    updatedAt: NOW,
  };

  const order: PosOrder = {
    id: partial.orderId,
    tenantId: DEFAULT_POS_SCOPE.tenantId,
    workspaceId: DEFAULT_POS_SCOPE.workspaceId,
    businessId: DEFAULT_POS_SCOPE.businessId,
    branchId: DEFAULT_POS_SCOPE.branchId,
    sessionId: DEFAULT_POS_SCOPE.sessionId,
    registerId: DEFAULT_POS_SCOPE.registerId,
    terminalId: DEFAULT_POS_SCOPE.terminalId,
    orderNumber: partial.orderNumber,
    status: partial.status,
    source: partial.source,
    tableId: partial.tableLabel ? "table-12" : null,
    tableLabel: partial.tableLabel ?? null,
    reservationId: null,
    customerId: null,
    employeeId: DEFAULT_POS_SCOPE.employeeId,
    guestCount: partial.tableLabel ? 2 : null,
    subtotalCents: partial.subtotalCents,
    discountCents,
    taxCents,
    tipCents: partial.status === POS_ORDER_STATUSES.PAID ? 500 : 0,
    totalCents: partial.status === POS_ORDER_STATUSES.PAID ? totalCents + 500 : totalCents,
    currency: "GBP",
    kitchenOrderId: partial.status !== POS_ORDER_STATUSES.DRAFT ? `ko-${partial.orderId}` : null,
    isSplit: partial.isSplit ?? false,
    isMerged: false,
    mergedIntoOrderId: null,
    transferredFromTableId: null,
    createdAt: "2026-02-15T18:45:00.000Z",
    updatedAt: NOW,
    paidAt: partial.status === POS_ORDER_STATUSES.PAID ? NOW : null,
  };

  const payments: PosPayment[] =
    partial.status === POS_ORDER_STATUSES.PAID && partial.paymentType
      ? [
          {
            id: `pay-${partial.orderId}`,
            orderId: partial.orderId,
            tenantId: DEFAULT_POS_SCOPE.tenantId,
            businessId: DEFAULT_POS_SCOPE.businessId,
            branchId: DEFAULT_POS_SCOPE.branchId,
            paymentType: partial.paymentType,
            amountCents: order.totalCents,
            tipCents: order.tipCents,
            currency: "GBP",
            reference: partial.paymentType === POS_PAYMENT_TYPES.CARD ? "txn_abc123" : null,
            cardLast4: partial.paymentType === POS_PAYMENT_TYPES.CARD ? "4242" : null,
            isSuccessful: true,
            processedAt: NOW,
            processedByEmployeeId: DEFAULT_POS_SCOPE.employeeId,
          },
        ]
      : [];

  return {
    session: MOCK_POS_SESSION,
    order,
    cart,
    cartItems,
    payments,
    splitBill: partial.isSplit
      ? {
          id: `split-${partial.orderId}`,
          orderId: partial.orderId,
          splitCount: 2,
          splitMethod: "equal",
          portions: [
            {
              id: `portion-${partial.orderId}-1`,
              splitBillId: `split-${partial.orderId}`,
              label: "Guest 1",
              amountCents: Math.round(totalCents / 2),
              itemIds: [cartItems[0]?.id ?? ""],
              paymentId: null,
              isPaid: false,
            },
            {
              id: `portion-${partial.orderId}-2`,
              splitBillId: `split-${partial.orderId}`,
              label: "Guest 2",
              amountCents: Math.round(totalCents / 2),
              itemIds: cartItems.slice(1).map((i) => i.id),
              paymentId: null,
              isPaid: false,
            },
          ],
          createdAt: NOW,
        }
      : null,
    discounts:
      discountCents > 0
        ? [
            {
              id: `disc-${partial.orderId}`,
              orderId: partial.orderId,
              cartItemId: null,
              discountType: POS_DISCOUNT_TYPES.PERCENTAGE,
              label: "Happy Hour 10%",
              promoCode: "HAPPY10",
              valueBps: 1000,
              amountCents: discountCents,
              appliedByEmployeeId: DEFAULT_POS_SCOPE.employeeId,
              appliedAt: NOW,
            },
          ]
        : [],
    taxes: [
      {
        id: `tax-${partial.orderId}`,
        orderId: partial.orderId,
        taxName: "VAT",
        taxRateBps: 2000,
        taxableAmountCents: partial.subtotalCents - discountCents,
        taxAmountCents: taxCents,
        jurisdiction: "GB",
      },
    ],
    receipt:
      partial.status === POS_ORDER_STATUSES.PAID
        ? {
            id: `receipt-${partial.orderId}`,
            orderId: partial.orderId,
            receiptNumber: `R-${partial.orderNumber}`,
            channel: POS_RECEIPT_CHANNELS.PRINT,
            recipientEmail: null,
            recipientPhone: null,
            subtotalCents: partial.subtotalCents,
            discountCents,
            taxCents,
            tipCents: order.tipCents,
            totalCents: order.totalCents,
            currency: "GBP",
            issuedAt: NOW,
            printedAt: NOW,
          }
        : null,
    refunds: partial.hasRefund
      ? [
          {
            id: `refund-${partial.orderId}`,
            orderId: partial.orderId,
            paymentId: `pay-${partial.orderId}`,
            refundNumber: `RF-${partial.orderNumber}`,
            reason: "customer_request",
            amountCents: 1500,
            currency: "GBP",
            isSuspicious: false,
            processedByEmployeeId: DEFAULT_POS_SCOPE.employeeId,
            processedAt: NOW,
            approvedByEmployeeId: "emp-manager-1",
          },
        ]
      : [],
    transactions:
      partial.status === POS_ORDER_STATUSES.PAID
        ? [
            {
              id: `txn-${partial.orderId}`,
              tenantId: DEFAULT_POS_SCOPE.tenantId,
              businessId: DEFAULT_POS_SCOPE.businessId,
              branchId: DEFAULT_POS_SCOPE.branchId,
              shiftId: DEFAULT_POS_SCOPE.shiftId,
              orderId: partial.orderId,
              paymentId: `pay-${partial.orderId}`,
              refundId: null,
              transactionType: "sale",
              amountCents: order.totalCents,
              currency: "GBP",
              paymentType: partial.paymentType ?? POS_PAYMENT_TYPES.CASH,
              employeeId: DEFAULT_POS_SCOPE.employeeId,
              occurredAt: NOW,
            },
          ]
        : [],
    analytics: {
      orderId: partial.orderId,
      avgTicketCents: totalCents,
      itemCount: cartItems.reduce((sum, i) => sum + i.quantity, 0),
      discountRateBps:
        discountCents > 0 ? Math.round((discountCents / partial.subtotalCents) * 10000) : 0,
      taxRateBps: 2000,
      paymentMix: partial.paymentType ? { [partial.paymentType]: 100 } : {},
      prepToPayMinutes: partial.status === POS_ORDER_STATUSES.PAID ? 8 : null,
      upsellCount: 0,
      refundRateBps: partial.hasRefund ? 500 : 0,
    },
    aiContext: {
      orderId: partial.orderId,
      summary: `#${partial.orderNumber} — ${partial.items.map((i) => i.name).join(", ")}`,
      suggestedUpsells: ["Garlic Bread", "House Wine"],
      recommendedDiscountBps: null,
      busyHourScore: 0.72,
      revenueForecastCents: 520000,
      suspiciousRefundScore: partial.hasRefund ? 0.15 : 0.02,
      promotionSuggestions: ["Dessert combo 15% off"],
      insights: partial.tableLabel ? [`Table ${partial.tableLabel} — dine-in`] : ["Counter order"],
      lastGeneratedAt: NOW,
    },
  };
}

export const MOCK_POS_RECORDS: PosRecord[] = [
  buildRecord({
    orderId: "pos-001",
    orderNumber: "2041",
    status: POS_ORDER_STATUSES.OPEN,
    source: POS_ORDER_SOURCES.DINE_IN,
    tableLabel: "Table 12",
    subtotalCents: 4500,
    items: [
      { name: "Ribeye Steak", qty: 1, priceCents: 2800 },
      { name: "Caesar Salad", qty: 1, priceCents: 950 },
      { name: "Sparkling Water", qty: 2, priceCents: 375 },
    ],
  }),
  buildRecord({
    orderId: "pos-002",
    orderNumber: "2042",
    status: POS_ORDER_STATUSES.PAID,
    source: POS_ORDER_SOURCES.DINE_IN,
    tableLabel: "Table 7",
    paymentType: POS_PAYMENT_TYPES.CARD,
    subtotalCents: 3200,
    discountCents: 320,
    items: [
      { name: "Margherita Pizza", qty: 1, priceCents: 1400 },
      { name: "Tiramisu", qty: 2, priceCents: 900 },
    ],
  }),
  buildRecord({
    orderId: "pos-003",
    orderNumber: "2043",
    status: POS_ORDER_STATUSES.HELD,
    source: POS_ORDER_SOURCES.BAR,
    tableLabel: "Bar 2",
    subtotalCents: 1800,
    isSplit: true,
    items: [
      { name: "Craft Beer Flight", qty: 1, priceCents: 1200 },
      { name: "Truffle Fries", qty: 1, priceCents: 600 },
    ],
  }),
  buildRecord({
    orderId: "pos-004",
    orderNumber: "2044",
    status: POS_ORDER_STATUSES.PAID,
    source: POS_ORDER_SOURCES.TAKEAWAY,
    paymentType: POS_PAYMENT_TYPES.APPLE_PAY,
    subtotalCents: 2400,
    items: [{ name: "Chicken Wrap", qty: 2, priceCents: 1200 }],
  }),
  buildRecord({
    orderId: "pos-005",
    orderNumber: "2045",
    status: POS_ORDER_STATUSES.PARTIALLY_REFUNDED,
    source: POS_ORDER_SOURCES.DINE_IN,
    tableLabel: "Table 3",
    paymentType: POS_PAYMENT_TYPES.MIXED,
    subtotalCents: 5600,
    hasRefund: true,
    items: [
      { name: "Surf & Turf", qty: 1, priceCents: 3800 },
      { name: "House Red", qty: 1, priceCents: 900 },
      { name: "Espresso", qty: 2, priceCents: 450 },
    ],
  }),
];

export const MOCK_POS_REGISTERS: PosRegister[] = [MOCK_POS_REGISTER];

export const MOCK_POS_SHIFTS: PosShift[] = [MOCK_POS_SHIFT];
