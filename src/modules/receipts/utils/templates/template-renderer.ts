import type { ReceiptData } from "@/services/receipt.service";
import { RECEIPT_TEMPLATE_HEADERS } from "@/modules/receipts/constants/templates";
import type { ReceiptTemplateTypeOption } from "@/modules/receipts/constants/routes";
import { formatReceiptMoney } from "@/modules/receipts/utils/receipt-utils";
import { renderCustomerReceiptTemplate } from "@/modules/receipts/utils/templates/customer-receipt-template";
import { renderKitchenTicketTemplate } from "@/modules/receipts/utils/templates/kitchen-ticket-template";

export interface ReceiptTemplateLine {
  text: string;
  bold?: boolean;
  size?: "small" | "normal" | "large";
}

export interface ReceiptTemplateData {
  templateType: ReceiptTemplateTypeOption;
  header: string;
  lines: ReceiptTemplateLine[];
  receipt: ReceiptData;
}

export function buildReceiptTemplateData(
  receipt: ReceiptData,
  templateType: ReceiptTemplateTypeOption = "CUSTOMER",
): ReceiptTemplateData {
  const lines =
    templateType === "KITCHEN"
      ? renderKitchenTicketTemplate(receipt)
      : renderCustomerReceiptTemplate(receipt);

  return {
    templateType,
    header: RECEIPT_TEMPLATE_HEADERS[templateType],
    lines,
    receipt,
  };
}

export function formatReceiptTimestamp(value: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function formatReceiptPaymentMethod(method: string): string {
  return method === "CASH" ? "Cash" : "Card";
}

export function formatReceiptTotalsBlock(receipt: ReceiptData): ReceiptTemplateLine[] {
  return [
    { text: `Subtotal: ${formatReceiptMoney(receipt.subtotalPence)}` },
    { text: `Discount: ${formatReceiptMoney(receipt.discountPence)}` },
    { text: `Tax: ${formatReceiptMoney(receipt.taxPence)}` },
    { text: `Grand Total: ${formatReceiptMoney(receipt.totalPence)}`, bold: true },
    { text: `Payment: ${formatReceiptMoney(receipt.paymentAmountPence)}` },
    ...(receipt.amountTenderedPence != null
      ? [{ text: `Amount Tendered: ${formatReceiptMoney(receipt.amountTenderedPence)}` }]
      : []),
    { text: `Change Due: ${formatReceiptMoney(receipt.changeDuePence)}` },
  ];
}
