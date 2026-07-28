import { CONFIG_CATEGORIES, CONFIG_SCOPES } from "@/modules/settings-engine/constants/routes";
import { registerSettingDefinition } from "@/modules/settings-engine/registry/settings-registry";
import type { SettingDefinitionInput } from "@/modules/settings-engine/types/settings-engine-types";

const DEFAULT_SETTINGS: SettingDefinitionInput[] = [
  {
    key: "general.business_name",
    module: "settings",
    category: "general",
    valueType: "STRING",
    defaultValue: "",
    isRequired: true,
    helpText: "Display name for the business",
    supportedScopes: ["PLATFORM", "TENANT", "BUSINESS"],
  },
  {
    key: "localization.timezone",
    module: "settings",
    category: "timezone",
    valueType: "STRING",
    defaultValue: "UTC",
    allowedValues: ["UTC", "Europe/London", "America/New_York"],
    helpText: "Default timezone for scheduling and reporting",
    supportedScopes: CONFIG_SCOPES as unknown as SettingDefinitionInput["supportedScopes"],
  },
  {
    key: "localization.locale",
    module: "settings",
    category: "localization",
    valueType: "ENUM",
    defaultValue: "en-GB",
    allowedValues: ["en-GB", "en-US", "fr-FR"],
    helpText: "Default locale",
    supportedScopes: ["PLATFORM", "TENANT", "BUSINESS", "BRANCH", "USER"],
  },
  {
    key: "currency.default",
    module: "settings",
    category: "currency",
    valueType: "ENUM",
    defaultValue: "GBP",
    allowedValues: ["GBP", "USD", "EUR"],
    helpText: "Default currency code",
    supportedScopes: ["PLATFORM", "TENANT", "BUSINESS", "BRANCH"],
  },
  {
    key: "branding.primary_color",
    module: "settings",
    category: "branding",
    valueType: "STRING",
    defaultValue: "#2563eb",
    regexPattern: "^#[0-9A-Fa-f]{6}$",
    helpText: "Primary brand color hex code",
    supportedScopes: ["BUSINESS", "BRANCH"],
  },
  {
    key: "tax.default_rate",
    module: "settings",
    category: "tax",
    valueType: "NUMBER",
    defaultValue: 20,
    minValue: 0,
    maxValue: 100,
    helpText: "Default tax rate percentage",
    supportedScopes: ["BUSINESS", "BRANCH"],
  },
  {
    key: "notifications.email_enabled",
    module: "notifications",
    category: "notifications",
    valueType: "BOOLEAN",
    defaultValue: true,
    helpText: "Enable email notifications",
    supportedScopes: ["BUSINESS", "BRANCH", "USER"],
  },
  {
    key: "communication.auto_assign",
    module: "communication",
    category: "communication",
    valueType: "BOOLEAN",
    defaultValue: false,
    helpText: "Automatically assign inbound conversations",
    supportedScopes: ["BUSINESS", "BRANCH"],
  },
  {
    key: "security.mfa_required",
    module: "iam",
    category: "security",
    valueType: "BOOLEAN",
    defaultValue: false,
    helpText: "Require MFA for all staff",
    supportedScopes: ["PLATFORM", "TENANT", "BUSINESS"],
  },
  {
    key: "ai.default_model",
    module: "ai",
    category: "ai",
    valueType: "STRING",
    defaultValue: "gpt-4o-mini",
    helpText: "Default AI model identifier",
    supportedScopes: ["PLATFORM", "BUSINESS"],
  },
  {
    key: "marketplace.auto_update",
    module: "marketplace",
    category: "marketplace",
    valueType: "BOOLEAN",
    defaultValue: true,
    helpText: "Automatically update installed marketplace assets",
    supportedScopes: ["BUSINESS"],
  },
  {
    key: "pos.receipt_footer",
    module: "pos",
    category: "pos",
    valueType: "STRING",
    defaultValue: "Thank you for your visit",
    helpText: "Receipt footer message",
    supportedScopes: ["BUSINESS", "BRANCH"],
  },
  {
    key: "restaurant.service_charge",
    module: "restaurant",
    category: "restaurant",
    valueType: "NUMBER",
    defaultValue: 0,
    minValue: 0,
    maxValue: 25,
    helpText: "Optional service charge percentage",
    supportedScopes: ["BUSINESS", "BRANCH"],
  },
  {
    key: "crm.lead_auto_assign",
    module: "crm",
    category: "crm",
    valueType: "BOOLEAN",
    defaultValue: true,
    helpText: "Auto-assign new CRM leads",
    supportedScopes: ["BUSINESS", "DEPARTMENT"],
  },
  {
    key: "inventory.low_stock_threshold",
    module: "inventory",
    category: "inventory",
    valueType: "NUMBER",
    defaultValue: 10,
    minValue: 0,
    helpText: "Low stock alert threshold",
    supportedScopes: ["BUSINESS", "BRANCH"],
  },
  {
    key: "reporting.default_period",
    module: "reporting",
    category: "reporting",
    valueType: "ENUM",
    defaultValue: "30d",
    allowedValues: ["7d", "30d", "90d", "365d"],
    helpText: "Default reporting period",
    supportedScopes: ["BUSINESS", "USER"],
  },
  {
    key: "integrations.webhook_secret",
    module: "integrations",
    category: "integrations",
    valueType: "SECRET",
    defaultValue: "",
    helpText: "Webhook signing secret",
    supportedScopes: ["BUSINESS"],
  },
  {
    key: "general.feature_flags",
    module: "settings",
    category: "general",
    valueType: "JSON",
    defaultValue: { betaDashboard: false },
    helpText: "Feature flag configuration object",
    supportedScopes: ["PLATFORM", "BUSINESS", "MODULE"],
  },
];

let bootstrapped = false;

export function ensureBootstrapSettingsEngine(): void {
  if (bootstrapped) {
    return;
  }

  for (const definition of DEFAULT_SETTINGS) {
    registerSettingDefinition({
      ...definition,
      isActive: true,
    });
  }

  bootstrapped = true;
}

export function resetBootstrapSettingsEngine(): void {
  bootstrapped = false;
}

export function getDefaultSettingCount(): number {
  return DEFAULT_SETTINGS.length;
}

export function getDefaultCategoryCount(): number {
  return CONFIG_CATEGORIES.length;
}

export const DEFAULT_REGISTERED_SETTINGS = DEFAULT_SETTINGS;
