import "server-only";

import { INVOICE_STATUSES } from "@/modules/finance/constants/finance-status";
import { assertFinanceFeatureAccess } from "@/modules/finance/feature-access/guards/feature.guard";
import { buildFinancePlatformContext } from "@/modules/finance/lib/finance-platform-context";
import { financeRepository } from "@/modules/finance/repository/finance-repository";
import type { FinancePlatformContext, FinancePlatformSnapshot } from "@/modules/finance/types/finance-platform";

export interface FinancePlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId: string;
  branchId: string;
  userId?: string;
  currentPeriodId?: string;
  baseCurrency?: string;
}

export { buildFinancePlatformContext };

export async function buildFinancePlatformSnapshot(
  context: FinancePlatformContext,
): Promise<FinancePlatformSnapshot> {
  await assertFinanceFeatureAccess(context.businessId);

  const scope = {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
    baseCurrency: context.baseCurrency,
    currentPeriodId: context.currentPeriodId,
  };

  const [record, overdue, unpaid] = await Promise.all([
    financeRepository.getRecord(scope),
    financeRepository.getOverdueInvoices(scope),
    financeRepository.getUnpaidInvoices(scope),
  ]);

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

export async function getOpenInvoices(context: FinancePlatformContext) {
  await assertFinanceFeatureAccess(context.businessId);

  const record = await financeRepository.getRecord({
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
    baseCurrency: context.baseCurrency,
    currentPeriodId: context.currentPeriodId,
  });

  return record.invoices.filter(
    (invoice) => invoice.status === INVOICE_STATUSES.SENT || invoice.status === INVOICE_STATUSES.OVERDUE,
  );
}
