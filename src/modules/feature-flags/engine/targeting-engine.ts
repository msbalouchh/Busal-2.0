import type { FeatureFlagTargetType } from "@prisma/client";

import type {
  FeatureEvaluationContext,
  FeatureTargetRule,
} from "@/modules/feature-flags/types/feature-flags-types";

export interface StoredTargetRule extends FeatureTargetRule {
  id?: string;
}

function getContextValue(
  context: FeatureEvaluationContext,
  targetType: FeatureFlagTargetType,
): string | null {
  switch (targetType) {
    case "PLATFORM":
      return "platform";
    case "TENANT":
      return context.businessId ? `tenant:${context.businessId}` : null;
    case "BUSINESS":
      return context.businessId ?? null;
    case "BRANCH":
      return context.branchId ?? null;
    case "DEPARTMENT":
      return context.department ?? null;
    case "ROLE":
      return context.roleSlug ?? null;
    case "USER":
      return context.userId ?? null;
    case "SUBSCRIPTION_PLAN":
      return context.subscriptionPlan ?? null;
    case "MARKETPLACE_LICENSE":
      return context.marketplaceLicense ?? null;
    case "COUNTRY":
      return context.country ?? null;
    case "REGION":
      return context.region ?? null;
    case "ENVIRONMENT":
      return context.environment ?? null;
    default:
      return null;
  }
}

export function matchesTargetingRules(
  targets: StoredTargetRule[],
  context: FeatureEvaluationContext,
): boolean {
  if (targets.length === 0) {
    return true;
  }

  const sorted = [...targets].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  let matched = false;

  for (const rule of sorted) {
    const contextValue = getContextValue(context, rule.targetType);
    if (!contextValue) {
      continue;
    }

    const isMatch =
      contextValue === rule.targetValue ||
      rule.targetValue === "*" ||
      contextValue.includes(rule.targetValue);

    if (isMatch) {
      matched = true;
      if (!rule.isIncluded) {
        return false;
      }
    }
  }

  return matched || targets.every((rule) => rule.isIncluded === false);
}
