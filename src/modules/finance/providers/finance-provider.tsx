"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { FinanceContext } from "@/modules/finance/contexts/finance-context";
import { financeRepository } from "@/modules/finance/repository/finance-repository";
import {
  buildFinancePlatformContext,
  buildFinancePlatformSnapshot,
  type FinancePlatformInput,
} from "@/modules/finance/services/finance-platform.service";
import type {
  FinanceContextValue,
  FinanceSearchQuery,
} from "@/modules/finance/types/finance-platform";

interface FinanceProviderProps {
  children: ReactNode;
  initialInput?: FinancePlatformInput;
}

export function FinanceProvider({ children, initialInput }: FinanceProviderProps) {
  const [input] = useState<FinancePlatformInput>(() => initialInput ?? {});
  const [snapshot, setSnapshot] = useState(() => buildFinancePlatformSnapshot(input));
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setSnapshot(buildFinancePlatformSnapshot(input));
  }, [input]);

  const value = useMemo<FinanceContextValue>(() => {
    const context = buildFinancePlatformContext(input);
    const selectedInvoice = selectedInvoiceId
      ? (financeRepository.findInvoiceById(selectedInvoiceId) ?? null)
      : null;

    return {
      context,
      record: snapshot.record,
      selectedInvoiceId,
      selectedInvoice,
      selectInvoice: setSelectedInvoiceId,
      searchTransactions: (query: FinanceSearchQuery) =>
        financeRepository.searchTransactions({
          ...query,
          tenantId: query.tenantId ?? context.tenantId,
          businessId: query.businessId ?? context.businessId,
          branchId: query.branchId ?? context.branchId,
        }),
      refresh,
    };
  }, [input, snapshot, selectedInvoiceId, refresh]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}
