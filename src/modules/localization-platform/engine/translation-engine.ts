import { DEFAULT_FALLBACK_LANGUAGE } from "@/modules/localization-platform/constants/routes";

export function resolveTranslationValue(input: {
  key: string;
  languageCode: string;
  fallbackLanguageCode?: string;
  translations: Record<string, string>;
  defaultValue: string;
}): { value: string; usedFallback: boolean } {
  const fallback = input.fallbackLanguageCode ?? DEFAULT_FALLBACK_LANGUAGE;

  const direct = input.translations[input.languageCode];
  if (direct) {
    return { value: direct, usedFallback: false };
  }

  const fallbackValue = input.translations[fallback];
  if (fallbackValue) {
    return { value: fallbackValue, usedFallback: true };
  }

  return { value: input.defaultValue, usedFallback: true };
}

export function buildTranslationMap(
  entries: Array<{ key: string; languageCode: string; value: string }>,
): Record<string, Record<string, string>> {
  const map: Record<string, Record<string, string>> = {};

  for (const entry of entries) {
    const bucket = map[entry.key] ?? {};
    bucket[entry.languageCode] = entry.value;
    map[entry.key] = bucket;
  }

  return map;
}
