import type {
  OrderPaymentMethod,
  OrderPaymentStatus,
  PaymentTransactionType,
  Prisma,
  RestaurantOrderPaymentStatus,
} from "@prisma/client";

import type {
  OrderPaymentListQuery,
  OrderPaymentRecord,
  OrderPaymentSummary,
  RecordOrderPaymentInput,
  RefundOrderPaymentInput,
  SplitOrderPaymentInput,
} from "@/modules/payment-receipt-management/types/payment-receipt-types";

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function validatePaymentAmount(amount: number, field = "Amount"): void {
  if (Number.isNaN(amount) || amount <= 0) {
    throw new Error(`${field} must be greater than zero`);
  }
}

export function validateTipAmount(tip: number | undefined): void {
  if (tip == null) return;
  if (Number.isNaN(tip) || tip < 0) {
    throw new Error("Tip must be zero or greater");
  }
}

export function validateCashTendered(amountPaid: number, amountTendered: number | undefined): void {
  if (amountTendered == null) return;
  if (Number.isNaN(amountTendered) || amountTendered < amountPaid) {
    throw new Error("Amount tendered must be at least the payment amount");
  }
}

export function validateSplitPayments(
  lines: SplitOrderPaymentInput["lines"],
  remainingBalance: number,
): void {
  if (!lines.length) {
    throw new Error("Split payment requires at least one line");
  }

  const total = roundMoney(lines.reduce((sum, line) => sum + line.amountPaid, 0));

  if (total > roundMoney(remainingBalance)) {
    throw new Error("Split payment total exceeds remaining balance");
  }

  for (const line of lines) {
    validatePaymentAmount(line.amountPaid);
    validateTipAmount(line.tipAmount);
    if (line.paymentMethod === "CASH") {
      validateCashTendered(line.amountPaid, line.amountTendered ?? line.amountPaid);
    }
  }
}

export function validateRecordPaymentInput(
  input: RecordOrderPaymentInput,
  remainingBalance: number,
): void {
  validatePaymentAmount(input.amountPaid);
  validateTipAmount(input.tipAmount);

  if (roundMoney(input.amountPaid) > roundMoney(remainingBalance)) {
    throw new Error("Payment exceeds remaining balance");
  }

  if (input.paymentMethod === "CASH") {
    validateCashTendered(input.amountPaid, input.amountTendered ?? input.amountPaid);
  }
}

export function validateRefundInput(input: RefundOrderPaymentInput, maxRefundable: number): void {
  validatePaymentAmount(input.amount, "Refund amount");

  if (roundMoney(input.amount) > roundMoney(maxRefundable)) {
    throw new Error("Refund amount exceeds refundable balance");
  }
}

export function calculateChangeGiven(amountPaid: number, amountTendered: number): number {
  return roundMoney(Math.max(0, amountTendered - amountPaid));
}

export function mapOrderPaymentStatusToOrder(
  paidTotal: number,
  orderTotal: number,
): RestaurantOrderPaymentStatus {
  if (paidTotal <= 0) return "UNPAID";
  if (paidTotal < orderTotal) return "PARTIALLY_PAID";
  return "PAID";
}

export function isCountablePaymentStatus(status: OrderPaymentStatus): boolean {
  return status === "PAID" || status === "PARTIALLY_PAID";
}

export const ACTIVE_PAYMENT_STATUSES: OrderPaymentStatus[] = ["PAID", "PARTIALLY_PAID"];

export const PAYMENT_METHOD_LABELS: Record<OrderPaymentMethod, string> = {
  CASH: "Cash",
  CARD: "Card",
  CONTACTLESS: "Contactless",
  APPLE_PAY: "Apple Pay",
  GOOGLE_PAY: "Google Pay",
  BANK_TRANSFER: "Bank Transfer",
  GIFT_CARD: "Gift Card",
  STORE_CREDIT: "Store Credit",
  OTHER: "Other",
};

export const PAYMENT_STATUS_LABELS: Record<OrderPaymentStatus, string> = {
  PENDING: "Pending",
  PARTIALLY_PAID: "Partially paid",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
  VOIDED: "Voided",
};

export const TRANSACTION_TYPE_LABELS: Record<PaymentTransactionType, string> = {
  SALE: "Sale",
  REFUND: "Refund",
  VOID: "Void",
  TIP: "Tip",
};

export function buildPaymentListWhere(
  businessId: string,
  query: OrderPaymentListQuery,
): Prisma.OrderPaymentWhereInput {
  const where: Prisma.OrderPaymentWhereInput = {
    businessId,
    branchId: query.branchId,
  };

  if (query.status && query.status !== "ALL") {
    where.status = query.status;
  }

  if (query.paymentMethod && query.paymentMethod !== "ALL") {
    where.paymentMethod = query.paymentMethod;
  }

  if (query.search?.trim()) {
    const search = query.search.trim();
    where.OR = [
      { paymentNumber: { contains: search, mode: "insensitive" } },
      { transactionReference: { contains: search, mode: "insensitive" } },
      { order: { orderNumber: { contains: search, mode: "insensitive" } } },
    ];
  }

  return where;
}

export type { OrderPaymentRecord, OrderPaymentSummary };
