import { CONFIG_SCOPES } from "@/modules/settings-engine/constants/routes";
import { registerModuleSettingDefinition } from "@/services/settings-engine.service";
import type { SettingDefinitionInput } from "@/modules/settings-engine/types/settings-engine-types";

const BUSINESS_PROFILE_SETTINGS: SettingDefinitionInput[] = [
  {
    key: "branding.secondary_color",
    module: "business",
    category: "branding",
    valueType: "STRING",
    defaultValue: "#64748b",
    regexPattern: "^#[0-9A-Fa-f]{6}$",
    helpText: "Secondary brand colour hex code",
    supportedScopes: ["BUSINESS", "BRANCH"],
  },
  {
    key: "localization.date_format",
    module: "business",
    category: "localization",
    valueType: "ENUM",
    defaultValue: "DD/MM/YYYY",
    allowedValues: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"],
    helpText: "Default date display format",
    supportedScopes: ["BUSINESS", "BRANCH", "USER"],
  },
  {
    key: "localization.time_format",
    module: "business",
    category: "localization",
    valueType: "ENUM",
    defaultValue: "24h",
    allowedValues: ["12h", "24h"],
    helpText: "Default time display format",
    supportedScopes: ["BUSINESS", "BRANCH", "USER"],
  },
  {
    key: "business.week_start",
    module: "business",
    category: "general",
    valueType: "ENUM",
    defaultValue: "monday",
    allowedValues: ["monday", "sunday"],
    helpText: "First day of the business week",
    supportedScopes: ["BUSINESS"],
  },
  {
    key: "business.status",
    module: "business",
    category: "general",
    valueType: "ENUM",
    defaultValue: "active",
    allowedValues: ["active", "inactive", "maintenance"],
    helpText: "Operational status of the business",
    supportedScopes: ["BUSINESS"],
  },
  {
    key: "business.auto_confirm_orders",
    module: "business",
    category: "operational",
    valueType: "BOOLEAN",
    defaultValue: false,
    helpText: "Automatically confirm incoming orders",
    supportedScopes: ["BUSINESS", "BRANCH"],
  },
  {
    key: "business.allow_online_ordering",
    module: "business",
    category: "operational",
    valueType: "BOOLEAN",
    defaultValue: true,
    helpText: "Allow customers to place online orders",
    supportedScopes: ["BUSINESS", "BRANCH"],
  },
  {
    key: "business.require_staff_pin",
    module: "business",
    category: "operational",
    valueType: "BOOLEAN",
    defaultValue: false,
    helpText: "Require staff PIN for sensitive actions",
    supportedScopes: ["BUSINESS"],
  },
];

let bootstrapped = false;

export async function ensureBootstrapBusinessProfileSettings(): Promise<void> {
  if (bootstrapped) {
    return;
  }

  for (const definition of BUSINESS_PROFILE_SETTINGS) {
    await registerModuleSettingDefinition({
      ...definition,
      supportedScopes:
        definition.supportedScopes ??
        (CONFIG_SCOPES as unknown as SettingDefinitionInput["supportedScopes"]),
    });
  }

  bootstrapped = true;
}

export function getBusinessProfileSettingCount(): number {
  return BUSINESS_PROFILE_SETTINGS.length;
}
