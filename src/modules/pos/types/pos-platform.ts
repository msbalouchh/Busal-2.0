import type {
  PosCashDrawerEventType,
  PosDiscountType,
  PosOrderSource,
  PosOrderStatus,
  PosPaymentType,
  PosReceiptChannel,
  PosRefundReason,
  PosShiftStatus,
} from "@/modules/pos/constants/pos-status";

/** Active POS operator session on a terminal. */
export interface PosSession {
  id: string;
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  terminalId: string;
  registerId: string;
  shiftId: string;
  employeeId: string;
  startedAt: string;
  endedAt: string | null;
  isActive: boolean;
  isOffline: boolean;
  lastSyncAt: string | null;
}

/** Physical or virtual POS terminal device. */
export interface PosTerminal {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  registerId: string;
  name: string;
  deviceId: string;
  isActive: boolean;
  isOfflineCapable: boolean;
  lastHeartbeatAt: string;
  createdAt: string;
  updatedAt: string;
}

/** Cash register / checkout lane within a branch. */
export interface PosRegister {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  name: string;
  code: string;
  defaultTerminalId: string | null;
  cashDrawerId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** In-progress shopping cart before checkout. */
export interface PosCart {
  id: string;
  sessionId: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  orderId: string | null;
  tableId: string | null;
  tableLabel: string | null;
  reservationId: string | null;
  customerId: string | null;
  itemIds: string[];
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  isHeld: boolean;
  updatedAt: string;
}

/** Cart line item. */
export interface PosCartItem {
  id: string;
  cartId: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  modifiers: string[];
  notes: string | null;
  taxRateBps: number;
  discountCents: number;
}

/** POS order aggregate header. */
export interface PosOrder {
  id: string;
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  sessionId: string;
  registerId: string;
  terminalId: string;
  orderNumber: string;
  status: PosOrderStatus;
  source: PosOrderSource;
  tableId: string | null;
  tableLabel: string | null;
  reservationId: string | null;
  customerId: string | null;
  employeeId: string;
  guestCount: number | null;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  currency: string;
  kitchenOrderId: string | null;
  isSplit: boolean;
  isMerged: boolean;
  mergedIntoOrderId: string | null;
  transferredFromTableId: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
}

/** Payment record for an order. */
export interface PosPayment {
  id: string;
  orderId: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  paymentType: PosPaymentType;
  amountCents: number;
  tipCents: number;
  currency: string;
  reference: string | null;
  cardLast4: string | null;
  isSuccessful: boolean;
  processedAt: string;
  processedByEmployeeId: string;
}

/** Split bill configuration. */
export interface PosSplitBill {
  id: string;
  orderId: string;
  splitCount: number;
  splitMethod: "equal" | "by_item" | "by_amount" | "by_guest";
  portions: PosSplitPortion[];
  createdAt: string;
}

export interface PosSplitPortion {
  id: string;
  splitBillId: string;
  label: string;
  amountCents: number;
  itemIds: string[];
  paymentId: string | null;
  isPaid: boolean;
}

/** Discount applied to order or item. */
export interface PosDiscount {
  id: string;
  orderId: string;
  cartItemId: string | null;
  discountType: PosDiscountType;
  label: string;
  promoCode: string | null;
  valueBps: number | null;
  amountCents: number;
  appliedByEmployeeId: string;
  appliedAt: string;
}

/** Tax line on an order. */
export interface PosTax {
  id: string;
  orderId: string;
  taxName: string;
  taxRateBps: number;
  taxableAmountCents: number;
  taxAmountCents: number;
  jurisdiction: string;
}

/** Receipt issued for a completed sale. */
export interface PosReceipt {
  id: string;
  orderId: string;
  receiptNumber: string;
  channel: PosReceiptChannel;
  recipientEmail: string | null;
  recipientPhone: string | null;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  currency: string;
  issuedAt: string;
  printedAt: string | null;
}

/** Refund against a prior payment. */
export interface PosRefund {
  id: string;
  orderId: string;
  paymentId: string;
  refundNumber: string;
  reason: PosRefundReason;
  amountCents: number;
  currency: string;
  isSuspicious: boolean;
  processedByEmployeeId: string;
  processedAt: string;
  approvedByEmployeeId: string | null;
}

/** Cash drawer state and events. */
export interface PosCashDrawer {
  id: string;
  registerId: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  openingBalanceCents: number;
  currentBalanceCents: number;
  expectedBalanceCents: number;
  currency: string;
  isOpen: boolean;
  lastOpenedAt: string | null;
  lastClosedAt: string | null;
  events: PosCashDrawerEvent[];
}

export interface PosCashDrawerEvent {
  id: string;
  drawerId: string;
  eventType: PosCashDrawerEventType;
  amountCents: number;
  reason: string | null;
  employeeId: string;
  occurredAt: string;
}

/** Employee shift on a register. */
export interface PosShift {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  registerId: string;
  employeeId: string;
  status: PosShiftStatus;
  openedAt: string;
  closedAt: string | null;
  openingCashCents: number;
  closingCashCents: number | null;
  expectedCashCents: number | null;
  varianceCents: number | null;
  totalSalesCents: number;
  totalRefundsCents: number;
  transactionCount: number;
}

/** POS employee profile (cashier/server). */
export interface PosEmployee {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  userId: string;
  displayName: string;
  pin: string | null;
  role: "cashier" | "manager" | "server" | "admin";
  isActive: boolean;
  canRefund: boolean;
  canDiscount: boolean;
  maxDiscountBps: number;
}

/** Financial transaction ledger entry. */
export interface PosTransaction {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  shiftId: string;
  orderId: string | null;
  paymentId: string | null;
  refundId: string | null;
  transactionType: "sale" | "refund" | "void" | "tip" | "drawer";
  amountCents: number;
  currency: string;
  paymentType: PosPaymentType | null;
  employeeId: string;
  occurredAt: string;
}

/** Performance metrics for POS operations. */
export interface PosAnalytics {
  orderId: string;
  avgTicketCents: number;
  itemCount: number;
  discountRateBps: number;
  taxRateBps: number;
  paymentMix: Partial<Record<PosPaymentType, number>>;
  prepToPayMinutes: number | null;
  upsellCount: number;
  refundRateBps: number;
}

/** AI-enriched context for POS intelligence. */
export interface PosAiContext {
  orderId: string;
  summary: string;
  suggestedUpsells: string[];
  recommendedDiscountBps: number | null;
  busyHourScore: number;
  revenueForecastCents: number | null;
  suspiciousRefundScore: number;
  promotionSuggestions: string[];
  insights: string[];
  lastGeneratedAt: string;
}

/** Full POS sale aggregate — single source of truth. */
export interface PosRecord {
  session: PosSession;
  order: PosOrder;
  cart: PosCart;
  cartItems: PosCartItem[];
  payments: PosPayment[];
  splitBill: PosSplitBill | null;
  discounts: PosDiscount[];
  taxes: PosTax[];
  receipt: PosReceipt | null;
  refunds: PosRefund[];
  transactions: PosTransaction[];
  analytics: PosAnalytics;
  aiContext: PosAiContext;
}

export interface PosSearchQuery {
  query?: string;
  tenantId?: string;
  businessId?: string;
  branchId?: string;
  registerId?: string;
  shiftId?: string;
  status?: PosOrderStatus;
  paymentType?: PosPaymentType;
  employeeId?: string;
  tableId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

export interface CreatePosSaleInput {
  sessionId: string;
  source?: PosOrderSource;
  tableId?: string;
  tableLabel?: string;
  reservationId?: string;
  customerId?: string;
  guestCount?: number;
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
    modifiers?: string[];
    notes?: string;
  }>;
}

export interface ApplyPosDiscountInput {
  orderId: string;
  discountType: PosDiscountType;
  label: string;
  valueBps?: number;
  amountCents?: number;
  promoCode?: string;
  appliedByEmployeeId: string;
}

export interface SplitPosBillInput {
  orderId: string;
  splitCount: number;
  splitMethod: PosSplitBill["splitMethod"];
}

export interface ProcessPosPaymentInput {
  orderId: string;
  paymentType: PosPaymentType;
  amountCents: number;
  tipCents?: number;
  reference?: string;
  processedByEmployeeId: string;
}

export interface ProcessPosRefundInput {
  orderId: string;
  paymentId: string;
  reason: PosRefundReason;
  amountCents: number;
  processedByEmployeeId: string;
}

export interface TransferPosTableInput {
  orderId: string;
  fromTableId: string;
  toTableId: string;
  toTableLabel: string;
}

export interface MergePosBillsInput {
  sourceOrderIds: string[];
  targetOrderId: string;
}

export interface PosPlatformContext {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
  registerId: string;
  terminalId: string;
  shiftId: string;
}

export interface PosContextValue {
  context: PosPlatformContext;
  records: PosRecord[];
  registers: PosRegister[];
  terminals: PosTerminal[];
  shifts: PosShift[];
  employees: PosEmployee[];
  cashDrawers: PosCashDrawer[];
  activeSession: PosSession | null;
  selectedOrderId: string | null;
  selectedOrder: PosRecord | null;
  selectOrder: (orderId: string | null) => void;
  searchOrders: (query: PosSearchQuery) => PosRecord[];
  refresh: () => void;
  isRefreshing?: boolean;
  error?: string | null;
}

export interface PosCartContextValue {
  cart: PosCart | null;
  cartItems: PosCartItem[];
  subtotalCents: number;
  totalCents: number;
  refresh: () => void;
}

export interface PosShiftContextValue {
  shift: PosShift | null;
  isOpen: boolean;
  totalSalesCents: number;
  transactionCount: number;
  refresh: () => void;
}
