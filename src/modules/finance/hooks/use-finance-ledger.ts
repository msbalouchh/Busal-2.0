"use client";

import { useMemo } from "react";

import { useFinanceContext } from "@/modules/finance/hooks/use-finance";
import type { FinanceLedgerContextValue } from "@/modules/finance/types/finance-platform";

export function useFinanceLedger(): FinanceLedgerContextValue {
  const { record, refresh } = useFinanceContext();

  return useMemo<FinanceLedgerContextValue>(
    () => ({
      ledgers: record.ledgers,
      journalEntries: record.journalEntries,
      chartOfAccounts: record.chartOfAccounts,
      refresh,
    }),
    [record, refresh],
  );
}
