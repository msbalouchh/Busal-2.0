import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { INVOICE_STATUSES, JOURNAL_ENTRY_STATUSES } from "@/modules/finance/constants/finance-status";
import type { FinanceTenantScope } from "@/modules/finance/lib/finance-scope";
import {
  buildFinanceRecord,
  createAccountRecord,
  createBudgetRecord,
  createCostCenterRecord,
  createExpenseRecord,
  createInvoiceRecord,
  createJournalEntryRecord,
  createPaymentRecord,
  defaultBranchFinanceMeta,
  type StoredFinanceBranchMeta,
} from "@/modules/finance/lib/finance-mappers";
import type {
  ChartOfAccount,
  FinanceRecord,
  FinanceSearchQuery,
  Invoice,
  JournalEntry,
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

const DEFAULT_PAGE_SIZE = 25;

export interface FinanceSearchResult {
  transactions: FinanceRecord["transactions"];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Prisma-backed finance repository with tenant scoping. */
export class FinanceRepository {
  private async loadBranchMeta(scope: FinanceTenantScope): Promise<StoredFinanceBranchMeta> {
    const settings = await prisma.branchSettings.findUnique({
      where: { branchId: scope.branchId },
      select: { settings: true },
    });

    const raw = settings?.settings;
    if (raw && typeof raw === "object" && raw !== null && "financeOperations" in raw) {
      return (raw as unknown as { financeOperations: StoredFinanceBranchMeta }).financeOperations;
    }

    return defaultBranchFinanceMeta(scope);
  }

  private async saveBranchMeta(scope: FinanceTenantScope, meta: StoredFinanceBranchMeta): Promise<void> {
    const existing = await prisma.branchSettings.findUnique({
      where: { branchId: scope.branchId },
      select: { settings: true },
    });

    const settingsObject =
      existing?.settings && typeof existing.settings === "object" && existing.settings !== null
        ? (existing.settings as Record<string, unknown>)
        : {};

    await prisma.branchSettings.upsert({
      where: { branchId: scope.branchId },
      create: {
        branchId: scope.branchId,
        settings: { ...settingsObject, financeOperations: meta } as unknown as Prisma.InputJsonValue,
      },
      update: {
        settings: { ...settingsObject, financeOperations: meta } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private async loadPosPayments(scope: FinanceTenantScope) {
    return prisma.orderPayment.findMany({
      where: {
        businessId: scope.businessId,
        branchId: scope.branchId,
        status: "PAID",
      },
      orderBy: { paidAt: "desc" },
      take: 500,
    });
  }

  async getRecord(scope: FinanceTenantScope): Promise<FinanceRecord> {
    const [meta, posPayments] = await Promise.all([
      this.loadBranchMeta(scope),
      this.loadPosPayments(scope),
    ]);
    return buildFinanceRecord(scope, meta, posPayments);
  }

  async searchTransactions(
    scope: FinanceTenantScope,
    query: FinanceSearchQuery | FinanceSearchSchemaInput,
  ): Promise<FinanceSearchResult> {
    const record = await this.getRecord(scope);
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

    const sortBy = "sortBy" in query ? query.sortBy : undefined;
    const sortDirection = "sortDirection" in query ? query.sortDirection : "desc";
    results.sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      if (sortBy === "amount") {
        return (a.amountCents - b.amountCents) * direction;
      }
      if (sortBy === "description") {
        return a.description.localeCompare(b.description) * direction;
      }
      return a.occurredAt.localeCompare(b.occurredAt) * direction;
    });

    const page = "page" in query && query.page ? query.page : 1;
    const pageSize =
      "pageSize" in query && query.pageSize
        ? query.pageSize
        : "limit" in query && query.limit
          ? query.limit
          : DEFAULT_PAGE_SIZE;
    const total = results.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const offset = (page - 1) * pageSize;

    return {
      transactions: results.slice(offset, offset + pageSize),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async findInvoiceById(scope: FinanceTenantScope, invoiceId: string): Promise<Invoice | null> {
    const record = await this.getRecord(scope);
    return record.invoices.find((invoice) => invoice.id === invoiceId) ?? null;
  }

  async listAccounts(scope: FinanceTenantScope): Promise<ChartOfAccount[]> {
    const record = await this.getRecord(scope);
    return record.chartOfAccounts.filter((account) => account.isActive);
  }

  async createAccount(
    scope: FinanceTenantScope,
    input: CreateFinanceAccountSchemaInput,
  ): Promise<ChartOfAccount> {
    const meta = await this.loadBranchMeta(scope);
    const account = createAccountRecord(scope, input);
    meta.chartOfAccounts = [...(meta.chartOfAccounts ?? []), account];
    await this.saveBranchMeta(scope, meta);
    return account;
  }

  async updateAccount(
    scope: FinanceTenantScope,
    input: UpdateFinanceAccountSchemaInput,
  ): Promise<ChartOfAccount | null> {
    const meta = await this.loadBranchMeta(scope);
    const accounts = meta.chartOfAccounts ?? [];
    const index = accounts.findIndex((account) => account.id === input.accountId);
    if (index < 0) {
      return null;
    }

    const current = accounts[index];
    if (!current) {
      return null;
    }

    const updated: ChartOfAccount = {
      ...current,
      code: input.code ?? current.code,
      name: input.name ?? current.name,
      accountType: input.accountType ?? current.accountType,
      parentAccountId: input.parentAccountId ?? current.parentAccountId,
      currency: input.currency ?? current.currency,
      updatedAt: new Date().toISOString(),
    };
    accounts[index] = updated;
    meta.chartOfAccounts = accounts;
    await this.saveBranchMeta(scope, meta);
    return updated;
  }

  async createJournalEntry(
    scope: FinanceTenantScope,
    input: CreateJournalEntrySchemaInput,
  ): Promise<JournalEntry> {
    const meta = await this.loadBranchMeta(scope);
    const chartOfAccounts = meta.chartOfAccounts ?? defaultBranchFinanceMeta(scope).chartOfAccounts!;
    const entry = createJournalEntryRecord(scope, input, chartOfAccounts);
    meta.journalEntries = [...(meta.journalEntries ?? []), entry];
    await this.saveBranchMeta(scope, meta);
    return entry;
  }

  async updateJournalEntry(
    scope: FinanceTenantScope,
    input: UpdateJournalEntrySchemaInput,
  ): Promise<JournalEntry | null> {
    const meta = await this.loadBranchMeta(scope);
    const entries = meta.journalEntries ?? [];
    const index = entries.findIndex((entry) => entry.id === input.journalEntryId);
    if (index < 0) {
      return null;
    }

    const current = entries[index];
    if (!current) {
      return null;
    }

    if (current.status === JOURNAL_ENTRY_STATUSES.POSTED) {
      return null;
    }

    const chartOfAccounts = meta.chartOfAccounts ?? defaultBranchFinanceMeta(scope).chartOfAccounts!;
    const updated = createJournalEntryRecord(
      scope,
      {
        description: input.description ?? current.description,
        referenceType: input.referenceType ?? current.referenceType,
        referenceId: input.referenceId ?? current.referenceId,
        periodId: input.periodId ?? current.periodId,
        lines:
          input.lines ??
          current.lines.map((line) => ({
            accountId: line.accountId,
            description: line.description,
            debitCents: line.debitCents,
            creditCents: line.creditCents,
          })),
      },
      chartOfAccounts,
    );
    updated.id = current.id;
    updated.entryNumber = current.entryNumber;
    updated.status = JOURNAL_ENTRY_STATUSES.DRAFT;
    updated.postedAt = null;
    entries[index] = updated;
    meta.journalEntries = entries;
    await this.saveBranchMeta(scope, meta);
    return updated;
  }

  async deleteJournalEntry(scope: FinanceTenantScope, journalEntryId: string): Promise<boolean> {
    const meta = await this.loadBranchMeta(scope);
    const entries = meta.journalEntries ?? [];
    const index = entries.findIndex((entry) => entry.id === journalEntryId);
    if (index < 0) {
      return false;
    }
    const entry = entries[index];
    if (!entry) {
      return false;
    }
    entries[index] = { ...entry, status: JOURNAL_ENTRY_STATUSES.VOID };
    meta.journalEntries = entries;
    await this.saveBranchMeta(scope, meta);
    return true;
  }

  async restoreJournalEntry(scope: FinanceTenantScope, journalEntryId: string): Promise<boolean> {
    const meta = await this.loadBranchMeta(scope);
    const entries = meta.journalEntries ?? [];
    const index = entries.findIndex((entry) => entry.id === journalEntryId);
    if (index < 0) {
      return false;
    }
    const entry = entries[index];
    if (!entry) {
      return false;
    }
    entries[index] = { ...entry, status: JOURNAL_ENTRY_STATUSES.DRAFT };
    meta.journalEntries = entries;
    await this.saveBranchMeta(scope, meta);
    return true;
  }

  async createInvoice(scope: FinanceTenantScope, input: CreateFinanceInvoiceSchemaInput): Promise<Invoice> {
    const meta = await this.loadBranchMeta(scope);
    const invoice = createInvoiceRecord(scope, input);
    meta.invoices = [...(meta.invoices ?? []), invoice];
    await this.saveBranchMeta(scope, meta);
    return invoice;
  }

  async recordExpense(
    scope: FinanceTenantScope,
    input: RecordFinanceExpenseSchemaInput,
  ): Promise<FinanceRecord> {
    const meta = await this.loadBranchMeta(scope);
    const expense = createExpenseRecord(scope, input);
    meta.expenses = [...(meta.expenses ?? []), expense];

    if (input.costCenterId && meta.budgets) {
      meta.budgets = meta.budgets.map((budget) =>
        budget.costCenterId === input.costCenterId
          ? { ...budget, spentCents: budget.spentCents + expense.totalCents }
          : budget,
      );
    }

    await this.saveBranchMeta(scope, meta);
    return this.getRecord(scope);
  }

  async recordPayment(
    scope: FinanceTenantScope,
    input: RecordFinancePaymentSchemaInput,
  ): Promise<FinanceRecord> {
    const meta = await this.loadBranchMeta(scope);
    const payment = createPaymentRecord(scope, input);
    meta.payments = [...(meta.payments ?? []), payment];

    if (input.invoiceId) {
      meta.invoices = (meta.invoices ?? []).map((invoice) => {
        if (invoice.id !== input.invoiceId) {
          return invoice;
        }
        const amountPaidCents = invoice.amountPaidCents + input.amountCents;
        const amountDueCents = Math.max(0, invoice.totalCents - amountPaidCents);
        return {
          ...invoice,
          amountPaidCents,
          amountDueCents,
          status:
            amountDueCents === 0 ? INVOICE_STATUSES.PAID : INVOICE_STATUSES.PARTIALLY_PAID,
          updatedAt: new Date().toISOString(),
        };
      });
    }

    await this.saveBranchMeta(scope, meta);
    return this.getRecord(scope);
  }

  async createCostCenter(scope: FinanceTenantScope, input: CreateCostCenterSchemaInput) {
    const meta = await this.loadBranchMeta(scope);
    const costCenter = createCostCenterRecord(scope, input);
    meta.costCenters = [...(meta.costCenters ?? []), costCenter];
    await this.saveBranchMeta(scope, meta);
    return costCenter;
  }

  async createBudget(scope: FinanceTenantScope, input: CreateBudgetSchemaInput) {
    const meta = await this.loadBranchMeta(scope);
    const budget = createBudgetRecord(scope, input);
    meta.budgets = [...(meta.budgets ?? []), budget];
    await this.saveBranchMeta(scope, meta);
    return budget;
  }

  async createTaxRecord(scope: FinanceTenantScope, input: CreateFinanceTaxSchemaInput) {
    const meta = await this.loadBranchMeta(scope);
    const tax = {
      id: `tax-${Date.now()}`,
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      taxType: input.taxType,
      name: input.name,
      rateBps: input.rateBps,
      taxableAmountCents: input.taxableAmountCents,
      taxAmountCents: Math.round((input.taxableAmountCents * input.rateBps) / 10000),
      periodId: scope.currentPeriodId,
      jurisdiction: input.jurisdiction,
      isPaid: false,
      dueDate: input.dueDate ?? null,
    };
    meta.taxes = [...(meta.taxes ?? []), tax];
    await this.saveBranchMeta(scope, meta);
    return tax;
  }

  async bulkAction(scope: FinanceTenantScope, input: FinanceBulkActionSchemaInput): Promise<number> {
    const meta = await this.loadBranchMeta(scope);
    let affected = 0;

    if (input.entityType === "journal_entry") {
      meta.journalEntries = (meta.journalEntries ?? []).map((entry) => {
        if (!input.entityIds.includes(entry.id)) {
          return entry;
        }
        affected += 1;
        if (input.action === "delete" || input.action === "void") {
          return { ...entry, status: JOURNAL_ENTRY_STATUSES.VOID };
        }
        if (input.action === "restore") {
          return { ...entry, status: JOURNAL_ENTRY_STATUSES.DRAFT };
        }
        return entry;
      });
    }

    if (input.entityType === "invoice") {
      meta.invoices = (meta.invoices ?? []).map((invoice) => {
        if (!input.entityIds.includes(invoice.id)) {
          return invoice;
        }
        affected += 1;
        if (input.action === "void" || input.action === "delete") {
          return { ...invoice, status: INVOICE_STATUSES.VOID, updatedAt: new Date().toISOString() };
        }
        return invoice;
      });
    }

    if (input.entityType === "account") {
      meta.chartOfAccounts = (meta.chartOfAccounts ?? []).map((account) => {
        if (!input.entityIds.includes(account.id) || account.isSystemAccount) {
          return account;
        }
        affected += 1;
        return {
          ...account,
          isActive: input.action === "restore",
          updatedAt: new Date().toISOString(),
        };
      });
    }

    await this.saveBranchMeta(scope, meta);
    return affected;
  }

  async getOverdueInvoices(scope: FinanceTenantScope): Promise<Invoice[]> {
    const record = await this.getRecord(scope);
    const today = new Date().toISOString().slice(0, 10);
    return record.invoices.filter(
      (invoice) =>
        invoice.status !== INVOICE_STATUSES.PAID &&
        invoice.status !== INVOICE_STATUSES.VOID &&
        invoice.dueDate < today,
    );
  }

  async getUnpaidInvoices(scope: FinanceTenantScope): Promise<Invoice[]> {
    const record = await this.getRecord(scope);
    return record.invoices.filter(
      (invoice) => invoice.amountDueCents > 0 && invoice.status !== INVOICE_STATUSES.VOID,
    );
  }
}

export const financeRepository = new FinanceRepository();
