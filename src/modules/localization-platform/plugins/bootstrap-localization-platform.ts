import { registerTranslationKeyDefinition } from "@/modules/localization-platform/registry/translation-key-registry";
import type { RegisteredTranslationKeyDefinition } from "@/modules/localization-platform/types/localization-platform-types";

const DEFAULT_KEYS: Omit<RegisteredTranslationKeyDefinition, "isActive">[] = [
  {
    key: "common.save",
    module: "common",
    defaultValue: "Save",
    translations: { ar: "حفظ", ur: "محفوظ", fr: "Enregistrer", es: "Guardar" },
  },
  {
    key: "common.cancel",
    module: "common",
    defaultValue: "Cancel",
    translations: { ar: "إلغاء", ur: "منسوخ", fr: "Annuler", es: "Cancelar" },
  },
  {
    key: "dashboard.title",
    module: "dashboard",
    defaultValue: "Dashboard",
    translations: { ar: "لوحة التحكم", ur: "ڈیش بورڈ", fr: "Tableau de bord", es: "Panel" },
  },
  {
    key: "notifications.title",
    module: "notifications",
    defaultValue: "Notifications",
    translations: { ar: "الإشعارات", ur: "اطلاعات", fr: "Notifications", es: "Notificaciones" },
  },
  {
    key: "communication.title",
    module: "communication",
    defaultValue: "Communication",
    translations: { ar: "التواصل", ur: "مواصلات", fr: "Communication", es: "Comunicación" },
  },
  {
    key: "settings.title",
    module: "settings-engine",
    defaultValue: "Settings",
    translations: { ar: "الإعدادات", ur: "ترتیبات", fr: "Paramètres", es: "Configuración" },
  },
  {
    key: "ai.title",
    module: "ai",
    defaultValue: "Busal AI",
    translations: { ar: "بوسal AI", ur: "بوسal AI", fr: "Busal IA", es: "Busal IA" },
  },
  {
    key: "localization.title",
    module: "localization-platform",
    defaultValue: "Localization",
    translations: { ar: "الترجمة", ur: "ترجمہ", fr: "Localisation", es: "Localización" },
  },
];

let bootstrapped = false;

export function ensureBootstrapLocalizationPlatform(): void {
  if (bootstrapped) {
    return;
  }

  for (const entry of DEFAULT_KEYS) {
    registerTranslationKeyDefinition({ ...entry, isActive: true });
  }

  bootstrapped = true;
}

export function resetBootstrapLocalizationPlatform(): void {
  bootstrapped = false;
}

export function getDefaultTranslationKeyCount(): number {
  return DEFAULT_KEYS.length;
}

export const DEFAULT_REGISTERED_KEYS = DEFAULT_KEYS;
