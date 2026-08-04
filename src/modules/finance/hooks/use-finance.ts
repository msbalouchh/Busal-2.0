"use client";

import { useContext } from "react";

import { FinanceContext } from "@/modules/finance/contexts/finance-context";
import type { FinanceContextValue } from "@/modules/finance/types/finance-platform";

export function useFinanceContext(): FinanceContextValue {
  const context = useContext(FinanceContext);

  if (!context) {
    throw new Error("useFinanceContext must be used within FinanceProvider");
  }

  return context;
}

export function useFinance(): FinanceContextValue {
  return useFinanceContext();
}
