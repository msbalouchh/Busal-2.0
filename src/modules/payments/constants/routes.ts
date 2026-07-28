export const PAYMENT_ROUTES = {
  overview: "/dashboard/payments",
  order: (orderId: string) => `/dashboard/payments/${orderId}`,
} as const;

export const PAYMENT_METHODS = ["CASH", "CARD"] as const;

export type PaymentMethodOption = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodOption, string> = {
  CASH: "Cash",
  CARD: "Card",
};

export const PAYMENT_STATUS_LABELS = {
  COMPLETED: "Completed",
  VOIDED: "Voided",
  REFUNDED: "Refunded",
} as const;
