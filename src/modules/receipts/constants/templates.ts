import type { ReceiptTemplateTypeOption } from "@/modules/receipts/constants/routes";

export const RECEIPT_TEMPLATE_HEADERS: Record<ReceiptTemplateTypeOption, string> = {
  CUSTOMER: "Customer Receipt",
  KITCHEN: "Kitchen Ticket",
};

export const RECEIPT_FUTURE_CHANNELS = {
  email: "email",
  sms: "sms",
  qrCode: "qrCode",
  multiLanguage: "multiLanguage",
  multiCurrency: "multiCurrency",
} as const;
