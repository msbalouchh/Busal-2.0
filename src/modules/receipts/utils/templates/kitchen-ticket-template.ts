import type { ReceiptData } from "@/services/receipt.service";
import {
  formatReceiptTimestamp,
  type ReceiptTemplateLine,
} from "@/modules/receipts/utils/templates/template-renderer";

export function renderKitchenTicketTemplate(receipt: ReceiptData): ReceiptTemplateLine[] {
  const lines: ReceiptTemplateLine[] = [
    { text: "KITCHEN TICKET", bold: true, size: "large" },
    { text: receipt.businessName, bold: true },
    { text: `Order: ${receipt.orderNumber}`, bold: true },
    { text: `Receipt: ${receipt.receiptNumber}` },
    { text: formatReceiptTimestamp(receipt.createdAt, receipt.locale) },
  ];

  if (receipt.tableName) {
    lines.push({ text: `Table: ${receipt.tableName}`, bold: true });
  }
  if (receipt.customerName) {
    lines.push({ text: `Customer: ${receipt.customerName}` });
  }
  if (receipt.staffName) {
    lines.push({ text: `Staff: ${receipt.staffName}` });
  }

  lines.push({ text: "" }, { text: "Items", bold: true });

  for (const item of receipt.items) {
    lines.push({
      text: `${item.quantity}x ${item.name}`,
      bold: true,
      size: "large",
    });
  }

  lines.push({ text: "" }, { text: `Payment Ref: ${receipt.paymentId.slice(0, 8).toUpperCase()}` });

  return lines;
}
