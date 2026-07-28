import type { Decimal } from "@prisma/client/runtime/library";

import {
  DEFAULT_PAYMENT_CURRENCY,
  DEFAULT_PAYMENT_CURRENCY_CONFIG,
  DEFAULT_PAYMENT_LOCALE,
  type PaymentCurrencyConfig,
} from "@/modules/payments/constants/currency";

export function normalizeMoneyDecimalString(value: string): string {
  const normalized = value.trim().replace(/,/g, "");

  if (!normalized.includes(".")) {
    return `${normalized}.00`;
  }

  const [wholePart, fractionalPart = ""] = normalized.split(".");
  return `${wholePart}.${`${fractionalPart}00`.slice(0, 2)}`;
}

export function parseDecimalInputToPence(value: string): number | null {
  const normalized = normalizeMoneyDecimalString(value.trim().replace(/,/g, ""));

  if (!normalized) {
    return null;
  }

  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) {
    return null;
  }

  const parts = normalized.split(".");
  const wholePart = parts[0] ?? "0";
  const fractionalPart = parts[1] ?? "";
  const paddedFraction = `${fractionalPart}00`.slice(0, 2);
  const pence = Number.parseInt(wholePart, 10) * 100 + Number.parseInt(paddedFraction, 10);

  if (!Number.isFinite(pence) || pence < 0) {
    return null;
  }

  return pence;
}

/** Convert an external decimal money string to integer pence without float math. */
export function decimalMoneyStringToPence(value: string): number {
  return parseDecimalInputToPence(value) ?? 0;
}

/** Convert Prisma Decimal money values to integer pence via string representation. */
export function moneyDecimalToPence(value: Decimal | string): number {
  const decimalString = typeof value === "string" ? value : value.toFixed(2);

  return decimalMoneyStringToPence(normalizeMoneyDecimalString(decimalString));
}

export function formatPenceAsInput(pence: number): string {
  const pounds = Math.trunc(pence / 100);
  const remainder = Math.abs(pence % 100);

  return `${pence < 0 ? "-" : ""}${Math.abs(pounds)}.${String(remainder).padStart(2, "0")}`;
}

/** Display-only conversion for Intl currency formatting. */
function penceToDisplayPounds(pence: number): number {
  const pounds = Math.trunc(pence / 100);
  const remainder = Math.abs(pence % 100);

  return pounds + remainder / 100;
}

export function formatMoneyPence(
  pence: number,
  config: PaymentCurrencyConfig = DEFAULT_PAYMENT_CURRENCY_CONFIG,
): string {
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
  }).format(penceToDisplayPounds(pence));
}

export function calculateChangeDuePence(amountPence: number, amountTenderedPence: number): number {
  return Math.max(0, amountTenderedPence - amountPence);
}

export { DEFAULT_PAYMENT_CURRENCY, DEFAULT_PAYMENT_LOCALE };
