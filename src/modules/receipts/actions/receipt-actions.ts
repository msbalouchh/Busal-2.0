"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { RECEIPT_ROUTES } from "@/modules/receipts/constants/routes";
import type {
  ReceiptPaperSizeOption,
  ReceiptTemplateTypeOption,
} from "@/modules/receipts/constants/routes";
import { serializeReceipt, serializeReceiptPrintLog } from "@/modules/receipts/utils/receipt-utils";
import {
  getReceipt,
  listReceiptPrintLogs,
  recordReceiptView,
  reprintReceipt,
} from "@/services/receipt.service";

function revalidateReceiptPaths(receiptId?: string) {
  revalidatePath(RECEIPT_ROUTES.overview);
  if (receiptId) {
    revalidatePath(RECEIPT_ROUTES.detail(receiptId));
  }
}

export async function fetchReceiptAction(input: { receiptId: string }) {
  return protectedAction(PERMISSION_CODES.RECEIPT_VIEW, async ({ business, platform }) => {
    const receipt = await getReceipt(input.receiptId, business.id);
    await recordReceiptView(input.receiptId, business.id, platform.staffSession?.staffId ?? null);

    return {
      receipt: serializeReceipt(receipt),
    };
  });
}

export async function reprintReceiptAction(input: {
  receiptId: string;
  templateType: ReceiptTemplateTypeOption;
  paperSize: ReceiptPaperSizeOption;
}) {
  return protectedAction(PERMISSION_CODES.RECEIPT_PRINT, async ({ business, platform }) => {
    const result = await reprintReceipt(input.receiptId, business.id, {
      templateType: input.templateType,
      paperSize: input.paperSize,
      staffId: platform.staffSession?.staffId ?? null,
    });

    revalidateReceiptPaths(input.receiptId);

    return {
      success: true as const,
      receipt: serializeReceipt(result.receipt),
      pdfBase64: result.pdf.toString("base64"),
    };
  });
}

export async function fetchReceiptPrintHistoryAction(input: { receiptId: string }) {
  return protectedAction(PERMISSION_CODES.RECEIPT_VIEW, async ({ business }) => {
    const logs = await listReceiptPrintLogs(input.receiptId, business.id);

    return {
      logs: logs.map(serializeReceiptPrintLog),
    };
  });
}
