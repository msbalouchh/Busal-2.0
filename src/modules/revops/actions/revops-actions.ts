"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { REVOPS_ROUTES } from "@/modules/revops/constants/routes";
import {
  createCollectionCase,
  createRevenueExpense,
  issueInvoice,
  recordInvoicePayment,
  recognizeRevenue,
} from "@/services/revops.service";

function revalidateRevopsPaths() {
  Object.values(REVOPS_ROUTES).forEach((path) => {
    revalidatePath(path);
  });
}

export async function issueInvoiceAction(invoiceId: string, dueAt?: string | null) {
  return protectedAction(PERMISSION_CODES.INVOICES_MANAGE, async ({ business, platform }) => {
    await issueInvoice(
      invoiceId,
      business.id,
      platform.staffSession?.staffId ?? null,
      dueAt ? new Date(dueAt) : null,
    );
    revalidateRevopsPaths();
    return { success: true as const };
  });
}

export async function recordInvoicePaymentAction(
  invoiceId: string,
  input: {
    amountPence: number;
    paymentMethod: "STRIPE" | "GOCARDLESS" | "BANK_TRANSFER" | "PAYPAL" | "MANUAL";
    providerReference?: string | null;
  },
) {
  return protectedAction(
    PERMISSION_CODES.REVOPS_PAYMENTS_MANAGE,
    async ({ business, platform }) => {
      await recordInvoicePayment(
        invoiceId,
        business.id,
        platform.staffSession?.staffId ?? null,
        input,
      );
      revalidateRevopsPaths();
      return { success: true as const };
    },
  );
}

export async function recognizeRevenueAction(invoiceId: string) {
  return protectedAction(PERMISSION_CODES.REVENUE_MANAGE, async ({ business, platform }) => {
    await recognizeRevenue(invoiceId, business.id, platform.staffSession?.staffId ?? null);
    revalidateRevopsPaths();
    return { success: true as const };
  });
}

export async function createRevenueExpenseAction(input: {
  description: string;
  amountPence: number;
  category?: "DELIVERY" | "SUPPORT" | "INFRASTRUCTURE" | "SALES" | "MARKETING" | "OTHER";
}) {
  return protectedAction(PERMISSION_CODES.EXPENSES_MANAGE, async ({ business, platform }) => {
    await createRevenueExpense(business.id, platform.staffSession?.staffId ?? null, input);
    revalidateRevopsPaths();
    return { success: true as const };
  });
}

export async function createCollectionCaseAction(
  invoiceId: string,
  input?: { notes?: string | null },
) {
  return protectedAction(PERMISSION_CODES.REVENUE_MANAGE, async ({ business, platform }) => {
    await createCollectionCase(
      invoiceId,
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateRevopsPaths();
    return { success: true as const };
  });
}
