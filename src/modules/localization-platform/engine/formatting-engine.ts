export function formatDate(value: Date, locale: string, dateFormat: string): string {
  if (dateFormat === "yyyy-MM-dd") {
    return value.toISOString().slice(0, 10);
  }

  return new Intl.DateTimeFormat(locale).format(value);
}

export function formatTime(value: Date, locale: string, timeFormat: string): string {
  if (timeFormat === "HH:mm") {
    return value.toISOString().slice(11, 16);
  }

  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatCurrency(value: number, locale: string, currencyCode: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(value);
}

export function resolveTimezoneOffset(timezone: string): string {
  return timezone || "UTC";
}
