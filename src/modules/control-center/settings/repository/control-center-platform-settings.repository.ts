import "server-only";

import type { ConfigScope, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  PLATFORM_SETTINGS_GROUPS,
  PLATFORM_SETTINGS_SCOPE_IDENTIFIER,
} from "@/modules/control-center/settings/constants/control-center-platform-settings";
import type { ControlCenterPlatformSettingField } from "@/modules/control-center/settings/types/control-center-platform-settings-types";
import type { SettingDefinitionInput } from "@/modules/settings-engine/types/settings-engine-types";
import { ensureBootstrapSettingsEngine } from "@/modules/settings-engine/plugins/bootstrap-settings";
import { assertValidSettingValue } from "@/modules/settings-engine/engine/validation-engine";
import { getSettingDefinition } from "@/modules/settings-engine/registry/settings-registry";
import { registerModuleSettingDefinition } from "@/services/settings-engine.service";

const PLATFORM_SETTING_DEFINITIONS: SettingDefinitionInput[] = [
  {
    key: "general.platform_name",
    module: "platform",
    category: "general",
    valueType: "STRING",
    defaultValue: "Busal",
    helpText: "Platform display name",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "general.support_email",
    module: "platform",
    category: "general",
    valueType: "STRING",
    defaultValue: "support@getbusal.com",
    helpText: "Platform support contact email",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "auth.session_timeout_minutes",
    module: "iam",
    category: "authentication",
    valueType: "NUMBER",
    defaultValue: 480,
    minValue: 15,
    maxValue: 1440,
    helpText: "Session timeout in minutes",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "auth.password_min_length",
    module: "iam",
    category: "authentication",
    valueType: "NUMBER",
    defaultValue: 12,
    minValue: 8,
    maxValue: 128,
    helpText: "Minimum password length",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "auth.allow_sso",
    module: "iam",
    category: "authentication",
    valueType: "BOOLEAN",
    defaultValue: true,
    helpText: "Allow SSO authentication",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "commercial.default_plan",
    module: "commercial",
    category: "commercial",
    valueType: "ENUM",
    defaultValue: "starter",
    allowedValues: ["free", "starter", "growth", "enterprise"],
    helpText: "Default subscription plan for new tenants",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "commercial.trial_days",
    module: "commercial",
    category: "commercial",
    valueType: "NUMBER",
    defaultValue: 14,
    minValue: 0,
    maxValue: 90,
    helpText: "Default trial period in days",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "billing.invoice_prefix",
    module: "billing",
    category: "billing",
    valueType: "STRING",
    defaultValue: "BUS",
    helpText: "Invoice number prefix",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "billing.payment_terms_days",
    module: "billing",
    category: "billing",
    valueType: "NUMBER",
    defaultValue: 30,
    minValue: 0,
    maxValue: 120,
    helpText: "Default payment terms in days",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "billing.auto_charge",
    module: "billing",
    category: "billing",
    valueType: "BOOLEAN",
    defaultValue: true,
    helpText: "Automatically charge subscriptions",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "stripe.enabled",
    module: "billing",
    category: "stripe",
    valueType: "BOOLEAN",
    defaultValue: true,
    helpText: "Enable Stripe billing integration",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "stripe.webhook_tolerance_seconds",
    module: "billing",
    category: "stripe",
    valueType: "NUMBER",
    defaultValue: 300,
    minValue: 60,
    maxValue: 3600,
    helpText: "Stripe webhook tolerance window",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "ai.platform_token_limit",
    module: "ai",
    category: "ai",
    valueType: "NUMBER",
    defaultValue: 1000000,
    minValue: 10000,
    maxValue: 100000000,
    helpText: "Platform-wide monthly AI token limit",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "notifications.platform_alerts",
    module: "notifications",
    category: "notifications",
    valueType: "BOOLEAN",
    defaultValue: true,
    helpText: "Send platform alert notifications to operators",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "notifications.email_enabled",
    module: "notifications",
    category: "notifications",
    valueType: "BOOLEAN",
    defaultValue: true,
    helpText: "Enable platform email notifications",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "security.audit_retention_days",
    module: "iam",
    category: "security",
    valueType: "NUMBER",
    defaultValue: 365,
    minValue: 30,
    maxValue: 3650,
    helpText: "Audit log retention in days",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "security.ip_allowlist_enabled",
    module: "iam",
    category: "security",
    valueType: "BOOLEAN",
    defaultValue: false,
    helpText: "Restrict operator access by IP allowlist",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "storage.max_upload_mb",
    module: "platform",
    category: "storage",
    valueType: "NUMBER",
    defaultValue: 25,
    minValue: 1,
    maxValue: 512,
    helpText: "Maximum upload size in megabytes",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "storage.default_quota_gb",
    module: "platform",
    category: "storage",
    valueType: "NUMBER",
    defaultValue: 10,
    minValue: 1,
    maxValue: 1024,
    helpText: "Default tenant storage quota in GB",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "backups.retention_days",
    module: "platform",
    category: "backups",
    valueType: "NUMBER",
    defaultValue: 30,
    minValue: 7,
    maxValue: 365,
    helpText: "Backup retention period in days",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "backups.auto_backup_enabled",
    module: "platform",
    category: "backups",
    valueType: "BOOLEAN",
    defaultValue: true,
    helpText: "Enable automated platform backups",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "branding.platform_logo_url",
    module: "platform",
    category: "branding",
    valueType: "STRING",
    defaultValue: "",
    helpText: "Platform logo URL",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "branding.primary_color",
    module: "platform",
    category: "branding",
    valueType: "STRING",
    defaultValue: "#2563eb",
    regexPattern: "^#[0-9A-Fa-f]{6}$",
    helpText: "Platform primary brand color",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "platform.maintenance_mode",
    module: "platform",
    category: "maintenance",
    valueType: "ENUM",
    defaultValue: "NONE",
    allowedValues: ["NONE", "READ_ONLY", "FULL_LOCK", "SCHEDULED"],
    helpText: "Platform-wide maintenance mode",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "platform.maintenance_message",
    module: "platform",
    category: "maintenance",
    valueType: "STRING",
    defaultValue: "",
    helpText: "Maintenance message shown to users",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "platform.maintenance_scheduled_at",
    module: "platform",
    category: "maintenance",
    valueType: "STRING",
    defaultValue: "",
    helpText: "Scheduled maintenance start time (ISO)",
    supportedScopes: ["PLATFORM"],
  },
  {
    key: "platform.current_version",
    module: "platform",
    category: "platform",
    valueType: "STRING",
    defaultValue: "1.0.0",
    helpText: "Current deployed platform version",
    supportedScopes: ["PLATFORM"],
  },
];

