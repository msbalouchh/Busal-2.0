import { financeRepository, type FinanceSearchResult } from "@/modules/finance/repository/finance-repository";
import { DOMAIN_EVENT_TYPES } from "@/modules/platform-orchestration/constants/domain-events";
import {
  moduleScopeFromPlatform,
  publishModuleDomainEvent,
} from "@/modules/platform-orchestration/lib/publish-module-event";
import { assertFinanceFeatureAccess } from "@/modules/finance/feature-access/guards/feature.guard";
import {
  resolveFinanceScope,
  toFinancePlatformContext,
  type FinanceTenantScope,
} from "@/modules/finance/lib/finance-scope";
import type {
  CreateInvoiceInput,
  FinancePlatformContext,
  FinanceRecord,
  FinanceSearchQuery,
  FinanceTransaction,
  Invoice,
  RecordExpenseInput,
  RecordPaymentInput,
} from "@/modules/finance/types/finance-platform";
import type {
  CreateBudgetSchemaInput,
  CreateCostCenterSchemaInput,
  CreateFinanceAccountSchemaInput,
  CreateFinanceInvoiceSchemaInput,
  CreateFinanceTaxSchemaInput,
  CreateJournalEntrySchemaInput,
  FinanceBulkActionSchemaInput,
  FinanceSearchSchemaInput,
  RecordFinanceExpenseSchemaInput,
  RecordFinancePaymentSchemaInput,
  UpdateFinanceAccountSchemaInput,
  UpdateJournalEntrySchemaInput,
} from "@/modules/finance/validation/finance-schemas";

function resolveScope(context: FinancePlatformContext): FinanceTenantScope {
  return {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
    baseCurrency: context.baseCurrency,
    currentPeriodId: context.currentPeriodId,
  };
}

/** Domain service for finance operations. */
export class FinanceService {
  private async assertAccess(context: FinancePlatformContext): Promise<void> {
    await assertFinanceFeatureAccess(context.businessId);
  }

  async getRecord(context: FinancePlatformContext): Promise<FinanceRecord> {
    await this.assertAccess(context);
    return financeRepository.getRecord(resolveScope(context));
  }

  async searchTransactions(
    query: FinanceSearchQuery | FinanceSearchSchemaInput,
    context: FinancePlatformContext,
  ): Promise<FinanceSearchResult> {
    await this.assertAccess(context);
    return financeRepository.searchTransactions(resolveScope(context), query);
  }

  async getInvoiceById(context: FinancePlatformContext, invoiceId: string): Promise<Invoice | null> {
    await this.assertAccess(context);
    return financeRepository.findInvoiceById(resolveScope(context), invoiceId);
  }

  async listAccounts(context: FinancePlatformContext) {
    await this.assertAccess(context);
    return financeRepository.listAccounts(resolveScope(context));
  }

  async createAccount(context: FinancePlatformContext, input: CreateFinanceAccountSchemaInput) {
    await this.assertAccess(context);
    return financeRepository.createAccount(resolveScope(context), input);
  }

  async updateAccount(context: FinancePlatformContext, input: UpdateFinanceAccountSchemaInput) {
    await this.assertAccess(context);
    return financeRepository.updateAccount(resolveScope(context), input);
  }

