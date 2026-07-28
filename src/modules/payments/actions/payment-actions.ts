"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { PAYMENT_ROUTES } from "@/modules/payments/constants/routes";
import { serializePaymentSummary } from "@/modules/payments/utils/payment-utils";
import {
  getOrderPaymentSummary,
  recordPayment,
  refundPaymentPlaceholder,
  voidPayment,
} from "@/services/payment.service";
import type { PaymentMethodOption } from "@/modules/payments/constants/routes";

function revalidatePaymentPaths(orderId?: string) {
  revalidatePath(PAYMENT_ROUTES.overview);
  if (orderId) {
    revalidatePath(PAYMENT_ROUTES.order(orderId));
  }
}

export async function recordPaymentAction(input: {
  orderId: string;
  method: PaymentMethodOption;
  amountPence: number;
  amountTenderedPence?: number | null;
  notes?: string | null;
}) {
  return protectedAction(
    { all: [PERMISSION_CODES.PAYMENT_CREATE, PERMISSION_CODES.POS_USE] },
    async ({ business, platform }) => {
      const result = await recordPayment(
        business.id,
        input.orderId,
        platform.staffSession?.staffId ?? null,
        {
          method: input.method,
          amountPence: input.amountPence,
          amountTenderedPence: input.amountTenderedPence,
          notes: input.notes,
        },
        platform.branchId,
      );

      revalidatePaymentPaths(input.orderId);

      return {
        success: true as const,
        payment: result.payment,
        summary: serializePaymentSummary(result.summary),
      };
    },
  );
}

export async function voidPaymentAction(input: { paymentId: string; orderId: string }) {
  return protectedAction(PERMISSION_CODES.PAYMENT_CREATE, async ({ business }) => {
    const summary = await voidPayment(input.paymentId, business.id);
    revalidatePaymentPaths(input.orderId);

    return {
      success: true as const,
      summary: serializePaymentSummary(summary),
    };
  });
}

export async function refundPaymentAction(input: { paymentId: string }) {
  return protectedAction(PERMISSION_CODES.PAYMENT_REFUND, async ({ business }) => {
    await refundPaymentPlaceholder(input.paymentId, business.id);
  });
}

export async function fetchPaymentSummaryAction(input: { orderId: string }) {
  return protectedAction(PERMISSION_CODES.PAYMENT_CREATE, async ({ business }) => {
    const summary = await getOrderPaymentSummary(input.orderId, business.id);

    return {
      summary: serializePaymentSummary(summary),
    };
  });
}