let definitionsRegistered = false;

export async function ensurePlatformSettingsDefinitions(): Promise<void> {
  ensureBootstrapSettingsEngine();

  if (definitionsRegistered) {
    return;
  }

  for (const definition of PLATFORM_SETTING_DEFINITIONS) {
    await registerModuleSettingDefinition(definition);
  }

  definitionsRegistered = true;
}

export function getPlatformSettingsKeys(): string[] {
  return PLATFORM_SETTINGS_GROUPS.flatMap((group) => [...group.keys]);
}

export function validatePlatformSettingValue(key: string, value: unknown): string | null {
  const definition = getSettingDefinition(key);
  if (!definition) {
    return "Unknown setting key";
  }

  try {
    assertValidSettingValue(definition, value);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Invalid value";
  }
}

function formatLabel(key: string): string {
  return key
    .split(".")
    .slice(-1)[0]
    ?.replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase()) ?? key;
}

export async function loadPlatformSettingFields(): Promise<ControlCenterPlatformSettingField[]> {
  await ensurePlatformSettingsDefinitions();

  const keys = getPlatformSettingsKeys();
  const definitions = keys
    .map((key) => getSettingDefinition(key))
    .filter((definition): definition is NonNullable<typeof definition> => Boolean(definition));

  const stored = await prisma.configSettingValue.findMany({
    where: {
      definitionKey: { in: keys },
      scope: "PLATFORM",
      scopeIdentifier: PLATFORM_SETTINGS_SCOPE_IDENTIFIER,
      isDeleted: false,
    },
  });

  const storedByKey = new Map(stored.map((entry) => [entry.definitionKey, entry]));

  return definitions.map((definition) => {
    const storedValue = storedByKey.get(definition.key);
    const value = storedValue?.value ?? definition.defaultValue;

    return {
      key: definition.key,
      label: formatLabel(definition.key),
      groupId:
        PLATFORM_SETTINGS_GROUPS.find((group) =>
          (group.keys as readonly string[]).includes(definition.key),
        )?.id ?? "general",
      category: definition.category,
      valueType: definition.valueType,
      scope: "PLATFORM",
      environment: "PRODUCTION",
      value,
      defaultValue: definition.defaultValue,
      helpText: definition.helpText ?? null,
      allowedValues: definition.allowedValues ?? null,
      minValue: definition.minValue ?? null,
      maxValue: definition.maxValue ?? null,
      regexPattern: definition.regexPattern ?? null,
      isRequired: definition.isRequired ?? false,
      currentVersion: storedValue?.currentVersion ?? 0,
      updatedAt: storedValue?.updatedAt.toISOString() ?? null,
      validationError: validatePlatformSettingValue(definition.key, value),
    };
  });
}

export async function loadPlatformSettingHistory(key: string) {
  const stored = await prisma.configSettingValue.findUnique({
    where: {
      definitionKey_scope_environment_scopeIdentifier: {
        definitionKey: key,
        scope: "PLATFORM",
        environment: "PRODUCTION",
        scopeIdentifier: PLATFORM_SETTINGS_SCOPE_IDENTIFIER,
      },
    },
    select: { id: true },
  });

  if (!stored) {
    return [];
  }

  return prisma.configSettingVersion.findMany({
    where: { settingValueId: stored.id },
    include: { changedBy: { select: { email: true } } },
    orderBy: { version: "desc" },
    take: 25,
  });
}

export async function loadPlatformSettingsAudit(limit = 50) {
  const keys = getPlatformSettingsKeys();

  return prisma.configAuditLog.findMany({
    where: {
      definitionKey: { in: keys },
    },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function logPlatformSettingsSecurityAudit(input: {
  actorUserId: string;
  eventType: "PERMISSION_CHANGED" | "POLICY_VIOLATION";
  metadata: Record<string, unknown>;
}): Promise<void> {
  await prisma.iamSecurityAuditLog.create({
    data: {
      businessId: null,
      userId: input.actorUserId,
      eventType: input.eventType,
      metadata: {
        platformSettings: true,
        ...input.metadata,
      } as Prisma.InputJsonValue,
    },
  });
}

export async function loadPlatformSettingsExportPayload() {
  await ensurePlatformSettingsDefinitions();

  const keys = getPlatformSettingsKeys();
  const fields = await loadPlatformSettingFields();

  return {
    exportedAt: new Date().toISOString(),
    scope: "PLATFORM" as const,
    environment: "PRODUCTION" as const,
    settings: fields
      .filter((field) => keys.includes(field.key))
      .map((field) => ({ key: field.key, value: field.value })),
  };
}