  async createJournalEntry(context: FinancePlatformContext, input: CreateJournalEntrySchemaInput) {
    await this.assertAccess(context);
    const entry = await financeRepository.createJournalEntry(resolveScope(context), input);
    await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
      eventType: DOMAIN_EVENT_TYPES.FINANCE_JOURNAL_CREATED,
      aggregateId: entry.id,
      payload: { journalEntryId: entry.id, description: entry.description },
    });
    return entry;
  }

  async updateJournalEntry(context: FinancePlatformContext, input: UpdateJournalEntrySchemaInput) {
    await this.assertAccess(context);
    return financeRepository.updateJournalEntry(resolveScope(context), input);
  }

  async deleteJournalEntry(context: FinancePlatformContext, journalEntryId: string) {
    await this.assertAccess(context);
    return financeRepository.deleteJournalEntry(resolveScope(context), journalEntryId);
  }

  async restoreJournalEntry(context: FinancePlatformContext, journalEntryId: string) {
    await this.assertAccess(context);
    return financeRepository.restoreJournalEntry(resolveScope(context), journalEntryId);
  }

  async createInvoice(
    context: FinancePlatformContext,
    input: CreateInvoiceInput | CreateFinanceInvoiceSchemaInput,
  ): Promise<Invoice> {
    await this.assertAccess(context);
    return financeRepository.createInvoice(resolveScope(context), {
      ...input,
      branchId: input.branchId ?? context.branchId,
    });
  }

  async recordExpense(
    context: FinancePlatformContext,
    input: RecordExpenseInput | RecordFinanceExpenseSchemaInput,
  ): Promise<FinanceRecord> {
    await this.assertAccess(context);
    return financeRepository.recordExpense(resolveScope(context), {
      ...input,
      branchId: input.branchId ?? context.branchId,
    });
  }

  async recordPayment(
    context: FinancePlatformContext,
    input: RecordPaymentInput | RecordFinancePaymentSchemaInput,
  ): Promise<FinanceRecord> {
    await this.assertAccess(context);
    const paymentInput: RecordFinancePaymentSchemaInput = {
      branchId: input.branchId ?? context.branchId,
      amountCents: input.amountCents,
      paymentMethod: input.paymentMethod,
      invoiceId: input.invoiceId,
      reference: input.reference,
    };

    const record = await financeRepository.recordPayment(resolveScope(context), paymentInput);
    await publishModuleDomainEvent(moduleScopeFromPlatform(context), {
      eventType: DOMAIN_EVENT_TYPES.PAYMENT_COMPLETED,
      aggregateId: paymentInput.invoiceId ?? paymentInput.reference ?? `finance-payment-${Date.now()}`,
      payload: {
        amountCents: paymentInput.amountCents,
        invoiceId: paymentInput.invoiceId ?? null,
        paymentMethod: paymentInput.paymentMethod,
      },
      idempotencyKey: `payment.completed:finance:${paymentInput.invoiceId ?? paymentInput.reference}`,
    });
    return record;
  }

  async createCostCenter(context: FinancePlatformContext, input: CreateCostCenterSchemaInput) {
    await this.assertAccess(context);
    return financeRepository.createCostCenter(resolveScope(context), input);
  }

  async createBudget(context: FinancePlatformContext, input: CreateBudgetSchemaInput) {
    await this.assertAccess(context);
    return financeRepository.createBudget(resolveScope(context), input);
  }

  async createTaxRecord(context: FinancePlatformContext, input: CreateFinanceTaxSchemaInput) {
    await this.assertAccess(context);
    return financeRepository.createTaxRecord(resolveScope(context), input);
  }

  async bulkAction(context: FinancePlatformContext, input: FinanceBulkActionSchemaInput) {
    await this.assertAccess(context);
    return financeRepository.bulkAction(resolveScope(context), input);
  }

  async getOverdueInvoices(context: FinancePlatformContext): Promise<Invoice[]> {
    await this.assertAccess(context);
    return financeRepository.getOverdueInvoices(resolveScope(context));
  }

  async getUnpaidInvoices(context: FinancePlatformContext): Promise<Invoice[]> {
    await this.assertAccess(context);
    return financeRepository.getUnpaidInvoices(resolveScope(context));
  }

  searchInvoices(query: FinanceSearchQuery, record: FinanceRecord): Invoice[] {
    let results = [...record.invoices];

    if (query.invoiceStatus) {
      results = results.filter((invoice) => invoice.status === query.invoiceStatus);
    }
    if (query.query) {
      const term = query.query.toLowerCase();
      results = results.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(term) ||
          invoice.customerName.toLowerCase().includes(term),
      );
    }
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  searchTransactionsLocal(query: FinanceSearchQuery, record: FinanceRecord): FinanceTransaction[] {
    let results = [...record.transactions];

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
}

export const financeService = new FinanceService();

export { resolveFinanceScope, toFinancePlatformContext };
