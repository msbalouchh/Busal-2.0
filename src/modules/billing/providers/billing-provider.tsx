"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

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
  businessId: string;
}

export function BillingProvider({ children, businessId }: BillingProviderProps) {
  const input = useMemo<BillingPlatformInput>(
    () => ({
      tenantId: businessId,
      workspaceId: `${businessId}-ws`,
      businessId,
    }),
    [businessId],
  );
  const [snapshot, setSnapshot] = useState(() => buildBillingPlatformSnapshot(input));
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(() => snapshot.context.planId);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/billing?businessId=${encodeURIComponent(businessId)}`);
    if (!response.ok) {
      throw new Error("Unable to load billing record");
    }

    const payload = (await response.json()) as { success: boolean; data: { record?: unknown } | unknown };
    const record = (payload.data as { record?: unknown }).record ?? payload.data;
    billingRepository.setClientRecord(record as never);
    setSnapshot(buildBillingPlatformSnapshot(input));
  }, [businessId, input]);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);

  const value = useMemo<BillingContextValue>(() => {
    const context = buildBillingPlatformContext(input);
    const plans = billingRepository.getPlans();

    return {
      context,
      record: snapshot.record,
      plans,
      featureAccess: snapshot.featureAccess,
      selectedPlanId,
      selectPlan: setSelectedPlanId,
      refresh: () => {
        void refresh();
      },
    };
  }, [input, refresh, selectedPlanId, snapshot.featureAccess, snapshot.record]);

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}
