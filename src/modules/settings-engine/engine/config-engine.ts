import type { ConfigEnvironment } from "@prisma/client";

import { normalizeEnvironment } from "@/modules/settings-engine/engine/environment-engine";
import {
  resolveCategoryConfiguration,
  resolveInheritedConfiguration,
  type StoredConfigValueWithDeleted,
} from "@/modules/settings-engine/engine/inheritance-engine";
import { getSettingDefinition } from "@/modules/settings-engine/registry/settings-registry";
import type {
  ConfigurationContext,
  RegisteredSettingDefinition,
  ResolvedConfiguration,
} from "@/modules/settings-engine/types/settings-engine-types";

export function resolveConfigurationValue(input: {
  key: string;
  storedValues: StoredConfigValueWithDeleted[];
  context: ConfigurationContext;
  environment?: ConfigEnvironment;
}): ResolvedConfiguration | null {
  const definition = getSettingDefinition(input.key);
  if (!definition) {
    return null;
  }

  return resolveInheritedConfiguration({
    definition,
    storedValues: input.storedValues,
    context: input.context,
    environment: normalizeEnvironment(input.environment),
  });
}

export function resolveConfigurationByCategory(input: {
  category: string;
  storedValues: StoredConfigValueWithDeleted[];
  context: ConfigurationContext;
  environment?: ConfigEnvironment;
  definitions: RegisteredSettingDefinition[];
}): ResolvedConfiguration[] {
  return resolveCategoryConfiguration({
    definitions: input.definitions,
    storedValues: input.storedValues,
    context: input.context,
    environment: normalizeEnvironment(input.environment),
    category: input.category,
  });
}

export function buildConfigurationMap(resolved: ResolvedConfiguration[]): Record<string, unknown> {
  return Object.fromEntries(resolved.map((entry) => [entry.key, entry.value]));
}
