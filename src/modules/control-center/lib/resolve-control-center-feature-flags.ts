import "server-only";

import { getControlCenterNavigationRegistry } from "@/modules/control-center/constants/navigation";
import { ensureBootstrapFeatureFlags } from "@/modules/feature-flags/plugins/bootstrap-feature-flags";
import { listFeatureDefinitions } from "@/modules/feature-flags/registry/feature-registry";

function collectNavFeatureFlagKeys(): string[] {
  const keys = new Set<string>();

  for (const group of getControlCenterNavigationRegistry()) {
    for (const item of group.items) {
      if (item.featureFlag) {
        keys.add(item.featureFlag);
      }

      for (const child of item.children ?? []) {
        if (child.featureFlag) {
          keys.add(child.featureFlag);
        }
      }
    }
  }

  return Array.from(keys);
}

export async function resolveControlCenterFeatureFlags(): Promise<Record<string, boolean>> {
  ensureBootstrapFeatureFlags();

  const keys = collectNavFeatureFlagKeys();
  const results: Record<string, boolean> = {};

  for (const key of keys) {
    results[key] = true;
  }

  for (const definition of listFeatureDefinitions()) {
    if (!(definition.key in results)) {
      results[definition.key] = definition.defaultEnabled;
    }
  }

  return results;
}
