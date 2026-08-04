"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { BillingContext } from "@/modules/billing/contexts/billing-context";
import { billingRepository } from "@/modules/billing/repository/billing-repository";
import {
  buildBillingPlatformContext,
  buildBillingPlatformSnapshot,
  type BillingPlatformInput,
} from "@/modules/billing/services/billing-platform.service";
import type { BillingContextValue } from "@/modules/billing/types/billing-platform";

interface BillingProviderProps {
  children: ReactNode;
  initialInput?: BillingPlatformInput;
}

export function BillingProvider({ children, initialInput }: BillingProviderProps) {
  const [input] = useState<BillingPlatformInput>(() => initialInput ?? {});
  const [snapshot, setSnapshot] = useState(() => buildBillingPlatformSnapshot(input));
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    () => snapshot.context.planId,
  );

  const refresh = useCallback(() => {
    setSnapshot(buildBillingPlatformSnapshot(input));
  }, [input]);

  const value = useMemo<BillingContextValue>(() => {
    const context = buildBillingPlatformContext(input);
    const plans = billingRepository.getPlans();
    const featureAccess = snapshot.featureAccess;

    return {
      context,
      record: snapshot.record,
      plans,
      featureAccess,
      selectedPlanId,
      selectPlan: setSelectedPlanId,
      refresh,
    };
  }, [input, snapshot, selectedPlanId, refresh]);

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}
