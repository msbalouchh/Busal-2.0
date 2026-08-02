import "server-only";

import { randomBytes } from "crypto";

import type { Prisma, RestaurantOrderPaymentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PAYMENT_LIST_PAGE_SIZE } from "@/modules/payment-receipt-management/constants/routes";
import {
  ACTIVE_PAYMENT_STATUSES,
  buildPaymentListWhere,
  calculateChangeGiven,
  mapOrderPaymentStatusToOrder,
  roundMoney,
  validateRecordPaymentInput,
  validateRefundInput,
  validateSplitPayments,
} from "@/modules/payment-receipt-management/lib/payment-validation";
import type {
  OrderPaymentListQuery,
  OrderPaymentListResult,
  OrderPaymentRecord,
  OrderPaymentSummary,
  PaymentDashboardStats,
  RecordOrderPaymentInput,
  RefundOrderPaymentInput,
  SplitOrderPaymentInput,
  UnpaidOrderOption,
  VoidOrderPaymentInput,
} from "@/modules/payment-receipt-management/types/payment-receipt-types";
import { createOrderReceiptForPayment } from "@/services/restaurant-order-receipt.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

const paymentInclude = {
  order: {
    select: {
      orderNumber: true,
      orderType: true,
      totalAmount: true,
      paymentStatus: true,
      restaurantTable: { select: { tableNumber: true, tableName: true } },
      customer: { select: { name: true } },
    },
  },
  processedBy: {
    select: { fullName: true, firstName: true, lastName: true },
  },
  transactions: { orderBy: [{ createdAt: "asc" as const }] },
  receipt: true,
} satisfies Prisma.OrderPaymentInclude;

type PaymentPayload = Prisma.OrderPaymentGetPayload<{ include: typeof paymentInclude }>;

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

function decimal(value: Prisma.Decimal | number): number {
  return Number(value);
}

