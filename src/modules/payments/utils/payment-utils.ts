import type { PaymentData, OrderPaymentSummary } from "@/services/payment.service";
import type {
  OrderPaymentSummaryView,
  PaymentOrderContextView,
  PaymentView,
  UnpaidOrderView,
} from "@/modules/payments/types/payments";
import {
  calculateChangeDuePence,
  formatMoneyPence,
  formatPenceAsInput,
  parseDecimalInputToPence,
} from "@/modules/payments/utils/currency";

/** Format a pence amount using the default payment currency. */
export function formatPaymentMoney(pence: number): string {
  return formatMoneyPence(pence);
}

export function serializePayment(payment: PaymentData): PaymentView {
  return {
    id: payment.id,
    orderId: payment.orderId,
    method: payment.method,
    amount: payment.amount,
    amountTendered: payment.amountTendered,
    status: payment.status,
    notes: payment.notes,
    createdAt: payment.createdAt.toISOString(),
  };
}

export function serializePaymentSummary(summary: OrderPaymentSummary): OrderPaymentSummaryView {
  return {
    orderId: summary.orderId,
    orderNumber: summary.orderNumber,
    orderTotal: summary.orderTotal,
    amountPaid: summary.amountPaid,
    remainingBalance: summary.remainingBalance,
    changeDue: summary.changeDue,
    isFullyPaid: summary.isFullyPaid,
    payments: summary.payments.map(serializePayment),
  };
}

export function serializeUnpaidOrder(order: {
  orderId: string;
  orderNumber: string;
  orderTotal: number;
  amountPaid: number;
  remainingBalance: number;
  customerName: string | null;
  tableName: string | null;
  createdAt: string;
  isFullyPaid: boolean;
}): UnpaidOrderView {
  return order;
}

export function serializePaymentOrderContext(input: {
  order: {
    id: string;
    orderNumber: string;
    total: number;
    customerName: string | null;
    tableId: string | null;
    items: Array<{ id: string }>;
  };
  tableName: string | null;
  summary: OrderPaymentSummary;
}): PaymentOrderContextView {
  return {
    orderId: input.order.id,
    orderNumber: input.order.orderNumber,
    orderTotal: input.summary.orderTotal,
    customerName: input.order.customerName,
    tableName: input.tableName,
    itemCount: input.order.items.length,
    summary: serializePaymentSummary(input.summary),
  };
}

export function calculateCashChange(amountPence: number, amountTenderedPence: number): number {
  return calculateChangeDuePence(amountPence, amountTenderedPence);
}

export function parsePaymentAmount(value: string): number | null {
  return parseDecimalInputToPence(value);
}

export function formatPaymentAmountInput(pence: number): string {
  return formatPenceAsInput(pence);
}
