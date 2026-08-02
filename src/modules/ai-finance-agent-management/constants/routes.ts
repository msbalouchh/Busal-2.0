import type { FinancePriority } from "@prisma/client";

export const AI_FINANCE_AGENT_ROUTES = {
  dashboard: () => `/app/ai/finance`,
  revenue: () => `/app/ai/finance/revenue`,
  expenses: () => `/app/ai/finance/expenses`,
  profitability: () => `/app/ai/finance/profitability`,
  cashFlow: () => `/app/ai/finance/cash-flow`,
  health: () => `/app/ai/finance/health`,
  recommendations: () => `/app/ai/finance/recommendations`,
  search: () => `/app/ai/finance/search`,
} as const;

export const FINANCE_PRIORITY_OPTIONS: Array<{ value: FinancePriority | "ALL"; label: string }> = [
  { value: "ALL", label: "All priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

export const FINANCE_INSIGHT_CATEGORY_OPTIONS = [
  { value: "ALL", label: "All categories" },
  { value: "revenue", label: "Revenue" },
  { value: "expense", label: "Expense" },
  { value: "profitability", label: "Profitability" },
  { value: "cash_flow", label: "Cash Flow" },
  { value: "budget", label: "Budget" },
  { value: "invoice", label: "Invoice" },
  { value: "payment", label: "Payment" },
  { value: "forecast", label: "Forecast" },
  { value: "cost", label: "Cost Optimization" },
  { value: "risk", label: "Risk" },
  { value: "health", label: "Business Health" },
] as const;

export const FINANCE_AGENT_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: AI_FINANCE_AGENT_ROUTES.dashboard() },
  { id: "revenue", label: "Revenue", href: AI_FINANCE_AGENT_ROUTES.revenue() },
  { id: "expenses", label: "Expenses", href: AI_FINANCE_AGENT_ROUTES.expenses() },
  { id: "profitability", label: "Profitability", href: AI_FINANCE_AGENT_ROUTES.profitability() },
  { id: "cashFlow", label: "Cash Flow", href: AI_FINANCE_AGENT_ROUTES.cashFlow() },
  { id: "health", label: "Financial Health", href: AI_FINANCE_AGENT_ROUTES.health() },
  {
    id: "recommendations",
    label: "Recommendations",
    href: AI_FINANCE_AGENT_ROUTES.recommendations(),
  },
  { id: "search", label: "Search", href: AI_FINANCE_AGENT_ROUTES.search() },
] as const;
