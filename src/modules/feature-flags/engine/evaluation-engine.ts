import type { FeatureFlagStatus } from "@prisma/client";

import { evaluateConditions } from "@/modules/feature-flags/engine/condition-engine";
import { isInRolloutBucket } from "@/modules/feature-flags/engine/rollout-engine";
import {
  isWithinScheduledWindow,
  resolveScheduledStatus,
} from "@/modules/feature-flags/engine/scheduling-engine";
import { matchesTargetingRules } from "@/modules/feature-flags/engine/targeting-engine";
import type {
  FeatureEvaluationContext,
  FeatureEvaluationResult,
  FeatureFlagRecord,
  FeatureTargetRule,
} from "@/modules/feature-flags/types/feature-flags-types";

export function evaluateFeatureFlag(input: {
  flag: FeatureFlagRecord;
  targets: FeatureTargetRule[];
  context: FeatureEvaluationContext;
  now?: Date;
}): FeatureEvaluationResult {
  const now = input.now ?? new Date();

  if (input.flag.status === "ARCHIVED" || input.flag.status === "DEPRECATED") {
    return {
      key: input.flag.key,
      enabled: false,
      reason: `Flag is ${input.flag.status.toLowerCase()}`,
      flagType: input.flag.flagType,
      flagId: input.flag.id,
    };
  }

  if (input.flag.status === "DRAFT") {
    return {
      key: input.flag.key,
      enabled: false,
      reason: "Flag is in draft status",
      flagType: input.flag.flagType,
      flagId: input.flag.id,
    };
  }

  if (!matchesTargetingRules(input.targets, input.context)) {
    return {
      key: input.flag.key,
      enabled: false,
      reason: "Targeting rules not matched",
      flagType: input.flag.flagType,
      flagId: input.flag.id,
    };
  }

  const scheduleStatus = resolveScheduledStatus(
    now,
    input.flag.scheduledActivateAt,
    input.flag.scheduledDeactivateAt,
  );

  if (
    input.flag.flagType === "SCHEDULED_ACTIVATION" ||
    input.flag.flagType === "SCHEDULED_DEACTIVATION"
  ) {
    const inWindow = isWithinScheduledWindow(
      now,
      input.flag.scheduledActivateAt,
      input.flag.scheduledDeactivateAt,
    );

    return {
      key: input.flag.key,
      enabled: inWindow && input.flag.defaultEnabled,
      reason: `Scheduled flag ${scheduleStatus}`,
      flagType: input.flag.flagType,
      flagId: input.flag.id,
    };
  }

  if (input.flag.flagType === "PERCENTAGE_ROLLOUT") {
    const contextKey =
      input.context.userId ?? input.context.businessId ?? input.context.branchId ?? "anonymous";
    const enabled = isInRolloutBucket(input.flag.key, contextKey, input.flag.rolloutPercentage);

    return {
      key: input.flag.key,
      enabled,
      reason: enabled ? "Included in rollout bucket" : "Excluded from rollout bucket",
      flagType: input.flag.flagType,
      flagId: input.flag.id,
    };
  }

  if (input.flag.flagType === "CONDITIONAL") {
    const conditionsMet = evaluateConditions(input.flag.conditions, input.context);

    return {
      key: input.flag.key,
      enabled: conditionsMet && input.flag.defaultEnabled,
      reason: conditionsMet ? "Conditions satisfied" : "Conditions not satisfied",
      flagType: input.flag.flagType,
      flagId: input.flag.id,
    };
  }

  const scheduleBlocked = !isWithinScheduledWindow(
    now,
    input.flag.scheduledActivateAt,
    input.flag.scheduledDeactivateAt,
  );

  if (scheduleBlocked) {
    return {
      key: input.flag.key,
      enabled: false,
      reason: "Outside scheduled activation window",
      flagType: input.flag.flagType,
      flagId: input.flag.id,
    };
  }

  return {
    key: input.flag.key,
    enabled: input.flag.defaultEnabled,
    reason: input.flag.defaultEnabled ? "Boolean flag enabled" : "Boolean flag disabled",
    flagType: input.flag.flagType,
    flagId: input.flag.id,
  };
}

export function evaluateMultipleFlags(input: {
  flags: Array<{ flag: FeatureFlagRecord; targets: FeatureTargetRule[] }>;
  context: FeatureEvaluationContext;
  now?: Date;
}): FeatureEvaluationResult[] {
  return input.flags.map((entry) =>
    evaluateFeatureFlag({
      flag: entry.flag,
      targets: entry.targets,
      context: input.context,
      now: input.now,
    }),
  );
}

export function isFeatureEnabled(results: FeatureEvaluationResult[], key: string): boolean {
  return results.find((result) => result.key === key)?.enabled ?? false;
}

export function assertActiveStatus(status: FeatureFlagStatus): boolean {
  return status === "ACTIVE" || status === "SCHEDULED";
}
