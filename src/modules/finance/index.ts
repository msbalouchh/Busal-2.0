export {
  ACCOUNT_TYPES,
  ACCOUNT_NORMAL_BALANCE,
  JOURNAL_ENTRY_STATUSES,
  FINANCE_TRANSACTION_TYPES,
  INVOICE_STATUSES,
  FINANCE_PAYMENT_METHODS,
  EXPENSE_CATEGORIES,
  FINANCIAL_PERIOD_STATUSES,
  TAX_TYPES,
  FINANCE_AI_TOOL_IDS,
  FINANCE_PERMISSIONS,
  INVOICE_STATUS_LABELS,
  ACCOUNT_TYPE_LABELS,
  EXPENSE_CATEGORY_LABELS,
  type AccountType,
  type AccountNormalBalance,
  type JournalEntryStatus,
  type FinanceTransactionType,
  type InvoiceStatus,
  type FinancePaymentMethod,
  type ExpenseCategory,
  type FinancialPeriodStatus,
  type TaxType,
  type FinanceAiToolId,
  type FinancePermission,
} from "@/modules/finance/constants/finance-status";

export {
  FINANCE_INTEGRATION_POINTS,
  type FinanceIntegrationPoint,
} from "@/modules/finance/constants/integration-points";

export {
  FINANCE_PLATFORM_ROUTES,
  FINANCE_PLATFORM_NAV_ITEMS,
} from "@/modules/finance/constants/platform-routes";

export {
  DEFAULT_FINANCE_SCOPE,
  MOCK_FINANCIAL_PERIOD,
  MOCK_CHART_OF_ACCOUNTS,
  MOCK_BANK_ACCOUNTS,
  MOCK_FINANCE_RECORD,
} from "@/modules/finance/constants/mock-data";

export type * from "@/modules/finance/types/finance-platform";

export * from "@/modules/finance/utils/finance-selectors";
export * from "@/modules/finance/utils/finance-report-utils";
export * from "@/modules/finance/utils/finance-tax-utils";

export {
  FinanceRepository,
  financeRepository,
} from "@/modules/finance/repository/finance-repository";

export { FinanceService, financeService } from "@/modules/finance/services/finance.service";

export {
  buildFinancePlatformContext,
  buildFinancePlatformSnapshot,
  getDefaultFinanceSnapshot,
  getOpenInvoices,
  type FinancePlatformSnapshot,
  type FinancePlatformInput,
} from "@/modules/finance/services/finance-platform.service";

export { FinanceProvider } from "@/modules/finance/providers/finance-provider";
export { FinanceContext } from "@/modules/finance/contexts/finance-context";

export { useFinance, useFinanceContext } from "@/modules/finance/hooks/use-finance";
export { useFinanceLedger } from "@/modules/finance/hooks/use-finance-ledger";
export { useFinanceReports } from "@/modules/finance/hooks/use-finance-reports";

export { InvoiceStatusBadge } from "@/modules/finance/components/invoice-status-badge";
export { AccountTypeBadge } from "@/modules/finance/components/account-type-badge";
export { ExpenseCategoryBadge } from "@/modules/finance/components/expense-category-badge";

export {
  registerFinanceAiTools,
  FINANCE_AI_TOOLS,
  buildFinanceAiContext,
  createInvoiceForAi,
  recordExpenseForAi,
  recordPaymentForAi,
  forecastCashFlow,
  detectFinancialAnomalies,
  generateFinancialReports,
  predictRevenue,
  recommendCostSavings,
} from "@/modules/finance/ai";
