import type {
  OrderPaymentRecord,
  OrderPaymentSummary,
  UnpaidOrderOption,
} from "@/modules/payment-receipt-management/types/payment-receipt-types";
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

export function formatPaymentMoney(pence: number): string {
  return formatMoneyPence(pence);
}

export function serializePayment(payment: OrderPaymentRecord): PaymentView {
  return {
    id: payment.id,
    orderId: payment.orderId,
    method: payment.paymentMethod as PaymentView["method"],
    amount: Math.round(payment.amountPaid * 100),
    amountTendered: null,
    status: payment.status as PaymentView["status"],
    notes: null,
    createdAt: payment.paidAt ?? payment.createdAt,
  };
}

export function serializePaymentSummary(summary: OrderPaymentSummary): OrderPaymentSummaryView {
  return {
    orderId: summary.orderId,
    orderNumber: summary.orderNumber,
    orderTotal: Math.round(summary.orderTotal * 100),
    amountPaid: Math.round(summary.amountPaid * 100),
    remainingBalance: Math.round(summary.remainingBalance * 100),
    changeDue: Math.round(summary.changeDue * 100),
    isFullyPaid: summary.remainingBalance <= 0,
    payments: summary.payments.map(serializePayment),
  };
}

export function serializeUnpaidOrder(order: UnpaidOrderOption): UnpaidOrderView {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderTotal: Math.round(order.totalAmount * 100),
    amountPaid: Math.round(order.amountPaid * 100),
    remainingBalance: Math.round(order.remainingBalance * 100),
    customerName: null,
    tableName: order.tableLabel,
    createdAt: new Date().toISOString(),
    isFullyPaid: order.remainingBalance <= 0,
  };
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
    orderTotal: Math.round(input.summary.orderTotal * 100),
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
