"use client";

import { useMemo } from "react";

import { useFinanceContext } from "@/modules/finance/hooks/use-finance";
import type { FinanceReportsContextValue } from "@/modules/finance/types/finance-platform";

export function useFinanceReports(): FinanceReportsContextValue {
  const { record, refresh } = useFinanceContext();

  return useMemo<FinanceReportsContextValue>(
    () => ({
      profitAndLoss: record.profitAndLoss,
      balanceSheet: record.balanceSheet,
      cashFlow: record.cashFlow,
      refresh,
    }),
    [record, refresh],
  );
}
