export const PAYMENT_RECEIPT_ROUTES = {
  dashboard: () => `/app/restaurant/payments`,
  dashboardForBranch: (branchId: string) => `/app/restaurant/payments?branchId=${branchId}`,
  details: (paymentId: string, branchId: string) =>
    `/app/restaurant/payments/${paymentId}?branchId=${branchId}`,
  takePayment: (orderId: string, branchId: string) =>
    `/app/restaurant/payments/take?orderId=${orderId}&branchId=${branchId}`,
  receipt: (receiptId: string, branchId: string) =>
    `/app/restaurant/payments?branchId=${branchId}&receiptId=${receiptId}`,
} as const;

export const PAYMENT_LIST_PAGE_SIZE = 24;

export const PAYMENT_STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PARTIALLY_PAID", label: "Partially paid" },
  { value: "PAID", label: "Paid" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "VOIDED", label: "Voided" },
] as const;

export const PAYMENT_METHOD_FILTER_OPTIONS = [
  { value: "ALL", label: "All methods" },
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "CONTACTLESS", label: "Contactless" },
  { value: "APPLE_PAY", label: "Apple Pay" },
  { value: "GOOGLE_PAY", label: "Google Pay" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "GIFT_CARD", label: "Gift card" },
  { value: "STORE_CREDIT", label: "Store credit" },
  { value: "OTHER", label: "Other" },
] as const;

export const ORDER_PAYMENT_METHOD_OPTIONS = PAYMENT_METHOD_FILTER_OPTIONS.filter(
  (option) => option.value !== "ALL",
);

export const DEFAULT_PAYMENT_CURRENCY = "GBP" as const;

export const ORDER_RECEIPT_PRINT_API = (receiptId: string) =>
  `/api/order-receipts/${receiptId}/print`;
