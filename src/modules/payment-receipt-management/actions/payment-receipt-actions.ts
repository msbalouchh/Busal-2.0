"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { ORDER_MANAGEMENT_ROUTES } from "@/modules/order-management/constants/routes";
import { PAYMENT_RECEIPT_ROUTES } from "@/modules/payment-receipt-management/constants/routes";
import { requirePaymentActionContext } from "@/modules/payment-receipt-management/lib/get-payment-receipt-context";
import type {
  EmailReceiptInput,
  RecordOrderPaymentInput,
  RefundOrderPaymentInput,
  SplitOrderPaymentInput,
  SmsReceiptInput,
  VoidOrderPaymentInput,
} from "@/modules/payment-receipt-management/types/payment-receipt-types";
import { emailOrderReceipt, smsOrderReceipt } from "@/services/restaurant-order-receipt.service";
import {
  createIdempotencyReference,
  getOrderPaymentSummary,
  recordOrderPayment,
  recordSplitOrderPayments,
  refundOrderPayment,
  voidOrderPayment,
} from "@/modules/payments/services/payment-platform.service";

function revalidatePaymentPages(branchId: string, orderId?: string) {
  revalidatePath(PAYMENT_RECEIPT_ROUTES.dashboardForBranch(branchId));
  if (orderId) {
    revalidatePath(ORDER_MANAGEMENT_ROUTES.details(orderId, branchId));
  }
}

export async function loadOrderPaymentSummaryAction(branchId: string, orderId: string) {
  const context = await requirePaymentActionContext(branchId, PERMISSION_CODES.PAYMENT_VIEW);
  return getOrderPaymentSummary(context.user.id, branchId, orderId);
}

export async function recordOrderPaymentAction(input: RecordOrderPaymentInput) {
  const context = await requirePaymentActionContext(
    input.branchId,
    PERMISSION_CODES.PAYMENT_CREATE,
  );
  const summary = await recordOrderPayment(context.user.id, {
    ...input,
    transactionReference: input.transactionReference ?? createIdempotencyReference(),
  });
  revalidatePaymentPages(input.branchId, input.orderId);
  return summary;
}

export async function recordSplitOrderPaymentAction(input: SplitOrderPaymentInput) {
  const context = await requirePaymentActionContext(
    input.branchId,
    PERMISSION_CODES.PAYMENT_CREATE,
  );
  const summary = await recordSplitOrderPayments(context.user.id, {
    ...input,
    transactionReference: input.transactionReference ?? createIdempotencyReference(),
  });
  revalidatePaymentPages(input.branchId, input.orderId);
  return summary;
}

export async function refundOrderPaymentAction(input: RefundOrderPaymentInput) {
  const context = await requirePaymentActionContext(
    input.branchId,
    PERMISSION_CODES.PAYMENT_REFUND,
  );
  const payment = await refundOrderPayment(context.user.id, input);
  revalidatePaymentPages(input.branchId, payment.orderId);
  return payment;
}

export async function voidOrderPaymentAction(input: VoidOrderPaymentInput) {
  const context = await requirePaymentActionContext(input.branchId, PERMISSION_CODES.PAYMENT_VOID);
  const payment = await voidOrderPayment(context.user.id, input);
  revalidatePaymentPages(input.branchId, payment.orderId);
  return payment;
}

export async function emailOrderReceiptAction(input: EmailReceiptInput) {
  const context = await requirePaymentActionContext(input.branchId, PERMISSION_CODES.RECEIPT_EMAIL);
  return emailOrderReceipt(input.receiptId, context.business.id, input.email);
}

export async function smsOrderReceiptAction(input: SmsReceiptInput) {
  const context = await requirePaymentActionContext(input.branchId, PERMISSION_CODES.RECEIPT_EMAIL);
  return smsOrderReceipt(input.receiptId, context.business.id, input.phone);
}
