export const CONTROL_CENTER_BILLING_ROUTES = {
  overview: "/control-center/subscriptions",
  detail: (businessId: string) => `/control-center/subscriptions/${businessId}`,
} as const;

export const CONTROL_CENTER_BILLING_PAGE_SIZE = 20;

export const SUBSCRIPTION_STATUS_OPTIONS = [
  "ACTIVE",
  "TRIAL",
  "PAUSED",
  "CANCELLED",
  "PAST_DUE",
  "EXPIRING",
] as const;

export const BILLING_CYCLE_OPTIONS = ["monthly", "annual"] as const;

export const PAYMENT_STATUS_OPTIONS = ["PAID", "PENDING", "FAILED", "REFUNDED"] as const;
