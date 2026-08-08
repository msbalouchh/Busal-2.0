import type { OrderPayment, Prisma } from "@prisma/client";

import {
  ACCOUNT_NORMAL_BALANCE,
  ACCOUNT_TYPES,
  FINANCE_TRANSACTION_TYPES,
  FINANCIAL_PERIOD_STATUSES,
  INVOICE_STATUSES,
  JOURNAL_ENTRY_STATUSES,
  TAX_TYPES,
} from "@/modules/finance/constants/finance-status";
import type { FinanceTenantScope } from "@/modules/finance/lib/finance-scope";
import {
  calculateGrossMarginBps,
  calculateNetMarginBps,
} from "@/modules/finance/utils/finance-report-utils";
import type {
  BalanceSheet,
  BankAccount,
  BankReconciliation,
  Budget,
  CashFlow,
  ChartOfAccount,
  CostCenter,
  Expense,
  FinanceAiContext,
  FinanceAnalytics,
  FinancePayment,
  FinanceRecord,
  FinanceTax,
  FinanceTransaction,
  FinancialPeriod,
  Income,
  Invoice,
  JournalEntry,
  JournalEntryLine,
  Ledger,
  ProfitAndLoss,
} from "@/modules/finance/types/finance-platform";

export interface StoredFinanceBranchMeta {
  chartOfAccounts?: ChartOfAccount[];
  costCenters?: CostCenter[];
  budgets?: Budget[];
  journalEntries?: JournalEntry[];
  invoices?: Invoice[];
  payments?: FinancePayment[];
  expenses?: Expense[];
  income?: Income[];
  taxes?: FinanceTax[];
  bankAccounts?: BankAccount[];
  bankReconciliations?: BankReconciliation[];
  financialPeriods?: FinancialPeriod[];
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function iso(value: Date | string | null | undefined): string {
  if (!value) {
    return new Date().toISOString();
  }
  return value instanceof Date ? value.toISOString() : value;
}

function cents(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return Math.round(Number(value) * 100);
}

function normalBalanceForType(accountType: ChartOfAccount["accountType"]): ChartOfAccount["normalBalance"] {
  switch (accountType) {
    case ACCOUNT_TYPES.LIABILITY:
    case ACCOUNT_TYPES.EQUITY:
    case ACCOUNT_TYPES.REVENUE:
      return ACCOUNT_NORMAL_BALANCE.CREDIT;
    default:
      return ACCOUNT_NORMAL_BALANCE.DEBIT;
  }
}

export function defaultChartOfAccounts(scope: FinanceTenantScope): ChartOfAccount[] {
  const now = new Date().toISOString();
  const base = {
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    currency: scope.baseCurrency,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  return [
    { id: "acct-cash", code: "1000", name: "Cash on Hand", accountType: ACCOUNT_TYPES.ASSET, normalBalance: ACCOUNT_NORMAL_BALANCE.DEBIT, parentAccountId: null, isSystemAccount: true, ...base },
    { id: "acct-bank", code: "1010", name: "Business Bank Account", accountType: ACCOUNT_TYPES.ASSET, normalBalance: ACCOUNT_NORMAL_BALANCE.DEBIT, parentAccountId: null, isSystemAccount: true, ...base },
    { id: "acct-ar", code: "1200", name: "Accounts Receivable", accountType: ACCOUNT_TYPES.ASSET, normalBalance: ACCOUNT_NORMAL_BALANCE.DEBIT, parentAccountId: null, isSystemAccount: true, ...base },
    { id: "acct-ap", code: "2000", name: "Accounts Payable", accountType: ACCOUNT_TYPES.LIABILITY, normalBalance: ACCOUNT_NORMAL_BALANCE.CREDIT, parentAccountId: null, isSystemAccount: true, ...base },
    { id: "acct-vat", code: "2200", name: "VAT Payable", accountType: ACCOUNT_TYPES.LIABILITY, normalBalance: ACCOUNT_NORMAL_BALANCE.CREDIT, parentAccountId: null, isSystemAccount: true, ...base },
    { id: "acct-revenue", code: "4000", name: "Sales Revenue", accountType: ACCOUNT_TYPES.REVENUE, normalBalance: ACCOUNT_NORMAL_BALANCE.CREDIT, parentAccountId: null, isSystemAccount: true, ...base },
    { id: "acct-cogs", code: "5000", name: "Cost of Goods Sold", accountType: ACCOUNT_TYPES.COGS, normalBalance: ACCOUNT_NORMAL_BALANCE.DEBIT, parentAccountId: null, isSystemAccount: true, ...base },
    { id: "acct-payroll", code: "6100", name: "Payroll Expense", accountType: ACCOUNT_TYPES.EXPENSE, normalBalance: ACCOUNT_NORMAL_BALANCE.DEBIT, parentAccountId: null, isSystemAccount: false, ...base },
  ];
}

export function defaultBankAccounts(scope: FinanceTenantScope): BankAccount[] {
  return [
    {
      id: "bank-main",
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      accountName: "Operating Account",
      bankName: "Primary Bank",
      accountNumberLast4: "0000",
      sortCode: null,
      currency: scope.baseCurrency,
      currentBalanceCents: 0,
      ledgerAccountId: "acct-bank",
      isActive: true,
    },
  ];
}

export function defaultFinancialPeriod(scope: FinanceTenantScope): FinancialPeriod {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  return {
    id: scope.currentPeriodId,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    name: start.toLocaleString("en-GB", { month: "long", year: "numeric" }),
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    status: FINANCIAL_PERIOD_STATUSES.OPEN,
    fiscalYear: year,
    isCurrent: true,
  };
}

export function defaultBranchFinanceMeta(scope: FinanceTenantScope): StoredFinanceBranchMeta {
  return {
    chartOfAccounts: defaultChartOfAccounts(scope),
    costCenters: [],
    budgets: [],
    journalEntries: [],
    invoices: [],
    payments: [],
    expenses: [],
    income: [],
    taxes: [],
    bankAccounts: defaultBankAccounts(scope),
    bankReconciliations: [],
    financialPeriods: [defaultFinancialPeriod(scope)],
  };
}

export function mapOrderPaymentToTransaction(
  scope: FinanceTenantScope,
  payment: OrderPayment,
): FinanceTransaction {
  return {
    id: `pos-txn-${payment.id}`,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    transactionType: FINANCE_TRANSACTION_TYPES.SALE,
    amountCents: cents(payment.amountPaid),
    currency: payment.currency,
    journalEntryId: null,
    referenceType: "order_payment",
    referenceId: payment.id,
    description: `POS payment ${payment.paymentNumber}`,
    occurredAt: iso(payment.paidAt ?? payment.createdAt),
    createdByUserId: payment.processedByStaffId ?? scope.userId,
  };
}

export function mapPosPaymentsToIncome(
  scope: FinanceTenantScope,
  payments: OrderPayment[],
): Income {
  const totalCents = payments.reduce((sum, payment) => sum + cents(payment.amountPaid), 0);
  const taxCents = payments.reduce((sum, payment) => sum + cents(payment.taxAmount), 0);
  const period = defaultFinancialPeriod(scope);

  return {
    id: `inc-pos-${scope.currentPeriodId}`,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    source: "POS Sales",
    description: "Integrated POS order payments",
    amountCents: totalCents - taxCents,
    taxCents,
    totalCents,
    currency: scope.baseCurrency,
    incomeDate: period.startDate,
    accountId: "acct-revenue",
    createdAt: new Date().toISOString(),
  };
}

function computeLedgers(
  scope: FinanceTenantScope,
  chartOfAccounts: ChartOfAccount[],
  journalEntries: JournalEntry[],
): Ledger[] {
  const totals = new Map<string, { debit: number; credit: number; count: number }>();

  for (const entry of journalEntries) {
    if (entry.status !== JOURNAL_ENTRY_STATUSES.POSTED) {
      continue;
    }

    for (const line of entry.lines) {
      const current = totals.get(line.accountId) ?? { debit: 0, credit: 0, count: 0 };
      current.debit += line.debitCents;
      current.credit += line.creditCents;
      current.count += 1;
      totals.set(line.accountId, current);
    }
  }

  return chartOfAccounts.map((account) => {
    const total = totals.get(account.id) ?? { debit: 0, credit: 0, count: 0 };
    const closing =
      account.normalBalance === ACCOUNT_NORMAL_BALANCE.DEBIT
        ? total.debit - total.credit
        : total.credit - total.debit;

    return {
      id: `ledger-${account.id}-${scope.currentPeriodId}`,
      accountId: account.id,
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      periodId: scope.currentPeriodId,
      openingBalanceCents: 0,
      debitTotalCents: total.debit,
      creditTotalCents: total.credit,
      closingBalanceCents: closing,
      currency: scope.baseCurrency,
      entryCount: total.count,
      updatedAt: new Date().toISOString(),
    };
  });
}

function sumByAccountType(
  ledgers: Ledger[],
  chartOfAccounts: ChartOfAccount[],
  types: ChartOfAccount["accountType"][],
): number {
  const accountIds = new Set(
    chartOfAccounts.filter((account) => types.includes(account.accountType)).map((account) => account.id),
  );

  return ledgers
    .filter((ledger) => accountIds.has(ledger.accountId))
    .reduce((sum, ledger) => sum + Math.abs(ledger.closingBalanceCents), 0);
}

function computeProfitAndLoss(
  scope: FinanceTenantScope,
  revenueCents: number,
  expenses: Expense[],
): ProfitAndLoss {
  const cogsCents = expenses
    .filter((expense) => expense.accountId === "acct-cogs" || expense.category === "cogs")
    .reduce((sum, expense) => sum + expense.amountCents, 0);
  const operatingExpensesCents = expenses
    .filter((expense) => expense.accountId !== "acct-cogs" && expense.category !== "cogs")
    .reduce((sum, expense) => sum + expense.amountCents, 0);
  const grossProfitCents = revenueCents - cogsCents;
  const netProfitCents = grossProfitCents - operatingExpensesCents;

  return {
    periodId: scope.currentPeriodId,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    revenueCents,
    cogsCents,
    grossProfitCents,
    operatingExpensesCents,
    netProfitCents,
    currency: scope.baseCurrency,
    generatedAt: new Date().toISOString(),
  };
}

function computeBalanceSheet(
  scope: FinanceTenantScope,
  ledgers: Ledger[],
  chartOfAccounts: ChartOfAccount[],
): BalanceSheet {
  const assetsCents = sumByAccountType(ledgers, chartOfAccounts, [ACCOUNT_TYPES.ASSET]);
  const liabilitiesCents = sumByAccountType(ledgers, chartOfAccounts, [ACCOUNT_TYPES.LIABILITY]);
  const equityCents = sumByAccountType(ledgers, chartOfAccounts, [ACCOUNT_TYPES.EQUITY]);

  return {
    periodId: scope.currentPeriodId,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    assetsCents,
    liabilitiesCents,
    equityCents: equityCents || Math.max(0, assetsCents - liabilitiesCents),
    currency: scope.baseCurrency,
    generatedAt: new Date().toISOString(),
  };
}

function computeCashFlow(
  scope: FinanceTenantScope,
  profitAndLoss: ProfitAndLoss,
  cashOnHandCents: number,
): CashFlow {
  const operatingCents = profitAndLoss.netProfitCents;
  const openingCashCents = Math.max(0, cashOnHandCents - operatingCents);

  return {
    periodId: scope.currentPeriodId,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    operatingCents,
    investingCents: 0,
    financingCents: 0,
    netCashChangeCents: operatingCents,
    openingCashCents,
    closingCashCents: cashOnHandCents,
    currency: scope.baseCurrency,
    generatedAt: new Date().toISOString(),
  };
}

function computeAnalytics(
  scope: FinanceTenantScope,
  profitAndLoss: ProfitAndLoss,
  invoices: Invoice[],
  expenses: Expense[],
  payments: FinancePayment[],
): FinanceAnalytics {
  const accountsReceivableCents = invoices
    .filter((invoice) => invoice.amountDueCents > 0 && invoice.status !== INVOICE_STATUSES.VOID)
    .reduce((sum, invoice) => sum + invoice.amountDueCents, 0);
  const accountsPayableCents = expenses.reduce((sum, expense) => sum + expense.totalCents, 0);
  const cashOnHandCents = payments.reduce((sum, payment) => sum + payment.amountCents, 0);

  return {
    periodId: scope.currentPeriodId,
    revenueCents: profitAndLoss.revenueCents,
    expenseCents: profitAndLoss.cogsCents + profitAndLoss.operatingExpensesCents,
    netProfitCents: profitAndLoss.netProfitCents,
    grossMarginBps: calculateGrossMarginBps(profitAndLoss.revenueCents, profitAndLoss.cogsCents),
    netMarginBps: calculateNetMarginBps(profitAndLoss.revenueCents, profitAndLoss.netProfitCents),
    accountsReceivableCents,
    accountsPayableCents,
    cashOnHandCents,
    anomalyScore: 0,
  };
}

function computeAiContext(scope: FinanceTenantScope, analytics: FinanceAnalytics, invoices: Invoice[]): FinanceAiContext {
  const overdueCount = invoices.filter((invoice) => invoice.status === INVOICE_STATUSES.OVERDUE).length;

  return {
    periodId: scope.currentPeriodId,
    summary: `Revenue £${(analytics.revenueCents / 100).toFixed(0)}, net profit £${(analytics.netProfitCents / 100).toFixed(0)}`,
    revenueForecastCents: Math.round(analytics.revenueCents * 1.08),
    cashFlowForecastCents: Math.round(analytics.cashOnHandCents + analytics.netProfitCents),
    anomalyRiskScore: analytics.anomalyScore,
    costSavingOpportunitiesCents: Math.round(analytics.expenseCents * 0.02),
    insights: [
      `Gross margin ${(analytics.grossMarginBps / 100).toFixed(1)}%`,
      overdueCount > 0 ? `${overdueCount} overdue invoice(s)` : "No overdue invoices",
    ],
    recommendedActions:
      overdueCount > 0
        ? ["Follow up on overdue invoices", "Review expense categories for savings"]
        : ["Maintain current financial controls"],
    lastGeneratedAt: new Date().toISOString(),
  };
}

export function buildFinanceRecord(
  scope: FinanceTenantScope,
  meta: StoredFinanceBranchMeta,
  posPayments: OrderPayment[] = [],
): FinanceRecord {
  const chartOfAccounts = meta.chartOfAccounts ?? defaultChartOfAccounts(scope);
  const journalEntries = (meta.journalEntries ?? []).filter(
    (entry) => entry.status !== JOURNAL_ENTRY_STATUSES.VOID,
  );
  const invoices = meta.invoices ?? [];
  const payments = meta.payments ?? [];
  const expenses = meta.expenses ?? [];
  const incomeRecords = meta.income ?? [];
  const posTransactions = posPayments.map((payment) => mapOrderPaymentToTransaction(scope, payment));
  const posIncome =
    posPayments.length > 0 ? [mapPosPaymentsToIncome(scope, posPayments)] : [];
  const transactions = [...(meta.journalEntries ? [] : []), ...posTransactions];
  const allTransactions: FinanceTransaction[] = [
    ...transactions,
    ...expenses.map((expense) => ({
      id: `txn-exp-${expense.id}`,
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      transactionType: FINANCE_TRANSACTION_TYPES.EXPENSE,
      amountCents: expense.totalCents,
      currency: expense.currency,
      journalEntryId: null,
      referenceType: "expense",
      referenceId: expense.id,
      description: expense.description,
      occurredAt: iso(expense.createdAt),
      createdByUserId: scope.userId,
    })),
    ...payments.map((payment) => ({
      id: `txn-pay-${payment.id}`,
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      transactionType: FINANCE_TRANSACTION_TYPES.PAYMENT,
      amountCents: payment.amountCents,
      currency: payment.currency,
      journalEntryId: null,
      referenceType: "payment",
      referenceId: payment.id,
      description: payment.reference ?? "Payment received",
      occurredAt: payment.paidAt,
      createdByUserId: payment.recordedByUserId,
    })),
  ];

  const period =
    meta.financialPeriods?.find((entry) => entry.isCurrent) ?? defaultFinancialPeriod(scope);
  const ledgers = computeLedgers(scope, chartOfAccounts, journalEntries);
  const posRevenueCents = posPayments.reduce((sum, payment) => sum + cents(payment.amountPaid), 0);
  const incomeRevenueCents = [...incomeRecords, ...posIncome].reduce(
    (sum, income) => sum + income.totalCents,
    0,
  );
  const invoiceRevenueCents = invoices
    .filter((invoice) => invoice.status === INVOICE_STATUSES.PAID)
    .reduce((sum, invoice) => sum + invoice.totalCents, 0);
  const revenueCents = Math.max(incomeRevenueCents, invoiceRevenueCents, posRevenueCents);

  const profitAndLoss = computeProfitAndLoss(scope, revenueCents, expenses);
  const analytics = computeAnalytics(scope, profitAndLoss, invoices, expenses, payments);
  const balanceSheet = computeBalanceSheet(scope, ledgers, chartOfAccounts);
  const cashFlow = computeCashFlow(scope, profitAndLoss, analytics.cashOnHandCents);

  const defaultTax: FinanceTax = {
    id: `tax-vat-${scope.currentPeriodId}`,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    taxType: TAX_TYPES.VAT,
    name: `VAT — ${period.name}`,
    rateBps: 2000,
    taxableAmountCents: revenueCents,
    taxAmountCents: Math.round(revenueCents * 0.2),
    periodId: scope.currentPeriodId,
    jurisdiction: "GB",
    isPaid: false,
    dueDate: null,
  };

  return {
    period,
    chartOfAccounts,
    costCenters: meta.costCenters ?? [],
    budgets: meta.budgets ?? [],
    ledgers,
    journalEntries,
    transactions: allTransactions,
    invoices,
    payments,
    refunds: [],
    expenses,
    income: [...incomeRecords, ...posIncome],
    taxes: meta.taxes?.length ? meta.taxes : [defaultTax],
    cashRegisters: [],
    bankAccounts: meta.bankAccounts ?? defaultBankAccounts(scope),
    bankReconciliations: meta.bankReconciliations ?? [],
    payrollTransactions: [],
    supplierPayments: [],
    customerPayments: [],
    profitAndLoss,
    balanceSheet,
    cashFlow,
    analytics,
    aiContext: computeAiContext(scope, analytics, invoices),
  };
}

export function createJournalEntryRecord(
  scope: FinanceTenantScope,
  input: {
    description: string;
    referenceType?: string | null;
    referenceId?: string | null;
    periodId?: string;
    lines: Array<{ accountId: string; description?: string; debitCents: number; creditCents: number }>;
  },
  chartOfAccounts: ChartOfAccount[],
): JournalEntry {
  const now = new Date().toISOString();
  const entryId = createId("je");
  const accountMap = new Map(chartOfAccounts.map((account) => [account.id, account]));

  const lines: JournalEntryLine[] = input.lines.map((line) => ({
    id: createId("jel"),
    journalEntryId: entryId,
    accountId: line.accountId,
    accountCode: accountMap.get(line.accountId)?.code ?? "",
    description: line.description ?? input.description,
    debitCents: line.debitCents,
    creditCents: line.creditCents,
  }));

  return {
    id: entryId,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    entryNumber: `JE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    status: JOURNAL_ENTRY_STATUSES.POSTED,
    description: input.description,
    referenceType: input.referenceType ?? null,
    referenceId: input.referenceId ?? null,
    periodId: input.periodId ?? scope.currentPeriodId,
    lines,
    postedAt: now,
    createdByUserId: scope.userId,
    createdAt: now,
    updatedAt: now,
  };
}

export function createInvoiceRecord(
  scope: FinanceTenantScope,
  input: {
    branchId: string;
    customerName: string;
    customerId?: string;
    dueDate: string;
    lineItems: Array<{ description: string; quantity: number; unitPriceCents: number }>;
    notes?: string;
  },
): Invoice {
  const now = new Date().toISOString();
  const invoiceId = createId("inv");
  const lineItems = input.lineItems.map((item) => {
    const subtotal = item.quantity * item.unitPriceCents;
    const tax = Math.round(subtotal * 0.2);
    return {
      id: createId("inv-line"),
      invoiceId,
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      taxCents: tax,
      totalCents: subtotal + tax,
    };
  });
  const subtotalCents = input.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0,
  );
  const taxCents = Math.round(subtotalCents * 0.2);
  const totalCents = subtotalCents + taxCents;

  return {
    id: invoiceId,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: input.branchId,
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
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
    currency: scope.baseCurrency,
    lineItems,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

export function createExpenseRecord(
  scope: FinanceTenantScope,
  input: {
    branchId: string;
    category: Expense["category"];
    vendorName: string;
    description: string;
    amountCents: number;
    expenseDate: string;
    accountId: string;
  },
): Expense {
  const now = new Date().toISOString();
  const taxCents = Math.round(input.amountCents * 0.2);

  return {
    id: createId("exp"),
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: input.branchId,
    category: input.category,
    vendorName: input.vendorName,
    description: input.description,
    amountCents: input.amountCents,
    taxCents,
    totalCents: input.amountCents + taxCents,
    currency: scope.baseCurrency,
    expenseDate: input.expenseDate,
    accountId: input.accountId,
    receiptUrl: null,
    approvedByUserId: scope.userId,
    createdAt: now,
  };
}

export function createPaymentRecord(
  scope: FinanceTenantScope,
  input: {
    branchId: string;
    amountCents: number;
    paymentMethod: FinancePayment["paymentMethod"];
    invoiceId?: string;
    reference?: string;
  },
): FinancePayment {
  return {
    id: createId("pay"),
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: input.branchId,
    paymentMethod: input.paymentMethod,
    amountCents: input.amountCents,
    currency: scope.baseCurrency,
    invoiceId: input.invoiceId ?? null,
    reference: input.reference ?? null,
    paidAt: new Date().toISOString(),
    recordedByUserId: scope.userId,
  };
}

export function createAccountRecord(
  scope: FinanceTenantScope,
  input: {
    code: string;
    name: string;
    accountType: ChartOfAccount["accountType"];
    parentAccountId?: string;
    currency?: string;
  },
): ChartOfAccount {
  const now = new Date().toISOString();
  return {
    id: createId("acct"),
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    code: input.code,
    name: input.name,
    accountType: input.accountType,
    normalBalance: normalBalanceForType(input.accountType),
    parentAccountId: input.parentAccountId ?? null,
    currency: input.currency ?? scope.baseCurrency,
    isActive: true,
    isSystemAccount: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function createCostCenterRecord(
  scope: FinanceTenantScope,
  input: { branchId: string; code: string; name: string; description?: string },
): CostCenter {
  const now = new Date().toISOString();
  return {
    id: createId("cc"),
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: input.branchId,
    code: input.code,
    name: input.name,
    description: input.description ?? null,
    isActive: true,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function createBudgetRecord(
  scope: FinanceTenantScope,
  input: {
    branchId: string;
    accountId: string;
    costCenterId?: string;
    periodId?: string;
    name: string;
    allocatedCents: number;
  },
): Budget {
  const now = new Date().toISOString();
  return {
    id: createId("budget"),
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: input.branchId,
    costCenterId: input.costCenterId ?? null,
    accountId: input.accountId,
    periodId: input.periodId ?? scope.currentPeriodId,
    name: input.name,
    allocatedCents: input.allocatedCents,
    spentCents: 0,
    currency: scope.baseCurrency,
    isActive: true,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export { createId, normalBalanceForType };
