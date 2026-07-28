import type { LocalizationTextDirection } from "@prisma/client";

import { RTL_LANGUAGE_CODES } from "@/modules/localization-platform/constants/routes";

export function resolveTextDirection(languageCode: string): LocalizationTextDirection {
  return (RTL_LANGUAGE_CODES as readonly string[]).includes(languageCode) ? "RTL" : "LTR";
}

export function isRtlLanguage(languageCode: string): boolean {
  return resolveTextDirection(languageCode) === "RTL";
}

export function resolveEffectiveLanguage(input: {
  userLanguage?: string | null;
  businessLanguage?: string | null;
  branchLanguage?: string | null;
  fallbackLanguage?: string;
}): string {
  return (
    input.branchLanguage ??
    input.userLanguage ??
    input.businessLanguage ??
    input.fallbackLanguage ??
    "en"
  );
}
