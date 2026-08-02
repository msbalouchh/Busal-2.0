import "server-only";

import { type PaymentMethod, type PaymentStatus, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { branchFilter } from "@/modules/business-context/utils/branch-scope";
import { calculateChangeDuePence, moneyDecimalToPence } from "@/modules/payments/utils/currency";
import {
  assertIntegerPence,
  calculateRemainingBalancePence,
} from "@/modules/payments/utils/payment-calculations";
import { createReceiptForPayment } from "@/services/receipt.service";
import { deductStockForCompletedOrder } from "@/services/inventory-stock.service";
import { processCrmForCompletedOrder } from "@/services/crm.service";
import { getOrder } from "@/services/order.service";

export interface PaymentData {
  id: string;
  businessId: string;
  orderId: string;
  staffId: string | null;
  method: PaymentMethod;
  /** Amount stored in pence. */
  amount: number;
  /** Cash tendered stored in pence. */
  amountTendered: number | null;
  status: PaymentStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderPaymentSummary {
  orderId: string;
  orderNumber: string;
  /** Values are stored in pence. */
  orderTotal: number;
  amountPaid: number;
  remainingBalance: number;
  changeDue: number;
  isFullyPaid: boolean;
  payments: PaymentData[];
}

export interface RecordPaymentInput {
  method: PaymentMethod;
  /** Payment amount in pence. */
  amountPence: number;
  /** Cash tendered in pence. */
  amountTenderedPence?: number | null;
  notes?: string | null;
}

const paymentSelect = {
  id: true,
  businessId: true,
  orderId: true,
  staffId: true,
  method: true,
  amount: true,
  amountTendered: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PaymentSelect;

type PaymentRecord = Prisma.PaymentGetPayload<{ select: typeof paymentSelect }>;

function mapPayment(payment: PaymentRecord): PaymentData {
  return {
    id: payment.id,
    businessId: payment.businessId,
    orderId: payment.orderId,
    staffId: payment.staffId,
    method: payment.method,
    amount: payment.amount,
    amountTendered: payment.amountTendered,
    status: payment.status,
    notes: payment.notes,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

async function getCompletedPaymentTotalPence(orderId: string): Promise<number> {
  const payments = await prisma.payment.findMany({
    where: { orderId, status: "COMPLETED" },
    select: { amount: true },
  });

  return payments.reduce((sum, payment) => sum + payment.amount, 0);
}

async function completeOrderIfFullyPaid(
  orderId: string,
  orderTotalPence: number,
  businessId: string,
  staffId: string | null,
  paymentId?: string | null,
): Promise<boolean> {
  const amountPaidPence = await getCompletedPaymentTotalPence(orderId);

  if (amountPaidPence >= orderTotalPence) {
    const order = await prisma.legacyOrder.findUnique({
      where: { id: orderId },
      select: { status: true },
    });

    if (order?.status === "COMPLETED") {
      return false;
    }

    await prisma.legacyOrder.update({
      where: { id: orderId },
      data: { status: "COMPLETED" },
    });

    await deductStockForCompletedOrder(businessId, orderId, staffId, paymentId ?? null);

    await processCrmForCompletedOrder(businessId, orderId, staffId, paymentId ?? null);

    return true;
  }

  return false;
}

async function assertOrderPayable(orderId: string, businessId: string) {
  const order = await prisma.legacyOrder.findFirst({
    where: { id: orderId, businessId },
    select: { id: true, status: true, total: true, orderNumber: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status === "CANCELLED") {
    throw new Error("Cancelled orders cannot be paid");
  }

  if (order.status === "COMPLETED") {
    const amountPaidPence = await getCompletedPaymentTotalPence(orderId);
    const orderTotalPence = moneyDecimalToPence(order.total);
    if (amountPaidPence >= orderTotalPence) {
      throw new Error("Order is already fully paid");
    }
  }

  return order;
}

export async function listPaymentsForOrder(orderId: string): Promise<PaymentData[]> {
  const payments = await prisma.payment.findMany({
    where: { orderId },
    select: paymentSelect,
    orderBy: [{ createdAt: "asc" }],
  });

  return payments.map(mapPayment);
}

export async function getOrderPaymentSummary(
  orderId: string,
  businessId: string,
): Promise<OrderPaymentSummary> {
  const order = await prisma.legacyOrder.findFirst({
    where: { id: orderId, businessId },
    select: { id: true, orderNumber: true, total: true, status: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const payments = await listPaymentsForOrder(orderId);
  const completedPayments = payments.filter((payment) => payment.status === "COMPLETED");
  const amountPaid = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const orderTotal = moneyDecimalToPence(order.total);
  const remainingBalance = calculateRemainingBalancePence(orderTotal, amountPaid);
  const lastCashPayment = [...completedPayments]
    .reverse()
    .find((payment) => payment.method === "CASH");
  const changeDue =
    lastCashPayment && lastCashPayment.amountTendered != null
      ? calculateChangeDuePence(lastCashPayment.amount, lastCashPayment.amountTendered)
      : 0;

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderTotal,
    amountPaid,
    remainingBalance,
    changeDue,
    isFullyPaid: remainingBalance <= 0,
    payments,
  };
}

export async function listUnpaidOrders(businessId: string, branchId: string | null = null) {
  const orders = await prisma.legacyOrder.findMany({
    where: {
      businessId,
      ...branchFilter(branchId),
      status: { notIn: ["CANCELLED", "COMPLETED"] },
    },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      customerName: true,
      tableId: true,
      createdAt: true,
      table: { select: { name: true } },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const summaries = await Promise.all(
    orders.map(async (order) => {
      const amountPaid = await getCompletedPaymentTotalPence(order.id);
      const orderTotal = moneyDecimalToPence(order.total);
      const remainingBalance = calculateRemainingBalancePence(orderTotal, amountPaid);

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderTotal,
        amountPaid,
        remainingBalance,
        customerName: order.customerName,
        tableName: order.table?.name ?? null,
        createdAt: order.createdAt.toISOString(),
        isFullyPaid: remainingBalance <= 0,
      };
    }),
  );

  return summaries.filter((entry) => !entry.isFullyPaid);
}

export async function recordPayment(
  businessId: string,
  orderId: string,
  staffId: string | null,
  input: RecordPaymentInput,
  branchId: string | null = null,
): Promise<{ payment: PaymentData; summary: OrderPaymentSummary; receiptId: string }> {
  const order = await assertOrderPayable(orderId, businessId);
  const orderTotalPence = moneyDecimalToPence(order.total);
  const amountPaidPence = await getCompletedPaymentTotalPence(orderId);
  const remainingBalancePence = calculateRemainingBalancePence(orderTotalPence, amountPaidPence);

  if (remainingBalancePence <= 0) {
    throw new Error("Order is already fully paid");
  }

  const amountPence = assertIntegerPence(input.amountPence, "Payment amount");

  if (amountPence <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  if (amountPence > remainingBalancePence) {
    throw new Error("Payment amount exceeds remaining balance");
  }

  if (input.method === "CASH" && input.amountTenderedPence != null) {
    assertIntegerPence(input.amountTenderedPence, "Cash tendered");
    if (input.amountTenderedPence < amountPence) {
      throw new Error("Cash tendered is less than payment amount");
    }
  }

  if (
    input.method === "CARD" &&
    input.amountTenderedPence != null &&
    input.amountTenderedPence !== amountPence
  ) {
    throw new Error("Card payments must match the payment amount");
  }

  const payment = await prisma.payment.create({
    data: {
      businessId,
      branchId,
      orderId,
      staffId,
      method: input.method,
      amount: amountPence,
      amountTendered: input.amountTenderedPence ?? null,
      status: "COMPLETED",
      notes: input.notes?.trim() || null,
    },
    select: paymentSelect,
  });

  await completeOrderIfFullyPaid(orderId, orderTotalPence, businessId, staffId, payment.id);

  const receipt = await createReceiptForPayment(businessId, payment.id, staffId, branchId);

  return {
    payment: mapPayment(payment),
    summary: await getOrderPaymentSummary(orderId, businessId),
    receiptId: receipt.id,
  };
}

export async function voidPayment(
  paymentId: string,
  businessId: string,
): Promise<OrderPaymentSummary> {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, businessId },
    select: { id: true, orderId: true, status: true },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payment.status !== "COMPLETED") {
    throw new Error("Only completed payments can be voided");
  }

  const order = await prisma.legacyOrder.findUnique({
    where: { id: payment.orderId },
    select: { status: true },
  });

  if (order?.status === "COMPLETED") {
    throw new Error("Cannot void payments after order completion");
  }

  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "VOIDED" },
  });

  return getOrderPaymentSummary(payment.orderId, businessId);
}

export async function refundPaymentPlaceholder(
  paymentId: string,
  businessId: string,
): Promise<never> {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, businessId },
    select: { id: true },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  throw new Error("Refund processing is not available yet");
}

export async function getPaymentOrderContext(orderId: string, businessId: string) {
  const order = await getOrder(orderId);

  if (order.businessId !== businessId) {
    throw new Error("Order not found");
  }

  const summary = await getOrderPaymentSummary(orderId, businessId);

  return { order, summary };
}
