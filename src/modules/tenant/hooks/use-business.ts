"use client";

import { useContext } from "react";

import { BusinessContext } from "@/modules/tenant/contexts/business-context";
import type { BusinessContextValue } from "@/modules/tenant/types/context";

export function useBusinessContext(): BusinessContextValue {
  const context = useContext(BusinessContext);

  if (!context) {
    throw new Error("useBusiness must be used within TenantProvider");
  }

  return context;
}

export function useBusiness(): BusinessContextValue {
  return useBusinessContext();
}
