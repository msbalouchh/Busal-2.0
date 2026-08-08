/** Chart of account types. */
export const ACCOUNT_TYPES = {
  ASSET: "asset",
  LIABILITY: "liability",
  EQUITY: "equity",
  REVENUE: "revenue",
  EXPENSE: "expense",
  COGS: "cogs",
} as const;

export type AccountType = (typeof ACCOUNT_TYPES)[keyof typeof ACCOUNT_TYPES];

/** Normal balance side for accounts. */
export const ACCOUNT_NORMAL_BALANCE = {
  DEBIT: "debit",
  CREDIT: "credit",
} as const;

export type AccountNormalBalance =
  (typeof ACCOUNT_NORMAL_BALANCE)[keyof typeof ACCOUNT_NORMAL_BALANCE];

/** Journal entry lifecycle statuses. */
export const JOURNAL_ENTRY_STATUSES = {
  DRAFT: "draft",
  POSTED: "posted",
  REVERSED: "reversed",
  VOID: "void",
} as const;

export type JournalEntryStatus =
  (typeof JOURNAL_ENTRY_STATUSES)[keyof typeof JOURNAL_ENTRY_STATUSES];

/** Transaction types across the ledger. */
export const FINANCE_TRANSACTION_TYPES = {
  SALE: "sale",
  PAYMENT: "payment",
  REFUND: "refund",
  EXPENSE: "expense",
  INCOME: "income",
  TRANSFER: "transfer",
  PAYROLL: "payroll",
  SUPPLIER_PAYMENT: "supplier_payment",
  ADJUSTMENT: "adjustment",
} as const;

export type FinanceTransactionType =
  (typeof FINANCE_TRANSACTION_TYPES)[keyof typeof FINANCE_TRANSACTION_TYPES];

/** Invoice lifecycle statuses. */
export const INVOICE_STATUSES = {
  DRAFT: "draft",
  SENT: "sent",
  PARTIALLY_PAID: "partially_paid",
  PAID: "paid",
  OVERDUE: "overdue",
  VOID: "void",
  REFUNDED: "refunded",
} as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[keyof typeof INVOICE_STATUSES];

/** Payment method types. */
export const FINANCE_PAYMENT_METHODS = {
  CASH: "cash",
  CARD: "card",
  BANK_TRANSFER: "bank_transfer",
  DIRECT_DEBIT: "direct_debit",
  ONLINE: "online",
  STORE_CREDIT: "store_credit",
} as const;

export type FinancePaymentMethod =
  (typeof FINANCE_PAYMENT_METHODS)[keyof typeof FINANCE_PAYMENT_METHODS];

/** Expense categories. */
export const EXPENSE_CATEGORIES = {
  COGS: "cogs",
  PAYROLL: "payroll",
  RENT: "rent",
  UTILITIES: "utilities",
  MARKETING: "marketing",
  SUPPLIES: "supplies",
  MAINTENANCE: "maintenance",
  INSURANCE: "insurance",
  OTHER: "other",
} as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[keyof typeof EXPENSE_CATEGORIES];

/** Financial period statuses. */
export const FINANCIAL_PERIOD_STATUSES = {
  OPEN: "open",
  CLOSED: "closed",
  LOCKED: "locked",
} as const;

export type FinancialPeriodStatus =
  (typeof FINANCIAL_PERIOD_STATUSES)[keyof typeof FINANCIAL_PERIOD_STATUSES];

/** Tax types. */
export const TAX_TYPES = {
  VAT: "vat",
  SALES: "sales",
  PAYROLL: "payroll",
  WITHHOLDING: "withholding",
} as const;

export type TaxType = (typeof TAX_TYPES)[keyof typeof TAX_TYPES];

export const FINANCE_AI_TOOL_IDS = {
  CREATE_INVOICE: "finance.create-invoice",
  RECORD_EXPENSE: "finance.record-expense",
  RECORD_PAYMENT: "finance.record-payment",
  FORECAST_CASH_FLOW: "finance.forecast-cash-flow",
  DETECT_ANOMALIES: "finance.detect-anomalies",
  GENERATE_REPORTS: "finance.generate-reports",
  PREDICT_REVENUE: "finance.predict-revenue",
  RECOMMEND_SAVINGS: "finance.recommend-savings",
  ANALYZE_EXPENSES: "finance.analyze-expenses",
  ANALYZE_PROFITABILITY: "finance.analyze-profitability",
  RECOMMEND_BUDGET: "finance.recommend-budget",
  DETECT_FINANCIAL_RISK: "finance.detect-financial-risk",
} as const;

export type FinanceAiToolId = (typeof FINANCE_AI_TOOL_IDS)[keyof typeof FINANCE_AI_TOOL_IDS];

/** Module-local permission markers (future RBAC wiring). */
export const FINANCE_PERMISSIONS = {
  READ: "finance.read",
  MANAGE: "finance.manage",
  INVOICE: "finance.invoice",
  EXPENSE: "finance.expense",
  REPORTS: "finance.reports",
  PAYROLL: "finance.payroll",
  ANALYTICS_READ: "finance.analytics.read",
} as const;

export type FinancePermission = (typeof FINANCE_PERMISSIONS)[keyof typeof FINANCE_PERMISSIONS];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  partially_paid: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
  refunded: "Refunded",
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  revenue: "Revenue",
  expense: "Expense",
  cogs: "Cost of Goods Sold",
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  cogs: "Cost of Goods Sold",
  payroll: "Payroll",
  rent: "Rent",
  utilities: "Utilities",
  marketing: "Marketing",
  supplies: "Supplies",
  maintenance: "Maintenance",
  insurance: "Insurance",
  other: "Other",
};