function serializePayment(record: PaymentPayload): OrderPaymentRecord {
  return {
    id: record.id,
    businessId: record.businessId,
    branchId: record.branchId,
    orderId: record.orderId,
    paymentNumber: record.paymentNumber,
    paymentMethod: record.paymentMethod,
    paymentProvider: record.paymentProvider,
    status: record.status,
    subtotal: decimal(record.subtotal),
    discountAmount: decimal(record.discountAmount),
    taxAmount: decimal(record.taxAmount),
    serviceCharge: decimal(record.serviceCharge),
    tipAmount: decimal(record.tipAmount),
    amountPaid: decimal(record.amountPaid),
    changeGiven: decimal(record.changeGiven),
    currency: record.currency,
    exchangeRate: record.exchangeRate ? decimal(record.exchangeRate) : null,
    transactionReference: record.transactionReference,
    gatewayReference: record.gatewayReference,
    processedByStaffId: record.processedByStaffId,
    processedByStaffName: record.processedBy
      ? record.processedBy.fullName ||
        `${record.processedBy.firstName} ${record.processedBy.lastName}`.trim()
      : null,
    paidAt: record.paidAt?.toISOString() ?? null,
    orderNumber: record.order.orderNumber,
    orderType: record.order.orderType,
    orderTotal: decimal(record.order.totalAmount),
    orderPaymentStatus: record.order.paymentStatus,
    tableLabel: record.order.restaurantTable
      ? (record.order.restaurantTable.tableName ?? record.order.restaurantTable.tableNumber)
      : null,
    customerName: record.order.customer?.name ?? null,
    transactions: record.transactions.map((transaction) => ({
      id: transaction.id,
      transactionType: transaction.transactionType,
      amount: decimal(transaction.amount),
      status: transaction.status,
      reference: transaction.reference,
      processedAt: transaction.processedAt?.toISOString() ?? null,
      createdAt: transaction.createdAt.toISOString(),
    })),
    receipt: record.receipt
      ? {
          id: record.receipt.id,
          receiptNumber: record.receipt.receiptNumber,
          receiptUrl: record.receipt.receiptUrl,
          printedCount: record.receipt.printedCount,
          emailedAt: record.receipt.emailedAt?.toISOString() ?? null,
          smsSentAt: record.receipt.smsSentAt?.toISOString() ?? null,
          createdAt: record.receipt.createdAt.toISOString(),
        }
      : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function generatePaymentNumber(businessId: string): Promise<string> {
  const count = await prisma.orderPayment.count({ where: { businessId } });
  return `PAY-${String(count + 1).padStart(6, "0")}`;
}

async function getOwnedOrder(businessId: string, branchId: string, orderId: string) {
  const order = await prisma.restaurantOrder.findFirst({
    where: { id: orderId, businessId, branchId },
    include: {
      restaurantTable: { select: { tableNumber: true, tableName: true } },
      customer: { select: { name: true } },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status === "CANCELLED") {
    throw new Error("Cannot pay a cancelled order");
  }

  return order;
}

async function sumPaidForOrder(orderId: string): Promise<number> {
  const payments = await prisma.orderPayment.findMany({
    where: { orderId, status: { in: ACTIVE_PAYMENT_STATUSES } },
    select: { amountPaid: true },
  });

  return roundMoney(payments.reduce((sum, payment) => sum + decimal(payment.amountPaid), 0));
}

async function sumRefundedForPayment(paymentId: string): Promise<number> {
  const refunds = await prisma.orderPaymentTransaction.findMany({
    where: { paymentId, transactionType: "REFUND", status: "PAID" },
    select: { amount: true },
  });

  return roundMoney(refunds.reduce((sum, refund) => sum + decimal(refund.amount), 0));
}

export async function syncOrderPaymentStatus(
  orderId: string,
): Promise<RestaurantOrderPaymentStatus> {
  const order = await prisma.restaurantOrder.findUnique({
    where: { id: orderId },
    select: { totalAmount: true, paymentStatus: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const paidTotal = await sumPaidForOrder(orderId);
  const orderTotal = decimal(order.totalAmount);
  const nextStatus = mapOrderPaymentStatusToOrder(paidTotal, orderTotal);

  if (order.paymentStatus !== nextStatus) {
    await prisma.restaurantOrder.update({
      where: { id: orderId },
      data: { paymentStatus: nextStatus },
    });
  }

  return nextStatus;
}

async function syncCustomerAfterOrderPayment(businessId: string, orderId: string): Promise<void> {
  const order = await prisma.restaurantOrder.findUnique({
    where: { id: orderId },
    select: {
      customerId: true,
      totalAmount: true,
      paymentStatus: true,
      orderNumber: true,
    },
  });

  if (!order?.customerId || order.paymentStatus !== "PAID") {
    return;
  }

  const { syncCustomerStatsByBusinessId } = await import("@/services/restaurant-customer.service");
  const { earnLoyaltyPointsForOrder } =
    await import("@/services/restaurant-loyalty-account.service");
  const { recordTimelineEvent } = await import("@/services/crm-timeline.service");

  await syncCustomerStatsByBusinessId(businessId, order.customerId);
  await earnLoyaltyPointsForOrder(
    businessId,
    order.customerId,
    orderId,
    decimal(order.totalAmount),
  );
  await recordTimelineEvent(businessId, order.customerId, {
    staffId: null,
    eventType: "PAYMENT",
    title: "Order paid",
    description: `Payment completed for ${order.orderNumber}`,
    orderId,
  });
}

async function assertNoDuplicateReference(
  businessId: string,
  transactionReference: string | null | undefined,
): Promise<void> {
  if (!transactionReference?.trim()) return;

  const existing = await prisma.orderPayment.findFirst({
    where: {
      businessId,
      transactionReference: transactionReference.trim(),
      status: { in: ACTIVE_PAYMENT_STATUSES },
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Duplicate transaction reference");
  }
}

async function createPaymentRecord(input: {
  businessId: string;
  branchId: string;
  orderId: string;
  paymentMethod: RecordOrderPaymentInput["paymentMethod"];
  amountPaid: number;
  amountTendered?: number;
  tipAmount?: number;
  paymentProvider?: string | null;
  transactionReference?: string | null;
  gatewayReference?: string | null;
  currency?: string;
  orderSnapshot: {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    serviceCharge: number;
  };
  staffId?: string | null;
}) {
  const changeGiven =
    input.paymentMethod === "CASH"
      ? calculateChangeGiven(input.amountPaid, input.amountTendered ?? input.amountPaid)
      : 0;

  const now = new Date();
  const payment = await prisma.orderPayment.create({
    data: {
      businessId: input.businessId,
      branchId: input.branchId,
      orderId: input.orderId,
      paymentNumber: await generatePaymentNumber(input.businessId),
      paymentMethod: input.paymentMethod,
      paymentProvider: input.paymentProvider?.trim() || null,
      status: "PAID",
      subtotal: input.orderSnapshot.subtotal,
      discountAmount: input.orderSnapshot.discountAmount,
      taxAmount: input.orderSnapshot.taxAmount,
      serviceCharge: input.orderSnapshot.serviceCharge,
      tipAmount: input.tipAmount ?? 0,
      amountPaid: input.amountPaid,
      changeGiven,
      currency: input.currency ?? "GBP",
      transactionReference: input.transactionReference?.trim() || null,
      gatewayReference: input.gatewayReference?.trim() || null,
      processedByStaffId: input.staffId ?? null,
      paidAt: now,
      transactions: {
        create: {
          transactionType: "SALE",
          amount: input.amountPaid,
          status: "PAID",
          reference: input.transactionReference?.trim() || null,
          processedAt: now,
          providerResponse: { provider: input.paymentProvider ?? "manual" },
        },
      },
    },
    include: paymentInclude,
  });

  await createOrderReceiptForPayment(payment.id);
  const nextStatus = await syncOrderPaymentStatus(input.orderId);
  if (nextStatus === "PAID") {
    await syncCustomerAfterOrderPayment(input.businessId, input.orderId);
  }

  return serializePayment(payment);
}

export async function getOrderPaymentSummary(
  ownerId: string,
  branchId: string,
  orderId: string,
): Promise<OrderPaymentSummary> {
  const businessId = await getOwnedBusinessId(ownerId);
  const order = await getOwnedOrder(businessId, branchId, orderId);
  const amountPaid = await sumPaidForOrder(orderId);
  const orderTotal = decimal(order.totalAmount);
  const remainingBalance = roundMoney(Math.max(0, orderTotal - amountPaid));

  const payments = await prisma.orderPayment.findMany({
    where: { orderId },
    include: paymentInclude,
    orderBy: [{ createdAt: "desc" }],
  });

  const latestCash = payments.find(
    (payment) => payment.paymentMethod === "CASH" && payment.status === "PAID",
  );

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderType: order.orderType,
    orderTotal,
    amountPaid,
    remainingBalance,
    changeDue: latestCash ? decimal(latestCash.changeGiven) : 0,
    paymentStatus: order.paymentStatus,
    payments: payments.map(serializePayment),
  };
}

export async function recordOrderPayment(
  ownerId: string,
  input: RecordOrderPaymentInput,
): Promise<OrderPaymentSummary> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertNoDuplicateReference(businessId, input.transactionReference);

  const order = await getOwnedOrder(businessId, input.branchId, input.orderId);
  const amountPaid = await sumPaidForOrder(order.id);
  const remainingBalance = roundMoney(Math.max(0, decimal(order.totalAmount) - amountPaid));

  validateRecordPaymentInput(input, remainingBalance);

  await createPaymentRecord({
    businessId,
    branchId: input.branchId,
    orderId: order.id,
    paymentMethod: input.paymentMethod,
    amountPaid: input.amountPaid,
    amountTendered: input.amountTendered,
    tipAmount: input.tipAmount,
    paymentProvider: input.paymentProvider,
    transactionReference: input.transactionReference,
    gatewayReference: input.gatewayReference,
    currency: input.currency,
    orderSnapshot: {
      subtotal: decimal(order.subtotal),
      discountAmount: decimal(order.discountAmount),
      taxAmount: decimal(order.taxAmount),
      serviceCharge: decimal(order.serviceCharge),
    },
  });

  return getOrderPaymentSummary(ownerId, input.branchId, order.id);
}

export async function recordSplitOrderPayments(
  ownerId: string,
  input: SplitOrderPaymentInput,
): Promise<OrderPaymentSummary> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertNoDuplicateReference(businessId, input.transactionReference);

  const order = await getOwnedOrder(businessId, input.branchId, input.orderId);
  const amountPaid = await sumPaidForOrder(order.id);
  const remainingBalance = roundMoney(Math.max(0, decimal(order.totalAmount) - amountPaid));

  validateSplitPayments(input.lines, remainingBalance);

  for (const line of input.lines) {
    await createPaymentRecord({
      businessId,
      branchId: input.branchId,
      orderId: order.id,
      paymentMethod: line.paymentMethod,
      amountPaid: line.amountPaid,
      amountTendered: line.amountTendered,
      tipAmount: line.tipAmount,
      paymentProvider: line.paymentProvider,
      transactionReference: input.transactionReference,
      currency: input.currency,
      orderSnapshot: {
        subtotal: decimal(order.subtotal),
        discountAmount: decimal(order.discountAmount),
        taxAmount: decimal(order.taxAmount),
        serviceCharge: decimal(order.serviceCharge),
      },
    });
  }

  return getOrderPaymentSummary(ownerId, input.branchId, order.id);
}

export async function refundOrderPayment(
  ownerId: string,
  input: RefundOrderPaymentInput,
): Promise<OrderPaymentRecord> {
  const businessId = await getOwnedBusinessId(ownerId);

  const payment = await prisma.orderPayment.findFirst({
    where: { id: input.paymentId, businessId, branchId: input.branchId },
    include: paymentInclude,
  });

  if (!payment) throw new Error("Payment not found");
  if (!["PAID", "PARTIALLY_PAID"].includes(payment.status)) {
    throw new Error("Payment cannot be refunded");
  }

  const alreadyRefunded = await sumRefundedForPayment(payment.id);
  const maxRefundable = roundMoney(decimal(payment.amountPaid) - alreadyRefunded);
  validateRefundInput(input, maxRefundable);

  const now = new Date();
  await prisma.orderPaymentTransaction.create({
    data: {
      paymentId: payment.id,
      transactionType: "REFUND",
      amount: input.amount,
      status: "PAID",
      reference: input.reference?.trim() || null,
      processedAt: now,
      providerResponse: { provider: "manual" },
    },
  });

  const totalRefunded = alreadyRefunded + input.amount;
  const nextStatus = totalRefunded >= decimal(payment.amountPaid) ? "REFUNDED" : payment.status;

  const updated = await prisma.orderPayment.update({
    where: { id: payment.id },
    data: { status: nextStatus },
    include: paymentInclude,
  });

  await syncOrderPaymentStatus(payment.orderId);

  if (totalRefunded >= decimal(payment.amountPaid)) {
    await prisma.restaurantOrder.update({
      where: { id: payment.orderId },
      data: { paymentStatus: "REFUNDED" },
    });
  }

  return serializePayment(updated);
}

export async function voidOrderPayment(
  ownerId: string,
  input: VoidOrderPaymentInput,
): Promise<OrderPaymentRecord> {
  const businessId = await getOwnedBusinessId(ownerId);

  const payment = await prisma.orderPayment.findFirst({
    where: { id: input.paymentId, businessId, branchId: input.branchId },
    include: paymentInclude,
  });

  if (!payment) throw new Error("Payment not found");
  if (payment.status !== "PAID") {
    throw new Error("Only paid payments can be voided");
  }

  const now = new Date();
  await prisma.orderPaymentTransaction.create({
    data: {
      paymentId: payment.id,
      transactionType: "VOID",
      amount: decimal(payment.amountPaid),
      status: "VOIDED",
      reference: input.reference?.trim() || null,
      processedAt: now,
      providerResponse: { provider: "manual" },
    },
  });

  const updated = await prisma.orderPayment.update({
    where: { id: payment.id },
    data: { status: "VOIDED" },
    include: paymentInclude,
  });

  await syncOrderPaymentStatus(payment.orderId);
  return serializePayment(updated);
}

export async function listOrderPayments(
  ownerId: string,
  query: OrderPaymentListQuery,
): Promise<OrderPaymentListResult> {
  const businessId = await getOwnedBusinessId(ownerId);
  const pageSize = query.pageSize ?? PAYMENT_LIST_PAGE_SIZE;
  const page = query.page ?? 1;
  const where = buildPaymentListWhere(businessId, query);

  const [total, records] = await Promise.all([
    prisma.orderPayment.count({ where }),
    prisma.orderPayment.findMany({
      where,
      include: paymentInclude,
      orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: records.map(serializePayment),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getOrderPayment(
  ownerId: string,
  branchId: string,
  paymentId: string,
): Promise<OrderPaymentRecord> {
  const businessId = await getOwnedBusinessId(ownerId);

  const payment = await prisma.orderPayment.findFirst({
    where: { id: paymentId, businessId, branchId },
    include: paymentInclude,
  });

  if (!payment) throw new Error("Payment not found");
  return serializePayment(payment);
}

export async function getPaymentDashboardStats(
  ownerId: string,
  branchId: string,
): Promise<PaymentDashboardStats> {
  const businessId = await getOwnedBusinessId(ownerId);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [paymentsToday, refundsToday, unpaidOrders] = await Promise.all([
    prisma.orderPayment.findMany({
      where: {
        businessId,
        branchId,
        status: "PAID",
        paidAt: { gte: startOfDay },
      },
      select: { amountPaid: true },
    }),
    prisma.orderPaymentTransaction.findMany({
      where: {
        transactionType: "REFUND",
        status: "PAID",
        processedAt: { gte: startOfDay },
        payment: { businessId, branchId },
      },
      select: { amount: true },
    }),
    prisma.restaurantOrder.count({
      where: {
        businessId,
        branchId,
        paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID"] },
        status: { not: "CANCELLED" },
      },
    }),
  ]);

  return {
    paymentsToday: paymentsToday.length,
    revenueToday: roundMoney(
      paymentsToday.reduce((sum, payment) => sum + decimal(payment.amountPaid), 0),
    ),
    refundsToday: roundMoney(refundsToday.reduce((sum, refund) => sum + decimal(refund.amount), 0)),
    unpaidOrders,
  };
}

export async function listUnpaidOrders(
  ownerId: string,
  branchId: string,
): Promise<UnpaidOrderOption[]> {
  const businessId = await getOwnedBusinessId(ownerId);

  const orders = await prisma.restaurantOrder.findMany({
    where: {
      businessId,
      branchId,
      paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID"] },
      status: { notIn: ["CANCELLED", "COMPLETED"] },
    },
    include: {
      restaurantTable: { select: { tableNumber: true, tableName: true } },
      payments: {
        where: { status: { in: ACTIVE_PAYMENT_STATUSES } },
        select: { amountPaid: true },
      },
    },
    orderBy: [{ placedAt: "desc" }],
    take: 50,
  });

  return orders.map((order) => {
    const amountPaid = roundMoney(
      order.payments.reduce((sum, payment) => sum + decimal(payment.amountPaid), 0),
    );
    const totalAmount = decimal(order.totalAmount);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      tableLabel: order.restaurantTable
        ? (order.restaurantTable.tableName ?? order.restaurantTable.tableNumber)
        : null,
      totalAmount,
      amountPaid,
      remainingBalance: roundMoney(Math.max(0, totalAmount - amountPaid)),
    };
  });
}

export function createIdempotencyReference(): string {
  return randomBytes(16).toString("hex");
}
