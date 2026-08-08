import type {
  AccountNormalBalance,
  AccountType,
  ExpenseCategory,
  FinancePaymentMethod,
  FinanceTransactionType,
  FinancialPeriodStatus,
  InvoiceStatus,
  JournalEntryStatus,
  TaxType,
} from "@/modules/finance/constants/finance-status";

/** Cost centre for expense allocation. */
export interface CostCenter {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Budget allocation for an account/period. */
export interface Budget {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  costCenterId: string | null;
  accountId: string;
  periodId: string;
  name: string;
  allocatedCents: number;
  spentCents: number;
  currency: string;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Bank reconciliation record. */
export interface BankReconciliation {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  bankAccountId: string;
  statementDate: string;
  statementBalanceCents: number;
  ledgerBalanceCents: number;
  differenceCents: number;
  isReconciled: boolean;
  reconciledAt: string | null;
  reconciledByUserId: string | null;
  createdAt: string;
}

/** Chart of accounts entry. */
export interface ChartOfAccount {
  id: string;
  tenantId: string;
  businessId: string;
  code: string;
  name: string;
  accountType: AccountType;
  normalBalance: AccountNormalBalance;
  parentAccountId: string | null;
  currency: string;
  isActive: boolean;
  isSystemAccount: boolean;
  createdAt: string;
  updatedAt: string;
}

/** General ledger for an account. */
export interface Ledger {
  id: string;
  accountId: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  periodId: string;
  openingBalanceCents: number;
  debitTotalCents: number;
  creditTotalCents: number;
  closingBalanceCents: number;
  currency: string;
  entryCount: number;
  updatedAt: string;
}

/** Double-entry journal entry. */
export interface JournalEntry {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  entryNumber: string;
  status: JournalEntryStatus;
  description: string;
  referenceType: string | null;
  referenceId: string | null;
  periodId: string;
  lines: JournalEntryLine[];
  postedAt: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  accountCode: string;
  description: string;
  debitCents: number;
  creditCents: number;
}

/** Financial transaction record. */
export interface FinanceTransaction {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  transactionType: FinanceTransactionType;
  amountCents: number;
  currency: string;
  journalEntryId: string | null;
  referenceType: string | null;
  referenceId: string | null;
  description: string;
  occurredAt: string;
  createdByUserId: string;
}

/** Customer/vendor invoice. */
export interface Invoice {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  customerId: string | null;
  customerName: string;
  issueDate: string;
  dueDate: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  amountPaidCents: number;
  amountDueCents: number;
  currency: string;
  lineItems: InvoiceLineItem[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  taxCents: number;
  totalCents: number;
}

/** Payment received or made. */
export interface FinancePayment {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  paymentMethod: FinancePaymentMethod;
  amountCents: number;
  currency: string;
  invoiceId: string | null;
  reference: string | null;
  paidAt: string;
  recordedByUserId: string;
}

/** Refund against a payment or invoice. */
export interface FinanceRefund {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  paymentId: string;
  invoiceId: string | null;
  refundNumber: string;
  amountCents: number;
  currency: string;
  reason: string;
  refundedAt: string;
  approvedByUserId: string | null;
}

/** Business expense record. */
export interface Expense {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  category: ExpenseCategory;
  vendorName: string;
  description: string;
  amountCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  expenseDate: string;
  accountId: string;
  receiptUrl: string | null;
  approvedByUserId: string | null;
  createdAt: string;
}

/** Non-invoice income record. */
export interface Income {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  source: string;
  description: string;
  amountCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  incomeDate: string;
  accountId: string;
  createdAt: string;
}

/** Tax record / liability. */
export interface FinanceTax {
  id: string;
  tenantId: string;
  businessId: string;
  taxType: TaxType;
  name: string;
  rateBps: number;
  taxableAmountCents: number;
  taxAmountCents: number;
  periodId: string;
  jurisdiction: string;
  isPaid: boolean;
  dueDate: string | null;
}

/** POS cash register balance link. */
export interface CashRegister {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  registerId: string;
  name: string;
  currentBalanceCents: number;
  expectedBalanceCents: number;
  currency: string;
  lastReconciledAt: string | null;
}

/** Bank account for cash management. */
export interface BankAccount {
  id: string;
  tenantId: string;
  businessId: string;
  accountName: string;
  bankName: string;
  accountNumberLast4: string;
  sortCode: string | null;
  currency: string;
  currentBalanceCents: number;
  ledgerAccountId: string;
  isActive: boolean;
}

/** Payroll transaction (payroll-ready, no processing). */
export interface PayrollTransaction {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  staffId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  grossPayCents: number;
  taxCents: number;
  deductionsCents: number;
  netPayCents: number;
  currency: string;
  status: "pending" | "processed" | "paid";
  processedAt: string | null;
}

/** Payment to supplier (accounts payable). */
export interface SupplierPayment {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  supplierId: string;
  supplierName: string;
  purchaseOrderId: string | null;
  amountCents: number;
  currency: string;
  paymentMethod: FinancePaymentMethod;
  paidAt: string;
  reference: string | null;
}

/** Customer payment (accounts receivable). */
export interface CustomerPayment {
  id: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  customerId: string;
  customerName: string;
  invoiceId: string | null;
  amountCents: number;
  currency: string;
  paymentMethod: FinancePaymentMethod;
  receivedAt: string;
  reference: string | null;
}

/** Accounting period (month/quarter/year). */
export interface FinancialPeriod {
  id: string;
  tenantId: string;
  businessId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: FinancialPeriodStatus;
  fiscalYear: number;
  isCurrent: boolean;
}

/** Profit & Loss statement snapshot. */
export interface ProfitAndLoss {
  periodId: string;
  tenantId: string;
  businessId: string;
  revenueCents: number;
  cogsCents: number;
  grossProfitCents: number;
  operatingExpensesCents: number;
  netProfitCents: number;
  currency: string;
  generatedAt: string;
}

/** Balance sheet snapshot. */
export interface BalanceSheet {
  periodId: string;
  tenantId: string;
  businessId: string;
  assetsCents: number;
  liabilitiesCents: number;
  equityCents: number;
  currency: string;
  generatedAt: string;
}

/** Cash flow statement snapshot. */
export interface CashFlow {
  periodId: string;
  tenantId: string;
  businessId: string;
  operatingCents: number;
  investingCents: number;
  financingCents: number;
  netCashChangeCents: number;
  openingCashCents: number;
  closingCashCents: number;
  currency: string;
  generatedAt: string;
}

/** Financial performance metrics. */
export interface FinanceAnalytics {
  periodId: string;
  revenueCents: number;
  expenseCents: number;
  netProfitCents: number;
  grossMarginBps: number;
  netMarginBps: number;
  accountsReceivableCents: number;
  accountsPayableCents: number;
  cashOnHandCents: number;
  anomalyScore: number;
}

/** AI-enriched context for finance intelligence. */
export interface FinanceAiContext {
  periodId: string;
  summary: string;
  revenueForecastCents: number;
  cashFlowForecastCents: number;
  anomalyRiskScore: number;
  costSavingOpportunitiesCents: number;
  insights: string[];
  recommendedActions: string[];
  lastGeneratedAt: string;
}

/** Full finance period aggregate — single source of truth. */
export interface FinanceRecord {
  period: FinancialPeriod;
  chartOfAccounts: ChartOfAccount[];
  costCenters: CostCenter[];
  budgets: Budget[];
  ledgers: Ledger[];
  journalEntries: JournalEntry[];
  transactions: FinanceTransaction[];
  invoices: Invoice[];
  payments: FinancePayment[];
  refunds: FinanceRefund[];
  expenses: Expense[];
  income: Income[];
  taxes: FinanceTax[];
  cashRegisters: CashRegister[];
  bankAccounts: BankAccount[];
  bankReconciliations: BankReconciliation[];
  payrollTransactions: PayrollTransaction[];
  supplierPayments: SupplierPayment[];
  customerPayments: CustomerPayment[];
  profitAndLoss: ProfitAndLoss;
  balanceSheet: BalanceSheet;
  cashFlow: CashFlow;
  analytics: FinanceAnalytics;
  aiContext: FinanceAiContext;
}

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

export interface FinanceSearchQuery {
  query?: string;
  tenantId?: string;
  businessId?: string;
  branchId?: string;
  periodId?: string;
  transactionType?: FinanceTransactionType;
  invoiceStatus?: InvoiceStatus;
  expenseCategory?: ExpenseCategory;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

export interface CreateInvoiceInput {
  branchId: string;
  customerName: string;
  customerId?: string;
  dueDate: string;
  lineItems: Array<{ description: string; quantity: number; unitPriceCents: number }>;
  notes?: string;
}

export interface RecordExpenseInput {
  branchId: string;
  category: ExpenseCategory;
  vendorName: string;
  description: string;
  amountCents: number;
  expenseDate: string;
  accountId: string;
}

export interface RecordPaymentInput {
  branchId: string;
  invoiceId?: string;
  amountCents: number;
  paymentMethod: FinancePaymentMethod;
  reference?: string;
  recordedByUserId: string;
}

export interface FinancePlatformContext {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
  currentPeriodId: string;
  baseCurrency: string;
}

export interface FinanceContextValue {
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
  selectedInvoiceId: string | null;
  selectedInvoice: Invoice | null;
  selectInvoice: (invoiceId: string | null) => void;
  searchTransactions: (query: FinanceSearchQuery) => FinanceTransaction[];
  refresh: () => void;
  isRefreshing: boolean;
  error: string | null;
  featureAccessDenied: boolean;
  featureAccessMessage: string | null;
}

export interface FinanceLedgerContextValue {
  ledgers: Ledger[];
  journalEntries: JournalEntry[];
  chartOfAccounts: ChartOfAccount[];
  refresh: () => void;
}

export interface FinanceReportsContextValue {
  profitAndLoss: ProfitAndLoss;
  balanceSheet: BalanceSheet;
  cashFlow: CashFlow;
  refresh: () => void;
}
