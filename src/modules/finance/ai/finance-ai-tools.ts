import "server-only";

import { BUILTIN_AGENT_SLUGS } from "@/modules/ai/constants/agent-slugs";
import { PLATFORM_MODULES } from "@/modules/ai-tools/constants/platform-tools";
import { registerPlatformTool } from "@/modules/ai-tools/registry/platform-tool-registry";
import type {
  PlatformExecutionContext,
  RegisteredPlatformTool,
} from "@/modules/ai-tools/types/platform-tool";
import {
  analyzeExpenses,
  analyzeProfitability,
  createInvoiceForAi,
  detectFinancialAnomalies,
  detectFinancialRisk,
  forecastCashFlow,
  generateFinancialReports,
  predictRevenue,
  recommendBudget,
  recommendCostSavings,
  recordExpenseForAi,
  recordPaymentForAi,
} from "@/modules/finance/ai/finance-ai-context";
import { assertFinanceFeatureAccess } from "@/modules/finance/feature-access/guards/feature.guard";
import { buildFinancePlatformContext } from "@/modules/finance/lib/finance-platform-context";
import {
  EXPENSE_CATEGORIES,
  FINANCE_AI_TOOL_IDS,
  FINANCE_PERMISSIONS,
} from "@/modules/finance/constants/finance-status";
import type { ExpenseCategory } from "@/modules/finance/constants/finance-status";
import type { FinancePlatformContext } from "@/modules/finance/types/finance-platform";

function toFinanceContext(context: PlatformExecutionContext): FinancePlatformContext {
  if (!context.businessId || !context.branchId) {
    throw new Error("Business and branch scope are required for Finance tools");
  }

  return buildFinancePlatformContext({
    tenantId: context.tenantId ?? context.businessId,
    workspaceId: context.workspaceId ?? context.businessId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  });
}

function withFinanceFeatureGuard(handler: RegisteredPlatformTool["handler"]): RegisteredPlatformTool["handler"] {
  return async (input, context) => {
    if (!context.businessId) {
      throw new Error("Business scope is required for Finance tools");
    }

    await assertFinanceFeatureAccess(context.businessId);
    return handler(input, context);
  };
}

function defineFinanceTool(
  partial: Omit<RegisteredPlatformTool, "handler" | "version" | "isEnabled" | "metadata"> & {
    metadata?: Partial<RegisteredPlatformTool["metadata"]>;
  },
  handler: RegisteredPlatformTool["handler"],
): RegisteredPlatformTool {
  return {
    ...partial,
    version: "1.0.0",
    isEnabled: true,
    metadata: {
      category: "Finance",
      tags: ["finance", "accounting", "reports"],
      readOnly: false,
      confirmationRequired: false,
      dryRunSupported: true,
      riskLevel: "low",
      ...partial.metadata,
    },
    handler: withFinanceFeatureGuard(handler),
  };
}

const FINANCE_AGENT_SLUGS = [
  BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT,
  BUILTIN_AGENT_SLUGS.OPERATIONS,
  BUILTIN_AGENT_SLUGS.ANALYTICS,
];

