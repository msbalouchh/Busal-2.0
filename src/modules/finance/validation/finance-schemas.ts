import { z } from "zod";

import {
  ACCOUNT_TYPES,
  EXPENSE_CATEGORIES,
  FINANCE_PAYMENT_METHODS,
  FINANCE_TRANSACTION_TYPES,
  INVOICE_STATUSES,
  JOURNAL_ENTRY_STATUSES,
  TAX_TYPES,
} from "@/modules/finance/constants/finance-status";

export const financeSearchSchema = z.object({
  query: z.string().trim().optional(),
  periodId: z.string().trim().optional(),
  transactionType: z
    .enum([
      FINANCE_TRANSACTION_TYPES.SALE,
      FINANCE_TRANSACTION_TYPES.PAYMENT,
      FINANCE_TRANSACTION_TYPES.REFUND,
      FINANCE_TRANSACTION_TYPES.EXPENSE,
      FINANCE_TRANSACTION_TYPES.INCOME,
      FINANCE_TRANSACTION_TYPES.TRANSFER,
      FINANCE_TRANSACTION_TYPES.PAYROLL,
      FINANCE_TRANSACTION_TYPES.SUPPLIER_PAYMENT,
      FINANCE_TRANSACTION_TYPES.ADJUSTMENT,
    ])
    .optional(),
  invoiceStatus: z
    .enum([
      INVOICE_STATUSES.DRAFT,
      INVOICE_STATUSES.SENT,
      INVOICE_STATUSES.PARTIALLY_PAID,
      INVOICE_STATUSES.PAID,
      INVOICE_STATUSES.OVERDUE,
      INVOICE_STATUSES.VOID,
      INVOICE_STATUSES.REFUNDED,
    ])
    .optional(),
  expenseCategory: z
    .enum([
      EXPENSE_CATEGORIES.COGS,
      EXPENSE_CATEGORIES.PAYROLL,
      EXPENSE_CATEGORIES.RENT,
      EXPENSE_CATEGORIES.UTILITIES,
      EXPENSE_CATEGORIES.MARKETING,
      EXPENSE_CATEGORIES.SUPPLIES,
      EXPENSE_CATEGORIES.MAINTENANCE,
      EXPENSE_CATEGORIES.INSURANCE,
      EXPENSE_CATEGORIES.OTHER,
    ])
    .optional(),
  accountType: z
    .enum([
      ACCOUNT_TYPES.ASSET,
      ACCOUNT_TYPES.LIABILITY,
      ACCOUNT_TYPES.EQUITY,
      ACCOUNT_TYPES.REVENUE,
      ACCOUNT_TYPES.EXPENSE,
      ACCOUNT_TYPES.COGS,
    ])
    .optional(),
  fromDate: z.string().trim().optional(),
  toDate: z.string().trim().optional(),
  includeDeleted: z.coerce.boolean().optional(),
  sortBy: z.enum(["occurredAt", "amount", "description", "createdAt"]).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const createFinanceAccountSchema = z.object({
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(1).max(120),
  accountType: z.enum([
    ACCOUNT_TYPES.ASSET,
    ACCOUNT_TYPES.LIABILITY,
    ACCOUNT_TYPES.EQUITY,
    ACCOUNT_TYPES.REVENUE,
    ACCOUNT_TYPES.EXPENSE,
    ACCOUNT_TYPES.COGS,
  ]),
  parentAccountId: z.string().trim().optional(),
  currency: z.string().trim().length(3).optional(),
});

export const updateFinanceAccountSchema = createFinanceAccountSchema.partial().extend({
  accountId: z.string().trim().min(1),
});

export const journalEntryLineSchema = z.object({
  accountId: z.string().trim().min(1),
  description: z.string().trim().max(500).optional(),
  debitCents: z.coerce.number().int().min(0).default(0),
  creditCents: z.coerce.number().int().min(0).default(0),
});

export const createJournalEntrySchema = z.object({
  branchId: z.string().trim().min(1),
  description: z.string().trim().min(1).max(500),
  referenceType: z.string().trim().max(50).optional(),
  referenceId: z.string().trim().optional(),
  periodId: z.string().trim().optional(),
  lines: z.array(journalEntryLineSchema).min(2),
});

export const updateJournalEntrySchema = createJournalEntrySchema.partial().extend({
  journalEntryId: z.string().trim().min(1),
});

export const journalEntryActionSchema = z.object({
  journalEntryId: z.string().trim().min(1),
});

export const createFinanceInvoiceSchema = z.object({
  branchId: z.string().trim().min(1),
  customerName: z.string().trim().min(1).max(200),
  customerId: z.string().trim().optional(),
  dueDate: z.string().trim().min(1),
  lineItems: z
    .array(
      z.object({
        description: z.string().trim().min(1),
        quantity: z.coerce.number().positive(),
        unitPriceCents: z.coerce.number().int().min(0),
      }),
    )
    .min(1),
  notes: z.string().trim().max(1000).optional(),
});

export const recordFinanceExpenseSchema = z.object({
  branchId: z.string().trim().min(1),
  category: z.enum([
    EXPENSE_CATEGORIES.COGS,
    EXPENSE_CATEGORIES.PAYROLL,
    EXPENSE_CATEGORIES.RENT,
    EXPENSE_CATEGORIES.UTILITIES,
    EXPENSE_CATEGORIES.MARKETING,
    EXPENSE_CATEGORIES.SUPPLIES,
    EXPENSE_CATEGORIES.MAINTENANCE,
    EXPENSE_CATEGORIES.INSURANCE,
    EXPENSE_CATEGORIES.OTHER,
  ]),
  vendorName: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(500),
  amountCents: z.coerce.number().int().min(1),
  expenseDate: z.string().trim().min(1),
  accountId: z.string().trim().min(1),
  costCenterId: z.string().trim().optional(),
});

export const recordFinancePaymentSchema = z.object({
  branchId: z.string().trim().min(1),
  invoiceId: z.string().trim().optional(),
  amountCents: z.coerce.number().int().min(1),
  paymentMethod: z.enum([
    FINANCE_PAYMENT_METHODS.CASH,
    FINANCE_PAYMENT_METHODS.CARD,
    FINANCE_PAYMENT_METHODS.BANK_TRANSFER,
    FINANCE_PAYMENT_METHODS.DIRECT_DEBIT,
    FINANCE_PAYMENT_METHODS.ONLINE,
    FINANCE_PAYMENT_METHODS.STORE_CREDIT,
  ]),
  reference: z.string().trim().max(200).optional(),
});

export const createCostCenterSchema = z.object({
  branchId: z.string().trim().min(1),
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
});

export const createBudgetSchema = z.object({
  branchId: z.string().trim().min(1),
  accountId: z.string().trim().min(1),
  costCenterId: z.string().trim().optional(),
  periodId: z.string().trim().optional(),
  name: z.string().trim().min(1).max(120),
  allocatedCents: z.coerce.number().int().min(0),
});

export const createFinanceTaxSchema = z.object({
  taxType: z.enum([
    TAX_TYPES.VAT,
    TAX_TYPES.SALES,
    TAX_TYPES.PAYROLL,
    TAX_TYPES.WITHHOLDING,
  ]),
  name: z.string().trim().min(1).max(120),
  rateBps: z.coerce.number().int().min(0).max(10000),
  taxableAmountCents: z.coerce.number().int().min(0),
  jurisdiction: z.string().trim().min(2).max(10).default("GB"),
  dueDate: z.string().trim().optional(),
});

export const financeBulkActionSchema = z.object({
  entityType: z.enum(["journal_entry", "invoice", "expense", "account"]),
  entityIds: z.array(z.string().trim().min(1)).min(1),
  action: z.enum(["delete", "restore", "void", "approve"]),
});

export type FinanceSearchSchemaInput = z.infer<typeof financeSearchSchema>;
export type CreateFinanceAccountSchemaInput = z.infer<typeof createFinanceAccountSchema>;
export type UpdateFinanceAccountSchemaInput = z.infer<typeof updateFinanceAccountSchema>;
export type CreateJournalEntrySchemaInput = z.infer<typeof createJournalEntrySchema>;
export type UpdateJournalEntrySchemaInput = z.infer<typeof updateJournalEntrySchema>;
export type CreateFinanceInvoiceSchemaInput = z.infer<typeof createFinanceInvoiceSchema>;
export type RecordFinanceExpenseSchemaInput = z.infer<typeof recordFinanceExpenseSchema>;
export type RecordFinancePaymentSchemaInput = z.infer<typeof recordFinancePaymentSchema>;
export type CreateCostCenterSchemaInput = z.infer<typeof createCostCenterSchema>;
export type CreateBudgetSchemaInput = z.infer<typeof createBudgetSchema>;
export type CreateFinanceTaxSchemaInput = z.infer<typeof createFinanceTaxSchema>;
export type FinanceBulkActionSchemaInput = z.infer<typeof financeBulkActionSchema>;
