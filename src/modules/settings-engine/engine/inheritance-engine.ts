import type { ConfigEnvironment, ConfigScope } from "@prisma/client";

import { SCOPE_PRIORITY } from "@/modules/settings-engine/constants/routes";
import type {
  ConfigurationContext,
  RegisteredSettingDefinition,
  ResolvedConfiguration,
} from "@/modules/settings-engine/types/settings-engine-types";

type ScopePriorityKey = keyof typeof SCOPE_PRIORITY;

export interface StoredConfigValue {
  key: string;
  scope: ConfigScope;
  environment: ConfigEnvironment;
  scopeIdentifier: string;
  value: unknown;
  priority: number;
}

export function buildScopeIdentifier(
  scope: ConfigScope,
  context: ConfigurationContext,
): string | null {
  switch (scope) {
    case "PLATFORM":
      return "platform";
    case "TENANT":
      return context.businessId ? `tenant:${context.businessId}` : null;
    case "BUSINESS":
      return context.businessId ? `business:${context.businessId}` : null;
    case "BRANCH":
      return context.businessId && context.branchId
        ? `branch:${context.businessId}:${context.branchId}`
        : null;
    case "DEPARTMENT":
      return context.businessId && context.department
        ? `department:${context.businessId}:${context.department}`
        : null;
    case "ROLE":
      return context.businessId && context.roleSlug
        ? `role:${context.businessId}:${context.roleSlug}`
        : null;
    case "USER":
      return context.businessId && context.userId
        ? `user:${context.businessId}:${context.userId}`
        : null;
    case "MODULE":
      return context.businessId && context.moduleKey
        ? `module:${context.businessId}:${context.moduleKey}`
        : null;
    default:
      return null;
  }
}

export function getApplicableScopeIdentifiers(
  context: ConfigurationContext,
): Array<{ scope: ConfigScope; scopeIdentifier: string; priority: number }> {
  const scopes: ConfigScope[] = [
    "PLATFORM",
    "TENANT",
    "BUSINESS",
    "BRANCH",
    "DEPARTMENT",
    "ROLE",
    "USER",
    "MODULE",
  ];

  const applicable: Array<{ scope: ConfigScope; scopeIdentifier: string; priority: number }> = [];

  for (const scope of scopes) {
    const scopeIdentifier = buildScopeIdentifier(scope, context);
    if (scopeIdentifier) {
      applicable.push({
        scope,
        scopeIdentifier,
        priority: SCOPE_PRIORITY[scope as ScopePriorityKey],
      });
    }
  }

  return applicable;
}

export function resolveInheritedConfiguration(input: {
  definition: RegisteredSettingDefinition;
  storedValues: StoredConfigValueWithDeleted[];
  context: ConfigurationContext;
  environment: ConfigEnvironment;
}): ResolvedConfiguration {
  const applicableScopes = getApplicableScopeIdentifiers(input.context);
  let resolvedValue = input.definition.defaultValue;
  let resolvedScope: ConfigScope = "PLATFORM";
  let resolvedEnvironment: ConfigEnvironment = "PRODUCTION";
  let source: "default" | "override" = "default";

  for (const scopeEntry of applicableScopes) {
    const environmentMatches = input.storedValues.filter(
      (stored) =>
        stored.key === input.definition.key &&
        stored.scope === scopeEntry.scope &&
        stored.scopeIdentifier === scopeEntry.scopeIdentifier &&
        !stored.valueIsDeleted,
    );

    const envValue =
      environmentMatches.find((entry) => entry.environment === input.environment) ??
      environmentMatches.find((entry) => entry.environment === "PRODUCTION");

    if (envValue) {
      resolvedValue = envValue.value;
      resolvedScope = envValue.scope;
      resolvedEnvironment = envValue.environment;
      source = "override";
    }
  }

  return {
    key: input.definition.key,
    value: maskSecretValue(input.definition, resolvedValue),
    scope: resolvedScope,
    environment: resolvedEnvironment,
    source,
    definition: input.definition,
  };
}

export function resolveCategoryConfiguration(input: {
  definitions: RegisteredSettingDefinition[];
  storedValues: StoredConfigValueWithDeleted[];
  context: ConfigurationContext;
  environment: ConfigEnvironment;
  category: string;
}): ResolvedConfiguration[] {
  return input.definitions
    .filter((definition) => definition.category === input.category)
    .map((definition) =>
      resolveInheritedConfiguration({
        definition,
        storedValues: input.storedValues,
        context: input.context,
        environment: input.environment,
      }),
    );
}

function maskSecretValue(definition: RegisteredSettingDefinition, value: unknown): unknown {
  if (definition.valueType !== "SECRET") {
    return value;
  }

  if (typeof value === "string" && value.length > 0) {
    return "••••••••";
  }

  return value;
}

export type StoredConfigValueWithDeleted = StoredConfigValue & { valueIsDeleted?: boolean };

export function toStoredConfigValues(
  records: Array<{
    definitionKey: string;
    scope: ConfigScope;
    environment: ConfigEnvironment;
    scopeIdentifier: string;
    value: unknown;
    isDeleted: boolean;
  }>,
): StoredConfigValueWithDeleted[] {
  return records.map((record) => ({
    key: record.definitionKey,
    scope: record.scope,
    environment: record.environment,
    scopeIdentifier: record.scopeIdentifier,
    value: record.value,
    priority: SCOPE_PRIORITY[record.scope as ScopePriorityKey],
    valueIsDeleted: record.isDeleted,
  }));
}
