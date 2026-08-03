"use client";

import { useContext } from "react";

import { CrmContext } from "@/modules/crm/contexts/crm-context";
import type { CrmContextValue } from "@/modules/crm/types/customer";

export function useCrmContext(): CrmContextValue {
  const context = useContext(CrmContext);

  if (!context) {
    throw new Error("useCrmContext must be used within CrmProvider");
  }

  return context;
}

export function useCrm(): CrmContextValue {
  return useCrmContext();
}
