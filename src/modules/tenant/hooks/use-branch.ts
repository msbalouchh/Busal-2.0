"use client";

import { useContext } from "react";

import { BranchContext } from "@/modules/tenant/contexts/branch-context";
import type { BranchContextValue } from "@/modules/tenant/types/context";

export function useBranchContext(): BranchContextValue {
  const context = useContext(BranchContext);

  if (!context) {
    throw new Error("useBranch must be used within TenantProvider");
  }

  return context;
}

export function useBranch(): BranchContextValue {
  return useBranchContext();
}
