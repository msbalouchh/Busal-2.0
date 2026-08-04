import {
  FINANCE_TRANSACTION_TYPES,
  INVOICE_STATUSES,
} from "@/modules/finance/constants/finance-status";
import { DEFAULT_FINANCE_SCOPE, MOCK_FINANCE_RECORD } from "@/modules/finance/constants/mock-data";
import type {
  CreateInvoiceInput,
  FinanceRecord,
  FinanceSearchQuery,
  FinanceTransaction,
  Invoice,
  RecordExpenseInput,
  RecordPaymentInput,
} from "@/modules/finance/types/finance-platform";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateInvoiceNumber(): string {
  return `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

/** In-memory finance repository (mock only, no backend). */
export class FinanceRepository {
  private record: FinanceRecord = structuredClone(MOCK_FINANCE_RECORD);

  getRecord(): FinanceRecord {
    return structuredClone(this.record);
  }

  findInvoiceById(invoiceId: string): Invoice | undefined {
    return this.record.invoices.find((inv) => inv.id === invoiceId);
  }

  searchTransactions(query: FinanceSearchQuery = {}): FinanceTransaction[] {
    let results = structuredClone(this.record.transactions);

    if (query.tenantId) {
      results = results.filter((t) => t.tenantId === query.tenantId);
    }

    if (query.businessId) {
      results = results.filter((t) => t.businessId === query.businessId);
    }

    if (query.branchId) {
      results = results.filter((t) => t.branchId === query.branchId);
    }

    if (query.transactionType) {
      results = results.filter((t) => t.transactionType === query.transactionType);
    }

    if (query.fromDate) {
      results = results.filter((t) => t.occurredAt >= query.fromDate!);
    }

    if (query.toDate) {
      results = results.filter((t) => t.occurredAt <= query.toDate!);
    }

    if (query.query) {
      const term = query.query.toLowerCase();
      results = results.filter((t) => t.description.toLowerCase().includes(term));
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  searchInvoices(query: FinanceSearchQuery = {}): Invoice[] {
    let results = structuredClone(this.record.invoices);

    if (query.invoiceStatus) {
      results = results.filter((inv) => inv.status === query.invoiceStatus);
    }

    if (query.query) {
      const term = query.query.toLowerCase();
      results = results.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(term) ||
          inv.customerName.toLowerCase().includes(term),
      );
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  createInvoice(input: CreateInvoiceInput): Invoice {
    const now = new Date().toISOString();
    const invoiceId = createId("inv");
    const invoiceNumber = generateInvoiceNumber();

    const lineItems = input.lineItems.map((item) => {
      const total = item.quantity * item.unitPriceCents;
      const tax = Math.round(total * 0.2);
      return {
        id: createId("inv-line"),
        invoiceId,
        description: item.description,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        taxCents: tax,
        totalCents: total + tax,
      };
    });

    const subtotalCents = input.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceCents,
      0,
    );
    const taxCents = Math.round(subtotalCents * 0.2);
    const totalCents = subtotalCents + taxCents;

    const invoice: Invoice = {
      id: invoiceId,
      tenantId: DEFAULT_FINANCE_SCOPE.tenantId,
      businessId: DEFAULT_FINANCE_SCOPE.businessId,
      branchId: input.branchId,
      invoiceNumber,
      status: INVOICE_STATUSES.DRAFT,
      customerId: input.customerId ?? null,
      customerName: input.customerName,
      issueDate: now.slice(0, 10),
      dueDate: input.dueDate,
      subtotalCents,
      taxCents,
      discountCents: 0,
      totalCents,
      amountPaidCents: 0,
      amountDueCents: totalCents,
      currency: DEFAULT_FINANCE_SCOPE.baseCurrency,
      lineItems,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.record.invoices.push(invoice);
    return structuredClone(invoice);
  }

  recordExpense(input: RecordExpenseInput): FinanceRecord {
    const now = new Date().toISOString();
    const expenseId = createId("exp");
    const taxCents = Math.round(input.amountCents * 0.2);

    this.record.expenses.push({
      id: expenseId,
      tenantId: DEFAULT_FINANCE_SCOPE.tenantId,
      businessId: DEFAULT_FINANCE_SCOPE.businessId,
      branchId: input.branchId,
      category: input.category,
      vendorName: input.vendorName,
      description: input.description,
      amountCents: input.amountCents,
      taxCents,
      totalCents: input.amountCents + taxCents,
      currency: DEFAULT_FINANCE_SCOPE.baseCurrency,
      expenseDate: input.expenseDate,
      accountId: input.accountId,
      receiptUrl: null,
      approvedByUserId: DEFAULT_FINANCE_SCOPE.userId,
      createdAt: now,
    });

    this.record.transactions.push({
      id: createId("txn"),
      tenantId: DEFAULT_FINANCE_SCOPE.tenantId,
      businessId: DEFAULT_FINANCE_SCOPE.businessId,
      branchId: input.branchId,
      transactionType: FINANCE_TRANSACTION_TYPES.EXPENSE,
      amountCents: input.amountCents + taxCents,
      currency: DEFAULT_FINANCE_SCOPE.baseCurrency,
      journalEntryId: null,
      referenceType: "expense",
      referenceId: expenseId,
      description: input.description,
      occurredAt: now,
      createdByUserId: DEFAULT_FINANCE_SCOPE.userId,
    });

    this.record.analytics.expenseCents += input.amountCents + taxCents;
    return structuredClone(this.record);
  }

  recordPayment(input: RecordPaymentInput): FinanceRecord {
    const now = new Date().toISOString();
    const paymentId = createId("pay");

    this.record.payments.push({
      id: paymentId,
      tenantId: DEFAULT_FINANCE_SCOPE.tenantId,
      businessId: DEFAULT_FINANCE_SCOPE.businessId,
      branchId: input.branchId,
      paymentMethod: input.paymentMethod,
      amountCents: input.amountCents,
      currency: DEFAULT_FINANCE_SCOPE.baseCurrency,
      invoiceId: input.invoiceId ?? null,
      reference: input.reference ?? null,
      paidAt: now,
      recordedByUserId: input.recordedByUserId,
    });

    if (input.invoiceId) {
      const invoice = this.record.invoices.find((inv) => inv.id === input.invoiceId);

      if (invoice) {
        invoice.amountPaidCents += input.amountCents;
        invoice.amountDueCents = Math.max(0, invoice.totalCents - invoice.amountPaidCents);
        invoice.status =
          invoice.amountDueCents === 0 ? INVOICE_STATUSES.PAID : INVOICE_STATUSES.PARTIALLY_PAID;
        invoice.updatedAt = now;
      }
    }

    this.record.transactions.push({
      id: createId("txn"),
      tenantId: DEFAULT_FINANCE_SCOPE.tenantId,
      businessId: DEFAULT_FINANCE_SCOPE.businessId,
      branchId: input.branchId,
      transactionType: FINANCE_TRANSACTION_TYPES.PAYMENT,
      amountCents: input.amountCents,
      currency: DEFAULT_FINANCE_SCOPE.baseCurrency,
      journalEntryId: null,
      referenceType: "payment",
      referenceId: paymentId,
      description: `Payment received${input.invoiceId ? ` for invoice` : ""}`,
      occurredAt: now,
      createdByUserId: input.recordedByUserId,
    });

    return structuredClone(this.record);
  }

  getOverdueInvoices(): Invoice[] {
    const today = "2026-02-15";
    return this.record.invoices.filter(
      (inv) =>
        inv.status !== INVOICE_STATUSES.PAID &&
        inv.status !== INVOICE_STATUSES.VOID &&
        inv.dueDate < today,
    );
  }

  getUnpaidInvoices(): Invoice[] {
    return this.record.invoices.filter(
      (inv) => inv.amountDueCents > 0 && inv.status !== INVOICE_STATUSES.VOID,
    );
  }
}

export const financeRepository = new FinanceRepository();
