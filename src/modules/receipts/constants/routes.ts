export const RECEIPT_ROUTES = {
  overview: "/dashboard/receipts",
  detail: (receiptId: string) => `/dashboard/receipts/${receiptId}`,
  printApi: (receiptId: string) => `/api/receipts/${receiptId}/print`,
  reprintApi: (receiptId: string) => `/api/receipts/${receiptId}/reprint`,
} as const;

export const RECEIPT_TEMPLATE_TYPES = ["CUSTOMER", "KITCHEN"] as const;
export const RECEIPT_PAPER_SIZES = ["A4", "THERMAL_80MM", "THERMAL_58MM"] as const;

export type ReceiptTemplateTypeOption = (typeof RECEIPT_TEMPLATE_TYPES)[number];
export type ReceiptPaperSizeOption = (typeof RECEIPT_PAPER_SIZES)[number];

export const RECEIPT_TEMPLATE_LABELS: Record<ReceiptTemplateTypeOption, string> = {
  CUSTOMER: "Customer Receipt",
  KITCHEN: "Kitchen Ticket",
};

export const RECEIPT_PAPER_SIZE_LABELS: Record<ReceiptPaperSizeOption, string> = {
  A4: "A4",
  THERMAL_80MM: "80mm Thermal",
  THERMAL_58MM: "58mm Thermal",
};
