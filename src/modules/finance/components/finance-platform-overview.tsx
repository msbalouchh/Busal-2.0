"use client";

import { FinanceFeatureUpgradeRequired } from "@/modules/finance/components/finance-feature-upgrade-required";
import { FinanceManagementEmpty } from "@/modules/finance/components/finance-management-empty";
import { FinanceManagementError } from "@/modules/finance/components/finance-management-error";
import { FinanceManagementLoading } from "@/modules/finance/components/finance-management-loading";
import { InvoiceStatusBadge } from "@/modules/finance/components/invoice-status-badge";
import { useFinance } from "@/modules/finance/hooks/use-finance";

export function FinancePlatformOverview() {
  const {
    record,
    revenueCents,
    expenseCents,
    netProfitCents,
    cashOnHandCents,
    invoiceCount,
    overdueInvoiceCount,
    grossMarginBps,
    refresh,
    isRefreshing,
    error,
    featureAccessDenied,
    featureAccessMessage,
  } = useFinance();

  if (featureAccessDenied) {
    return <FinanceFeatureUpgradeRequired message={featureAccessMessage ?? undefined} />;
  }

  if (isRefreshing && record.transactions.length === 0 && record.invoices.length === 0) {
    return <FinanceManagementLoading />;
  }

  if (error && record.transactions.length === 0 && record.invoices.length === 0) {
    return <FinanceManagementError message={error} onRetry={refresh} />;
  }

  if (record.transactions.length === 0 && record.invoices.length === 0) {
    return <FinanceManagementEmpty />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Revenue</p>
          <p className="text-2xl font-semibold">£{(revenueCents / 100).toFixed(0)}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Expenses</p>
          <p className="text-2xl font-semibold">£{(expenseCents / 100).toFixed(0)}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Net Profit</p>
          <p className="text-2xl font-semibold">£{(netProfitCents / 100).toFixed(0)}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Cash on Hand</p>
          <p className="text-2xl font-semibold">£{(cashOnHandCents / 100).toFixed(0)}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Invoices</p>
          <p className="text-2xl font-semibold">{invoiceCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Overdue</p>
          <p className="text-2xl font-semibold">{overdueInvoiceCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Gross Margin</p>
          <p className="text-2xl font-semibold">{(grossMarginBps / 100).toFixed(1)}%</p>
        </div>
        <div className="bg-card flex items-center rounded-xl border p-4 shadow-sm">
          <button
            type="button"
            className="text-primary text-sm font-medium"
            onClick={refresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Recent Invoices</h3>
        <ul className="space-y-3">
          {record.invoices.slice(0, 10).map((invoice) => (
            <li key={invoice.id} className="flex items-center justify-between gap-4 text-sm">
              <div>
                <p className="font-medium">{invoice.invoiceNumber}</p>
                <p className="text-muted-foreground text-xs">
                  {invoice.customerName} · £{(invoice.totalCents / 100).toFixed(2)}
                </p>
              </div>
              <InvoiceStatusBadge status={invoice.status} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
