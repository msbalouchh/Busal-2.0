"use client";

import { useMemo } from "react";

import { useBilling } from "@/modules/billing/hooks/use-billing";
import type { BillingUsageContextValue } from "@/modules/billing/types/billing-platform";

export function useBillingUsage(): BillingUsageContextValue {
  const { record, featureAccess, refresh } = useBilling();

  const limits = useMemo(() => featureAccess.limits, [featureAccess.limits]);

  const usageRecords = useMemo(() => record.usageRecords, [record.usageRecords]);

  return {
    usageRecords,
    limits,
    refresh,
  };
}
