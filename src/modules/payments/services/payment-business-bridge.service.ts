import "server-only";

import type { PaymentMethod } from "@prisma/client";

import type {
  OrderPaymentSummary,
  RecordOrderPaymentInput,
} from "@/modules/payment-receipt-management/types/payment-receipt-types";
import { buildOrderScopeFromInput, toOmsPlatformContext } from "@/modules/orders/lib/order-scope";
import { orderService } from "@/modules/orders/services/order.service";
import {
  getOrderPaymentSummary as getPlatformOrderPaymentSummary,
  listUnpaidOrders as listPlatformUnpaidOrders,
  recordOrderPayment,
  refundOrderPayment,
  voidOrderPayment,
} from "@/modules/payments/services/payment-platform.service";
import { prisma } from "@/lib/prisma";

export type { OrderPaymentSummary };

async function resolveOwnerId(businessId: string): Promise<string> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { ownerId: true },
  });

  if (!business?.ownerId) {
    throw new Error("Business owner not found");
  }

  return business.ownerId;
}

export async function getOrderPaymentSummaryForBusiness(
  orderId: string,
  businessId: string,
  branchId?: string | null,
) {
  const ownerId = await resolveOwnerId(businessId);
  if (!branchId) {
    throw new Error("Branch context is required");
  }
  return getPlatformOrderPaymentSummary(ownerId, branchId, orderId);
}

export async function recordPaymentForBusiness(
  businessId: string,
  orderId: string,
  input: {
    method: PaymentMethod;
    amountPence: number;
    amountTenderedPence?: number | null;
    notes?: string | null;
  },
  branchId?: string | null,
) {
  const ownerId = await resolveOwnerId(businessId);
  if (!branchId) {
    throw new Error("Branch context is required");
  }

  const payload: RecordOrderPaymentInput = {
    branchId,
    orderId,
    paymentMethod: input.method,
    amountPaid: input.amountPence / 100,
    amountTendered:
      input.amountTenderedPence != null ? input.amountTenderedPence / 100 : undefined,
  };

  const summary = await recordOrderPayment(ownerId, payload);
  const latestPayment = summary.payments[0];

  return {
    payment: latestPayment
      ? {
          id: latestPayment.id,
          orderId: latestPayment.orderId,
          method: latestPayment.paymentMethod,
          amount: Math.round(latestPayment.amountPaid * 100),
          amountTendered: input.amountTenderedPence ?? null,
          status: latestPayment.status,
          notes: input.notes ?? null,
          createdAt: new Date(latestPayment.paidAt ?? Date.now()),
        }
      : null,
    summary,
  };
}

export async function voidPaymentForBusiness(
  paymentId: string,
  businessId: string,
  branchId?: string | null,
) {
  const ownerId = await resolveOwnerId(businessId);
  if (!branchId) {
    throw new Error("Branch context is required");
  }
  const payment = await prisma.orderPayment.findFirst({
    where: { id: paymentId, businessId },
    select: { orderId: true },
  });
  if (!payment) {
    throw new Error("Payment not found");
  }
  await voidOrderPayment(ownerId, { paymentId, branchId });
  return getPlatformOrderPaymentSummary(ownerId, branchId, payment.orderId);
}

export async function refundPaymentForBusiness(
  paymentId: string,
  businessId: string,
  branchId?: string | null,
  amount = 0,
) {
  const ownerId = await resolveOwnerId(businessId);
  if (!branchId) {
    throw new Error("Branch context is required");
  }
  return refundOrderPayment(ownerId, { paymentId, branchId, amount });
}

export async function listUnpaidOrdersForBusiness(
  businessId: string,
  branchId?: string | null,
) {
  const ownerId = await resolveOwnerId(businessId);
  if (!branchId) {
    throw new Error("Branch context is required");
  }
  return listPlatformUnpaidOrders(ownerId, branchId);
}

export async function getPaymentOrderContextForBusiness(
  orderId: string,
  businessId: string,
  branchId?: string | null,
) {
  if (!branchId) {
    throw new Error("Branch context is required");
  }

  const scope = buildOrderScopeFromInput({ businessId, branchId, userId: "system" });
  const context = toOmsPlatformContext(scope);
  const record = await orderService.getById(context, orderId);

  if (!record) {
    throw new Error("Order not found");
  }

  const summary = await getOrderPaymentSummaryForBusiness(orderId, businessId, branchId);

  return {
    order: {
      id: record.order.id,
      businessId: record.order.businessId,
      orderNumber: record.order.orderNumber,
      total: record.order.totalPence / 100,
      customerName: record.order.customerName,
      tableId: record.order.tableNumber,
      items: record.items,
    },
    summary,
  };
}

export {
  createIdempotencyReference,
  getOrderPayment,
  getPaymentDashboardStats,
  listOrderPayments,
  recordSplitOrderPayments,
} from "@/modules/payments/services/payment-platform.service";
