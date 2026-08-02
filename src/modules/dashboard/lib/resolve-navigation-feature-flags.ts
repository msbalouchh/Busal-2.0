import "server-only";

import { prisma } from "@/lib/prisma";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { getDashboardNavGroups } from "@/modules/dashboard/constants/navigation";
import { evaluateFeatureFlag } from "@/modules/feature-flags/engine/evaluation-engine";
import { ensureBootstrapFeatureFlags } from "@/modules/feature-flags/plugins/bootstrap-feature-flags";
import {
  getFeatureDefinition,
  listFeatureDefinitions,
} from "@/modules/feature-flags/registry/feature-registry";
import type {
  FeatureEvaluationContext,
  FeatureFlagRecord,
} from "@/modules/feature-flags/types/feature-flags-types";

function buildEvaluationContext(platform: BusinessContext): FeatureEvaluationContext {
  return {
    businessId: platform.business.id,
    branchId: platform.branchId,
    roleSlug: platform.roleSlug,
    userId: platform.user.id,
    country: platform.business.country ?? null,
    environment: process.env.NODE_ENV ?? "production",
    businessAttributes: {
      businessType: platform.business.businessType,
      onboardingCompleted: platform.business.onboardingCompleted,
    },
    userAttributes: {
      email: platform.user.email,
      role: platform.roleSlug,
    },
  };
}

function mapFlagRecord(flag: {
  id: string;
  key: string;
  name: string;
  module: string;
  flagType: FeatureFlagRecord["flagType"];
  status: FeatureFlagRecord["status"];
  defaultEnabled: boolean;
  rolloutPercentage: number;
  scheduledActivateAt: Date | null;
  scheduledDeactivateAt: Date | null;
  conditions: unknown;
  metadata: unknown;
}): FeatureFlagRecord {
  return {
    id: flag.id,
    key: flag.key,
    name: flag.name,
    module: flag.module,
    flagType: flag.flagType,
    status: flag.status,
    defaultEnabled: flag.defaultEnabled,
    rolloutPercentage: flag.rolloutPercentage,
    scheduledActivateAt: flag.scheduledActivateAt,
    scheduledDeactivateAt: flag.scheduledDeactivateAt,
    conditions: (flag.conditions as FeatureFlagRecord["conditions"]) ?? [],
    metadata: (flag.metadata as FeatureFlagRecord["metadata"]) ?? null,
  };
}

function collectNavFeatureFlagKeys(): string[] {
  const keys = new Set<string>();

  for (const group of getDashboardNavGroups()) {
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

export async function resolveNavigationFeatureFlags(
  platform: BusinessContext,
): Promise<Record<string, boolean>> {
  ensureBootstrapFeatureFlags();

  const keys = collectNavFeatureFlagKeys();
  const context = buildEvaluationContext(platform);
  const results: Record<string, boolean> = {};

  if (keys.length === 0) {
    return results;
  }

  const flags = await prisma.featureFlag.findMany({
    where: {
      businessId: platform.business.id,
      key: { in: keys },
    },
    include: { targets: true },
  });

  const flagMap = new Map(flags.map((flag) => [flag.key, flag]));

  for (const key of keys) {
    const flag = flagMap.get(key);
    const definition = getFeatureDefinition(key);

    if (!flag) {
      results[key] = definition?.defaultEnabled ?? true;
      continue;
    }

    const evaluation = evaluateFeatureFlag({
      flag: mapFlagRecord(flag),
      targets: flag.targets,
      context,
    });

    results[key] = evaluation.enabled;
  }

  for (const definition of listFeatureDefinitions()) {
    if (!(definition.key in results)) {
      results[definition.key] = definition.defaultEnabled;
    }
  }

  return results;
}
