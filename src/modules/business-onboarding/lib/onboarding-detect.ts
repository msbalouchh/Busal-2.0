import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
} from "@/modules/business-onboarding/constants/onboarding-options";

const COUNTRY_CURRENCY: Record<string, string> = {
  GB: "GBP",
  US: "USD",
  CA: "CAD",
  AU: "AUD",
  IE: "EUR",
  AE: "AED",
  SG: "SGD",
  DE: "EUR",
  FR: "EUR",
};

const COUNTRY_TIMEZONE: Record<string, string> = {
  GB: "Europe/London",
  US: "America/New_York",
  CA: "America/Toronto",
  AU: "Australia/Sydney",
  IE: "Europe/Dublin",
  AE: "Asia/Dubai",
  SG: "Asia/Singapore",
  DE: "Europe/Paris",
  FR: "Europe/Paris",
};

export function detectTimezone(): string {
  if (typeof Intl === "undefined") {
    return TIMEZONE_OPTIONS[0]!.value;
  }

  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const match = TIMEZONE_OPTIONS.find((option) => option.value === detected);
  return match?.value ?? detected ?? TIMEZONE_OPTIONS[0]!.value;
}

export function detectLanguage(): string {
  if (typeof navigator === "undefined") {
    return LANGUAGE_OPTIONS[0]!.value;
  }

  const locale = navigator.language;
  const match = LANGUAGE_OPTIONS.find(
    (option) => option.value === locale || locale.startsWith(option.value.split("-")[0]!),
  );
  return match?.value ?? LANGUAGE_OPTIONS[0]!.value;
}

export function detectCountry(): string {
  if (typeof navigator === "undefined") {
    return COUNTRY_OPTIONS[0]!.value;
  }

  const locale = navigator.language;
  const region = locale.split("-")[1]?.toUpperCase();
  const match = COUNTRY_OPTIONS.find((option) => option.value === region);
  return match?.value ?? COUNTRY_OPTIONS[0]!.value;
}

export function detectCurrencyForCountry(country: string): string {
  const currency = COUNTRY_CURRENCY[country];
  if (currency) {
    return currency;
  }
  return CURRENCY_OPTIONS[0]!.value;
}

export function detectTimezoneForCountry(country: string): string {
  return COUNTRY_TIMEZONE[country] ?? detectTimezone();
}

export function detectLocationDefaults() {
  const country = detectCountry();
  return {
    country,
    timezone: detectTimezoneForCountry(country),
    currency: detectCurrencyForCountry(country),
    language: detectLanguage(),
    dateFormat: country === "US" ? "MM/DD/YYYY" : "DD/MM/YYYY",
    timeFormat: country === "US" ? ("12h" as const) : ("24h" as const),
  };
}