export const FINANCE_AI_TOOLS: RegisteredPlatformTool[] = [
  defineFinanceTool(
    {
      id: FINANCE_AI_TOOL_IDS.CREATE_INVOICE,
      name: "Create Invoice",
      description: "Create a new customer invoice.",
      requiredPermissions: [FINANCE_PERMISSIONS.INVOICE],
      requiredModules: [PLATFORM_MODULES.FINANCE, PLATFORM_MODULES.CRM],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["customerName", "dueDate", "lineItems"],
        properties: {
          customerName: { type: "string" },
          dueDate: { type: "string" },
          lineItems: { type: "array" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: FINANCE_AGENT_SLUGS,
      capabilityId: "capability.finance",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input, context) => {
      const lineItems = Array.isArray(input.lineItems) ? input.lineItems : [];
      const parsed = lineItems
        .filter(
          (item): item is Record<string, unknown> => typeof item === "object" && item !== null,
        )
        .map((item) => ({
          description: typeof item.description === "string" ? item.description : "Service",
          quantity: typeof item.quantity === "number" ? item.quantity : 1,
          unitPriceCents: typeof item.unitPriceCents === "number" ? item.unitPriceCents : 0,
        }));

      return createInvoiceForAi(toFinanceContext(context), {
        customerName: typeof input.customerName === "string" ? input.customerName : "Customer",
        dueDate: typeof input.dueDate === "string" ? input.dueDate : "2026-03-01",
        lineItems: parsed,
      });
    },
  ),
  defineFinanceTool(
    {
      id: FINANCE_AI_TOOL_IDS.RECORD_EXPENSE,
      name: "Record Expense",
      description: "Record a business expense.",
      requiredPermissions: [FINANCE_PERMISSIONS.EXPENSE],
      requiredModules: [PLATFORM_MODULES.FINANCE],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["vendorName", "description", "amountCents"],
        properties: {
          category: { type: "string" },
          vendorName: { type: "string" },
          description: { type: "string" },
          amountCents: { type: "number" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: FINANCE_AGENT_SLUGS,
      capabilityId: "capability.finance",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input, context) => {
      const category =
        typeof input.category === "string" &&
        Object.values(EXPENSE_CATEGORIES).includes(input.category as ExpenseCategory)
          ? (input.category as ExpenseCategory)
          : EXPENSE_CATEGORIES.OTHER;

      return recordExpenseForAi(toFinanceContext(context), {
        category,
        vendorName: typeof input.vendorName === "string" ? input.vendorName : "Vendor",
        description: typeof input.description === "string" ? input.description : "Expense",
        amountCents: typeof input.amountCents === "number" ? input.amountCents : 0,
      });
    },
  ),
  defineFinanceTool(
    {
      id: FINANCE_AI_TOOL_IDS.RECORD_PAYMENT,
      name: "Record Payment",
      description: "Record a payment received.",
      requiredPermissions: [FINANCE_PERMISSIONS.MANAGE],
      requiredModules: [PLATFORM_MODULES.FINANCE],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["amountCents"],
        properties: {
          amountCents: { type: "number" },
          invoiceId: { type: "string" },
          reference: { type: "string" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: FINANCE_AGENT_SLUGS,
      capabilityId: "capability.finance",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input, context) =>
      recordPaymentForAi(toFinanceContext(context), {
        amountCents: typeof input.amountCents === "number" ? input.amountCents : 0,
        invoiceId: typeof input.invoiceId === "string" ? input.invoiceId : undefined,
        reference: typeof input.reference === "string" ? input.reference : undefined,
      }),
  ),
  defineFinanceTool(
    {
      id: FINANCE_AI_TOOL_IDS.FORECAST_CASH_FLOW,
      name: "Forecast Cash Flow",
      description: "Forecast cash flow for upcoming period.",
      requiredPermissions: [FINANCE_PERMISSIONS.ANALYTICS_READ],
      requiredModules: [PLATFORM_MODULES.FINANCE, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: { daysAhead: { type: "number" } } },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.finance",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input, context) => {
      const daysAhead = typeof input.daysAhead === "number" ? input.daysAhead : 30;
      return forecastCashFlow(toFinanceContext(context), daysAhead);
    },
  ),
  defineFinanceTool(
    {
      id: FINANCE_AI_TOOL_IDS.DETECT_ANOMALIES,
      name: "Detect Financial Anomalies",
      description: "Detect unusual expenses and overdue invoices.",
      requiredPermissions: [FINANCE_PERMISSIONS.ANALYTICS_READ],
      requiredModules: [PLATFORM_MODULES.FINANCE, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.finance",
      skillIds: [],
      metadata: { readOnly: true, riskLevel: "medium" },
    },
    async (_input, context) => detectFinancialAnomalies(toFinanceContext(context)),
  ),
  defineFinanceTool(
    {
      id: FINANCE_AI_TOOL_IDS.GENERATE_REPORTS,
      name: "Generate Financial Reports",
      description: "Generate P&L, balance sheet, cash flow, and trial balance.",
      requiredPermissions: [FINANCE_PERMISSIONS.REPORTS],
      requiredModules: [PLATFORM_MODULES.FINANCE, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT],
      capabilityId: "capability.finance",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (_input, context) => generateFinancialReports(toFinanceContext(context)),
  ),
  defineFinanceTool(
    {
      id: FINANCE_AI_TOOL_IDS.PREDICT_REVENUE,
      name: "Predict Revenue",
      description: "Predict revenue for the current financial period.",
      requiredPermissions: [FINANCE_PERMISSIONS.ANALYTICS_READ],
      requiredModules: [PLATFORM_MODULES.FINANCE, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.finance",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (_input, context) => predictRevenue(toFinanceContext(context)),
  ),
  defineFinanceTool(
    {
      id: FINANCE_AI_TOOL_IDS.RECOMMEND_SAVINGS,
      name: "Recommend Cost Savings",
      description: "Recommend cost saving opportunities by category.",
      requiredPermissions: [FINANCE_PERMISSIONS.ANALYTICS_READ],
      requiredModules: [PLATFORM_MODULES.FINANCE, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.finance",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (_input, context) => recommendCostSavings(toFinanceContext(context)),
  ),
  defineFinanceTool(
    {
      id: FINANCE_AI_TOOL_IDS.ANALYZE_EXPENSES,
      name: "Analyze Expenses",
      description: "Analyze expense breakdown and anomalies.",
      requiredPermissions: [FINANCE_PERMISSIONS.ANALYTICS_READ],
      requiredModules: [PLATFORM_MODULES.FINANCE, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: FINANCE_AGENT_SLUGS,
      capabilityId: "capability.finance",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (_input, context) => analyzeExpenses(toFinanceContext(context)),
  ),
  defineFinanceTool(
    {
      id: FINANCE_AI_TOOL_IDS.ANALYZE_PROFITABILITY,
      name: "Analyze Profitability",
      description: "Analyze profit margins and P&L performance.",
      requiredPermissions: [FINANCE_PERMISSIONS.ANALYTICS_READ],
      requiredModules: [PLATFORM_MODULES.FINANCE, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: FINANCE_AGENT_SLUGS,
      capabilityId: "capability.finance",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (_input, context) => analyzeProfitability(toFinanceContext(context)),
  ),
  defineFinanceTool(
    {
      id: FINANCE_AI_TOOL_IDS.RECOMMEND_BUDGET,
      name: "Recommend Budget",
      description: "Recommend budget allocations by expense category.",
      requiredPermissions: [FINANCE_PERMISSIONS.ANALYTICS_READ],
      requiredModules: [PLATFORM_MODULES.FINANCE, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: FINANCE_AGENT_SLUGS,
      capabilityId: "capability.finance",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (_input, context) => recommendBudget(toFinanceContext(context)),
  ),
  defineFinanceTool(
    {
      id: FINANCE_AI_TOOL_IDS.DETECT_FINANCIAL_RISK,
      name: "Detect Financial Risk",
      description: "Detect financial risk indicators and cash flow concerns.",
      requiredPermissions: [FINANCE_PERMISSIONS.ANALYTICS_READ],
      requiredModules: [PLATFORM_MODULES.FINANCE, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: FINANCE_AGENT_SLUGS,
      capabilityId: "capability.finance",
      skillIds: [],
      metadata: { readOnly: true, riskLevel: "medium" },
    },
    async (_input, context) => detectFinancialRisk(toFinanceContext(context)),
  ),
];

let registered = false;

/** Registers Finance platform tools with the AI Tool Platform (idempotent). */
export function registerFinanceAiTools(): void {
  if (registered) {
    return;
  }

  for (const tool of FINANCE_AI_TOOLS) {
    registerPlatformTool(tool);
  }

  registered = true;
}
