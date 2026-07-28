export const DEFAULT_PAYMENT_CURRENCY = "GBP" as const;
export const DEFAULT_PAYMENT_LOCALE = "en-GB" as const;

export type PaymentCurrencyCode = typeof DEFAULT_PAYMENT_CURRENCY;

export interface PaymentCurrencyConfig {
  currency: PaymentCurrencyCode;
  locale: string;
}

export const DEFAULT_PAYMENT_CURRENCY_CONFIG: PaymentCurrencyConfig = {
  currency: DEFAULT_PAYMENT_CURRENCY,
  locale: DEFAULT_PAYMENT_LOCALE,
};
