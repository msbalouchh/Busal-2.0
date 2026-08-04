import { INVOICE_STATUSES } from "@/modules/finance/constants/finance-status";
import { DEFAULT_FINANCE_SCOPE } from "@/modules/finance/constants/mock-data";
import { financeRepository } from "@/modules/finance/repository/finance-repository";
import type {
  FinancePlatformContext,
  FinanceRecord,
} from "@/modules/finance/types/finance-platform";

export interface FinancePlatformSnapshot {
  context: FinancePlatformContext;
  record: FinanceRecord;
  revenueCents: number;
  expenseCents: number;
  netProfitCents: number;
  accountsReceivableCents: number;
  accountsPayableCents: number;
  cashOnHandCents: number;
  invoiceCount: number;
  overdueInvoiceCount: number;
  unpaidInvoiceCount: number;
  grossMarginBps: number;
}

export interface FinancePlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId?: string;
  branchId?: string;
  userId?: string;
  currentPeriodId?: string;
  baseCurrency?: string;
}

export function buildFinancePlatformContext(
  input: FinancePlatformInput = {},
): FinancePlatformContext {
  return {
    tenantId: input.tenantId ?? DEFAULT_FINANCE_SCOPE.tenantId,
    workspaceId: input.workspaceId ?? DEFAULT_FINANCE_SCOPE.workspaceId,
    businessId: input.businessId ?? DEFAULT_FINANCE_SCOPE.businessId,
    branchId: input.branchId ?? DEFAULT_FINANCE_SCOPE.branchId,
    userId: input.userId ?? DEFAULT_FINANCE_SCOPE.userId,
    currentPeriodId: input.currentPeriodId ?? DEFAULT_FINANCE_SCOPE.currentPeriodId,
    baseCurrency: input.baseCurrency ?? DEFAULT_FINANCE_SCOPE.baseCurrency,
  };
}

export function buildFinancePlatformSnapshot(
  input: FinancePlatformInput = {},
): FinancePlatformSnapshot {
  const context = buildFinancePlatformContext(input);
  const record = financeRepository.getRecord();
  const overdue = financeRepository.getOverdueInvoices();
  const unpaid = financeRepository.getUnpaidInvoices();

  return {
    context,
    record,
    revenueCents: record.analytics.revenueCents,
    expenseCents: record.analytics.expenseCents,
    netProfitCents: record.analytics.netProfitCents,
    accountsReceivableCents: record.analytics.accountsReceivableCents,
    accountsPayableCents: record.analytics.accountsPayableCents,
    cashOnHandCents: record.analytics.cashOnHandCents,
    invoiceCount: record.invoices.length,
    overdueInvoiceCount: overdue.length,
    unpaidInvoiceCount: unpaid.length,
    grossMarginBps: record.analytics.grossMarginBps,
  };
}

export function getDefaultFinanceSnapshot(): FinancePlatformSnapshot {
  return buildFinancePlatformSnapshot();
}

export function getOpenInvoices(): FinanceRecord["invoices"] {
  return financeRepository
    .getRecord()
    .invoices.filter(
      (inv) => inv.status === INVOICE_STATUSES.SENT || inv.status === INVOICE_STATUSES.OVERDUE,
    );
}
