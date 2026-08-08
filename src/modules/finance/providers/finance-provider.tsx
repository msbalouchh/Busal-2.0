"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { FinanceContext } from "@/modules/finance/contexts/finance-context";
import { buildFinancePlatformContext } from "@/modules/finance/lib/finance-platform-context";
import type {
  FinanceContextValue,
  FinancePlatformContext,
  FinancePlatformSnapshot,
  FinanceSearchQuery,
  FinanceTransaction,
} from "@/modules/finance/types/finance-platform";

interface FinancePlatformSnapshotExtended extends FinancePlatformSnapshot {
  accounts: FinanceContextValue["record"]["chartOfAccounts"];
}

interface FinanceProviderProps {
  children: ReactNode;
  initialInput?: FinancePlatformContext;
  initialSnapshot?: FinancePlatformSnapshotExtended;
}

export function FinanceProvider({ children, initialInput, initialSnapshot }: FinanceProviderProps) {
  const [input] = useState<FinancePlatformContext>(
    () =>
      initialInput ??
      initialSnapshot?.context ??
      buildFinancePlatformContext({ businessId: "", branchId: "" }),
  );
  const [snapshot, setSnapshot] = useState<FinancePlatformSnapshotExtended | null>(
    initialSnapshot ?? null,
  );
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featureAccessDenied, setFeatureAccessDenied] = useState(false);
  const [featureAccessMessage, setFeatureAccessMessage] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setError(null);
    setFeatureAccessDenied(false);
    setFeatureAccessMessage(null);

    void fetch("/api/finance?snapshot=true")
      .then(async (response) => {
        const payload = (await response.json()) as {
          success: boolean;
          data?: FinancePlatformSnapshotExtended;
          error?: string;
          code?: string;
        };

        if (response.status === 403 || payload.code === "PERMISSION_DENIED") {
          const message = payload.error ?? "Finance is not included in your subscription plan.";
          setFeatureAccessDenied(true);
          setFeatureAccessMessage(message);
          throw new Error(message);
        }

        if (!payload.success || !payload.data) {
          throw new Error(payload.error ?? "Failed to refresh finance data");
        }

        setSnapshot(payload.data);
      })
      .catch((refreshError: unknown) => {
        setError(refreshError instanceof Error ? refreshError.message : "Refresh failed");
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }, []);

  const value = useMemo<FinanceContextValue>(() => {
    const context = snapshot?.context ?? input;
    const record = snapshot?.record ?? {
      period: {
        id: context.currentPeriodId,
        tenantId: context.tenantId,
        businessId: context.businessId,
        name: "Current Period",
        startDate: "",
        endDate: "",
        status: "open",
        fiscalYear: new Date().getFullYear(),
        isCurrent: true,
      },
      chartOfAccounts: snapshot?.accounts ?? [],
      costCenters: [],
      budgets: [],
      ledgers: [],
      journalEntries: [],
      transactions: [],
      invoices: [],
      payments: [],
      refunds: [],
      expenses: [],
      income: [],
      taxes: [],
      cashRegisters: [],
      bankAccounts: [],
      bankReconciliations: [],
      payrollTransactions: [],
      supplierPayments: [],
      customerPayments: [],
      profitAndLoss: {
        periodId: context.currentPeriodId,
        tenantId: context.tenantId,
        businessId: context.businessId,
        revenueCents: 0,
        cogsCents: 0,
        grossProfitCents: 0,
        operatingExpensesCents: 0,
        netProfitCents: 0,
        currency: context.baseCurrency,
        generatedAt: new Date().toISOString(),
      },
      balanceSheet: {
        periodId: context.currentPeriodId,
        tenantId: context.tenantId,
        businessId: context.businessId,
        assetsCents: 0,
        liabilitiesCents: 0,
        equityCents: 0,
        currency: context.baseCurrency,
        generatedAt: new Date().toISOString(),
      },
      cashFlow: {
        periodId: context.currentPeriodId,
        tenantId: context.tenantId,
        businessId: context.businessId,
        operatingCents: 0,
        investingCents: 0,
        financingCents: 0,
        netCashChangeCents: 0,
        openingCashCents: 0,
        closingCashCents: 0,
        currency: context.baseCurrency,
        generatedAt: new Date().toISOString(),
      },
      analytics: {
        periodId: context.currentPeriodId,
        revenueCents: 0,
        expenseCents: 0,
        netProfitCents: 0,
        grossMarginBps: 0,
        netMarginBps: 0,
        accountsReceivableCents: 0,
        accountsPayableCents: 0,
        cashOnHandCents: 0,
        anomalyScore: 0,
      },
      aiContext: {
        periodId: context.currentPeriodId,
        summary: "",
        revenueForecastCents: 0,
        cashFlowForecastCents: 0,
        anomalyRiskScore: 0,
        costSavingOpportunitiesCents: 0,
        insights: [],
        recommendedActions: [],
        lastGeneratedAt: new Date().toISOString(),
      },
    };

    const selectedInvoice = selectedInvoiceId
      ? (record.invoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null)
      : null;

    return {
      context,
      record,
      revenueCents: snapshot?.revenueCents ?? record.analytics.revenueCents,
      expenseCents: snapshot?.expenseCents ?? record.analytics.expenseCents,
      netProfitCents: snapshot?.netProfitCents ?? record.analytics.netProfitCents,
      accountsReceivableCents:
        snapshot?.accountsReceivableCents ?? record.analytics.accountsReceivableCents,
      accountsPayableCents:
        snapshot?.accountsPayableCents ?? record.analytics.accountsPayableCents,
      cashOnHandCents: snapshot?.cashOnHandCents ?? record.analytics.cashOnHandCents,
      invoiceCount: snapshot?.invoiceCount ?? record.invoices.length,
      overdueInvoiceCount: snapshot?.overdueInvoiceCount ?? 0,
      unpaidInvoiceCount: snapshot?.unpaidInvoiceCount ?? 0,
      grossMarginBps: snapshot?.grossMarginBps ?? record.analytics.grossMarginBps,
      selectedInvoiceId,
      selectedInvoice,
      selectInvoice: setSelectedInvoiceId,
      searchTransactions: (query: FinanceSearchQuery) =>
        filterTransactions(record.transactions, query, context),
      refresh,
      isRefreshing,
      error,
      featureAccessDenied,
      featureAccessMessage,
    };
  }, [input, snapshot, selectedInvoiceId, refresh, isRefreshing, error, featureAccessDenied, featureAccessMessage]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

function filterTransactions(
  transactions: FinanceTransaction[],
  query: FinanceSearchQuery,
  context: FinancePlatformContext,
): FinanceTransaction[] {
  let results = [...transactions];

  if (query.tenantId ?? context.tenantId) {
    results = results.filter((txn) => txn.tenantId === (query.tenantId ?? context.tenantId));
  }
  if (query.businessId ?? context.businessId) {
    results = results.filter((txn) => txn.businessId === (query.businessId ?? context.businessId));
  }
  if (query.branchId ?? context.branchId) {
    results = results.filter((txn) => txn.branchId === (query.branchId ?? context.branchId));
  }
  if (query.transactionType) {
    results = results.filter((txn) => txn.transactionType === query.transactionType);
  }
  if (query.fromDate) {
    results = results.filter((txn) => txn.occurredAt >= query.fromDate!);
  }
  if (query.toDate) {
    results = results.filter((txn) => txn.occurredAt <= query.toDate!);
  }
  if (query.query) {
    const term = query.query.toLowerCase();
    results = results.filter((txn) => txn.description.toLowerCase().includes(term));
  }
  if (query.limit) {
    results = results.slice(0, query.limit);
  }

  return results;
}
