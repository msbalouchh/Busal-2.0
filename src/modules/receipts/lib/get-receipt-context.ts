import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeReceipt,
  serializeReceiptListItem,
  serializeReceiptPrintLog,
} from "@/modules/receipts/utils/receipt-utils";
import {
  getReceipt,
  listReceiptAuditLogs,
  listReceiptPrintLogs,
  listReceipts,
  recordReceiptView,
} from "@/services/receipt.service";

export const getReceiptsModuleContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.RECEIPT_VIEW });
  const receipts = await listReceipts(context.business.id, context.branchId);

  return {
    context,
    receipts: receipts.map(serializeReceiptListItem),
  };
});

export const getReceiptDetailPageContext = cache(async (receiptId: string) => {
  const context = await protectedPage({ permission: PERMISSION_CODES.RECEIPT_VIEW });
  const receipt = await getReceipt(receiptId, context.business.id);
  await recordReceiptView(receiptId, context.business.id, context.staffSession?.staffId ?? null);

  const [printLogs, auditLogs] = await Promise.all([
    listReceiptPrintLogs(receiptId, context.business.id),
    listReceiptAuditLogs(receiptId, context.business.id),
  ]);

  return {
    context,
    receipt: serializeReceipt(receipt),
    printLogs: printLogs.map(serializeReceiptPrintLog),
    auditLogs: auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      createdAt: log.createdAt.toISOString(),
    })),
  };
});
