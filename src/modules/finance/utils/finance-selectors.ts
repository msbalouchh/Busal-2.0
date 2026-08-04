import type { AccountType, InvoiceStatus } from "@/modules/finance/constants/finance-status";
import type { FinanceRecord, Invoice } from "@/modules/finance/types/finance-platform";

export function formatMoney(cents: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(cents / 100);
}

export function getFinanceSummary(record: FinanceRecord): string {
  return `${record.period.name} — Revenue ${formatMoney(record.analytics.revenueCents)}, Net ${formatMoney(record.analytics.netProfitCents)}`;
}

export function getInvoiceLabel(invoice: Invoice): string {
  return `${invoice.invoiceNumber} — ${invoice.customerName}`;
}

export function isInvoicePaid(invoice: Invoice): boolean {
  return invoice.status === "paid" || invoice.amountDueCents === 0;
}

export function isInvoiceOverdue(invoice: Invoice, today = "2026-02-15"): boolean {
  return invoice.amountDueCents > 0 && invoice.dueDate < today;
}

export function getInvoiceStatusSeverity(status: InvoiceStatus): "ok" | "warning" | "critical" {
  switch (status) {
    case "overdue":
    case "void":
      return "critical";
    case "sent":
    case "partially_paid":
    case "draft":
      return "warning";
    default:
      return "ok";
  }
}

export function getGrossMarginPercent(record: FinanceRecord): number {
  return record.analytics.grossMarginBps / 100;
}

export function getNetMarginPercent(record: FinanceRecord): number {
  return record.analytics.netMarginBps / 100;
}

export function getTotalExpenses(record: FinanceRecord): number {
  return record.expenses.reduce((sum, exp) => sum + exp.totalCents, 0);
}

export function getTotalIncome(record: FinanceRecord): number {
  return record.income.reduce((sum, inc) => sum + inc.totalCents, 0);
}

export function getAccountsByType(
  record: FinanceRecord,
  accountType: AccountType,
): FinanceRecord["chartOfAccounts"] {
  return record.chartOfAccounts.filter((acct) => acct.accountType === accountType);
}

export function getOutstandingReceivables(record: FinanceRecord): number {
  return record.invoices.reduce((sum, inv) => sum + inv.amountDueCents, 0);
}

export function getOutstandingPayables(record: FinanceRecord): number {
  return record.supplierPayments.length > 0 ? record.analytics.accountsPayableCents : 0;
}
