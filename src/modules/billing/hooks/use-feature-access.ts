"use client";

import { useCallback, useMemo } from "react";

import { useBilling } from "@/modules/billing/hooks/use-billing";
import { createFeatureAccessService } from "@/modules/billing/services/feature-access.service";
import type {
  BillingAiFeatureKey,
  BillingModuleKey,
  FeatureLimitKey,
} from "@/modules/billing/constants/feature-access";
import type { FeatureAccessContextValue } from "@/modules/billing/types/billing-platform";

export function useFeatureAccess(): FeatureAccessContextValue {
  const { featureAccess, refresh } = useBilling();

  const service = useMemo(() => createFeatureAccessService(featureAccess), [featureAccess]);

  const isModuleEnabled = useCallback(
    (moduleKey: BillingModuleKey) => service.isModuleEnabled(moduleKey),
    [service],
  );

  const isAiFeatureEnabled = useCallback(
    (featureKey: BillingAiFeatureKey) => service.isAiFeatureEnabled(featureKey),
    [service],
  );

  const getLimit = useCallback(
    (limitKey: FeatureLimitKey) => service.getLimit(limitKey),
    [service],
  );

  const isWithinLimit = useCallback(
    (limitKey: FeatureLimitKey, currentUsage: number) =>
      service.isWithinLimit(limitKey, currentUsage),
    [service],
  );

  return {
    featureAccess,
    isModuleEnabled,
    isAiFeatureEnabled,
    getLimit,
    isWithinLimit,
    refresh,
  };
}
