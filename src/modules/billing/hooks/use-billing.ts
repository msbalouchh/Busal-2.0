"use client";

import { useContext } from "react";

import { BillingContext } from "@/modules/billing/contexts/billing-context";
import type { BillingContextValue } from "@/modules/billing/types/billing-platform";

export function useBillingContext(): BillingContextValue {
  const context = useContext(BillingContext);

  if (!context) {
    throw new Error("useBillingContext must be used within BillingProvider");
  }

  return context;
}

export function useBilling(): BillingContextValue {
  return useBillingContext();
}
