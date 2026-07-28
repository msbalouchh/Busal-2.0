export {
  LOCALIZATION_PLATFORM_ROUTES,
  LOCALIZATION_PLATFORM_NAV_ITEMS,
  SUPPORTED_LANGUAGE_CODES,
  RTL_LANGUAGE_CODES,
} from "@/modules/localization-platform/constants/routes";
export { LocalizationPlatformNav } from "@/modules/localization-platform/components/localization-platform-nav";
export { LocalizationPlatformDashboard } from "@/modules/localization-platform/components/localization-platform-dashboard";
export { LocalizationPlatformLists } from "@/modules/localization-platform/components/localization-platform-lists";
export {
  registerTranslationKeyDefinition,
  listTranslationKeyDefinitions,
  isTranslationKeyRegistered,
} from "@/modules/localization-platform/registry/translation-key-registry";
export { ensureBootstrapLocalizationPlatform } from "@/modules/localization-platform/plugins/bootstrap-localization-platform";
export { resolveTranslationValue } from "@/modules/localization-platform/engine/translation-engine";
export {
  resolveEffectiveLanguage,
  isRtlLanguage,
} from "@/modules/localization-platform/engine/locale-engine";
export {
  formatDate,
  formatCurrency,
} from "@/modules/localization-platform/engine/formatting-engine";
