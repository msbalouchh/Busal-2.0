import type { ReceiptData } from "@/services/receipt.service";
import {
  formatReceiptPaymentMethod,
  formatReceiptTimestamp,
  formatReceiptTotalsBlock,
  type ReceiptTemplateLine,
} from "@/modules/receipts/utils/templates/template-renderer";
import { formatReceiptMoney } from "@/modules/receipts/utils/receipt-utils";

export function renderCustomerReceiptTemplate(receipt: ReceiptData): ReceiptTemplateLine[] {
  const lines: ReceiptTemplateLine[] = [{ text: receipt.businessName, bold: true, size: "large" }];

  if (receipt.businessAddress) {
    lines.push({ text: receipt.businessAddress });
  }
  if (receipt.businessPhone) {
    lines.push({ text: receipt.businessPhone });
  }
  if (receipt.businessEmail) {
    lines.push({ text: receipt.businessEmail });
  }

  lines.push(
    { text: "" },
    { text: `Receipt: ${receipt.receiptNumber}`, bold: true },
    { text: `Order: ${receipt.orderNumber}` },
    { text: `Payment Ref: ${receipt.paymentId.slice(0, 8).toUpperCase()}` },
    {
      text: formatReceiptTimestamp(receipt.createdAt, receipt.locale),
    },
  );

  if (receipt.tableName) {
    lines.push({ text: `Table: ${receipt.tableName}` });
  }
  if (receipt.customerName) {
    lines.push({ text: `Customer: ${receipt.customerName}` });
  }
  if (receipt.customerPhone) {
    lines.push({ text: `Phone: ${receipt.customerPhone}` });
  }
  if (receipt.staffName) {
    lines.push({ text: `Staff: ${receipt.staffName}` });
  }

  lines.push(
    { text: `Payment Method: ${formatReceiptPaymentMethod(receipt.paymentMethod)}` },
    { text: "" },
    { text: "Items", bold: true },
  );

  for (const item of receipt.items) {
    lines.push({
      text: `${item.quantity}x ${item.name} @ ${formatReceiptMoney(item.unitPricePence)}`,
    });
    if (item.discountPence > 0) {
      lines.push({ text: `  Discount: ${formatReceiptMoney(item.discountPence)}`, size: "small" });
    }
    lines.push({ text: `  Line Total: ${formatReceiptMoney(item.lineTotalPence)}`, size: "small" });
  }

  lines.push({ text: "" }, ...formatReceiptTotalsBlock(receipt));

  if (receipt.qrCodeData) {
    lines.push({ text: "" }, { text: `QR: ${receipt.qrCodeData}`, size: "small" });
  }

  lines.push({ text: "" }, { text: "Thank you for your visit.", size: "small" });

  return lines;
}
