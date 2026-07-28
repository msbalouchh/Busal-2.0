export const REVOPS_PAYMENT_PROVIDERS = {
  STRIPE: {
    id: "STRIPE",
    label: "Stripe",
    integrationReady: false,
    description: "Card and subscription billing via Stripe Connect (planned).",
  },
  GOCARDLESS: {
    id: "GOCARDLESS",
    label: "GoCardless",
    integrationReady: false,
    description: "Direct debit collections via GoCardless (planned).",
  },
  BANK_TRANSFER: {
    id: "BANK_TRANSFER",
    label: "Bank Transfer",
    integrationReady: false,
    description: "Manual bank transfer reconciliation (planned).",
  },
  PAYPAL: {
    id: "PAYPAL",
    label: "PayPal",
    integrationReady: false,
    description: "PayPal business payments (planned).",
  },
  MANUAL: {
    id: "MANUAL",
    label: "Manual",
    integrationReady: true,
    description: "Manually recorded payments.",
  },
} as const;

export type RevopsPaymentProviderId = keyof typeof REVOPS_PAYMENT_PROVIDERS;
