import "server-only";

import { BUILTIN_AGENT_SLUGS } from "@/modules/ai/constants/agent-slugs";
import { PLATFORM_MODULES } from "@/modules/ai-tools/constants/platform-tools";
import { registerPlatformTool } from "@/modules/ai-tools/registry/platform-tool-registry";
import type {
  PlatformExecutionContext,
  RegisteredPlatformTool,
} from "@/modules/ai-tools/types/platform-tool";
import {
  buildAnalyticsAiContext,
  businessHealthScoreForAi,
  churnPredictionForAi,
  compareBranchesForAi,
  customerInsightsForAi,
  detectBusinessAnomaliesForAi,
  explainKpiForAi,
  financialForecastForAi,
  forecastDemandForAi,
  forecastRevenueForAi,
  generateExecutiveSummaryForAi,
  generateReportForAi,
  inventoryForecastForAi,
  recommendImprovementsForAi,
  staffingRecommendationsForAi,
} from "@/modules/analytics/ai/analytics-ai-context";
import {
  ANALYTICS_AI_TOOL_IDS,
  ANALYTICS_MODULE_SOURCES,
  ANALYTICS_PERMISSIONS,
} from "@/modules/analytics/constants/analytics-status";
import type { AnalyticsModuleSource } from "@/modules/analytics/constants/analytics-status";
import { buildAnalyticsPlatformContext } from "@/modules/analytics/lib/analytics-platform-context";
import type { AnalyticsPlatformContext } from "@/modules/analytics/types/analytics-platform";

function toAnalyticsContext(context: PlatformExecutionContext): AnalyticsPlatformContext {
  if (!context.businessId || !context.branchId) {
    throw new Error("Business and branch scope are required for Analytics tools");
  }

  return buildAnalyticsPlatformContext({
    tenantId: context.tenantId ?? context.businessId,
    workspaceId: context.workspaceId ?? context.businessId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  });
}

function defineAnalyticsTool(
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
      category: "Analytics",
      tags: ["analytics", "reports", "bi", "kpi"],
      readOnly: false,
      confirmationRequired: false,
      dryRunSupported: true,
      riskLevel: "low",
      ...partial.metadata,
    },
    handler,
  };
}

const ANALYTICS_AGENT_SLUGS = [
  BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT,
  BUILTIN_AGENT_SLUGS.OPERATIONS,
  BUILTIN_AGENT_SLUGS.ANALYTICS,
];

const ALL_MODULE_SOURCES = Object.values(ANALYTICS_MODULE_SOURCES);

function parseModuleSources(value: unknown): AnalyticsModuleSource[] {
  if (!Array.isArray(value)) {
    return [ANALYTICS_MODULE_SOURCES.ORDERS, ANALYTICS_MODULE_SOURCES.FINANCE];
  }

  return value.filter(
    (item): item is AnalyticsModuleSource =>
      typeof item === "string" && ALL_MODULE_SOURCES.includes(item as AnalyticsModuleSource),
  );
}

export const ANALYTICS_AI_TOOLS: RegisteredPlatformTool[] = [
  defineAnalyticsTool(
    {
      id: ANALYTICS_AI_TOOL_IDS.GENERATE_REPORT,
      name: "Generate Report",
      description: "Generate a cross-module analytics report.",
      requiredPermissions: [ANALYTICS_PERMISSIONS.REPORT],
      requiredModules: [PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", required: ["name"], properties: { name: { type: "string" }, moduleSources: { type: "array" } } },
      outputSchema: { type: "object" },
      supportedAgents: ANALYTICS_AGENT_SLUGS,
      capabilityId: "capability.analytics",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input, context) =>
      generateReportForAi(toAnalyticsContext(context), {
        name: typeof input.name === "string" ? input.name : "Analytics Report",
        moduleSources: parseModuleSources(input.moduleSources),
      }),
  ),
  defineAnalyticsTool(
    {
      id: ANALYTICS_AI_TOOL_IDS.EXPLAIN_KPI,
      name: "Explain KPI",
      description: "Explain a key performance indicator and its trend.",
      requiredPermissions: [ANALYTICS_PERMISSIONS.READ],
      requiredModules: [PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: { kpiKey: { type: "string" } } },
      outputSchema: { type: "object" },
      supportedAgents: ANALYTICS_AGENT_SLUGS,
      capabilityId: "capability.analytics",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input, context) =>
      explainKpiForAi(toAnalyticsContext(context), {
        kpiKey: typeof input.kpiKey === "string" ? input.kpiKey : undefined,
      }),
  ),
  defineAnalyticsTool(
    {
      id: ANALYTICS_AI_TOOL_IDS.FORECAST_REVENUE,
      name: "Forecast Revenue",
      description: "Forecast revenue for upcoming periods.",
      requiredPermissions: [ANALYTICS_PERMISSIONS.READ],
      requiredModules: [PLATFORM_MODULES.ANALYTICS, PLATFORM_MODULES.FINANCE],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: { periodsAhead: { type: "number" } } },
      outputSchema: { type: "object" },
      supportedAgents: ANALYTICS_AGENT_SLUGS,
      capabilityId: "capability.analytics",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input, context) =>
      forecastRevenueForAi(toAnalyticsContext(context), {
        periodsAhead: typeof input.periodsAhead === "number" ? input.periodsAhead : 4,
      }),
  ),
  defineAnalyticsTool(
    {
      id: ANALYTICS_AI_TOOL_IDS.FORECAST_DEMAND,
      name: "Forecast Demand",
      description: "Forecast order demand for upcoming periods.",
      requiredPermissions: [ANALYTICS_PERMISSIONS.READ],
      requiredModules: [PLATFORM_MODULES.ANALYTICS, PLATFORM_MODULES.ORDERS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: { periodsAhead: { type: "number" } } },
      outputSchema: { type: "object" },
      supportedAgents: ANALYTICS_AGENT_SLUGS,
      capabilityId: "capability.analytics",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input, context) =>
      forecastDemandForAi(toAnalyticsContext(context), {
        periodsAhead: typeof input.periodsAhead === "number" ? input.periodsAhead : 7,
      }),
  ),
  defineAnalyticsTool(
    {
      id: ANALYTICS_AI_TOOL_IDS.DETECT_ANOMALIES,
      name: "Detect Business Anomalies",
      description: "Detect anomalies and active alerts across all modules.",
      requiredPermissions: [ANALYTICS_PERMISSIONS.ALERT],
      requiredModules: [PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: ANALYTICS_AGENT_SLUGS,
      capabilityId: "capability.analytics",
      skillIds: [],
      metadata: { readOnly: true, riskLevel: "medium" },
    },
    async (_input, context) => detectBusinessAnomaliesForAi(toAnalyticsContext(context)),
  ),
  defineAnalyticsTool(
    {
      id: ANALYTICS_AI_TOOL_IDS.RECOMMEND_IMPROVEMENTS,
      name: "Recommend Improvements",
      description: "Recommend business improvements based on benchmarks and insights.",
      requiredPermissions: [ANALYTICS_PERMISSIONS.READ],
      requiredModules: [PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: ANALYTICS_AGENT_SLUGS,
      capabilityId: "capability.analytics",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (_input, context) => recommendImprovementsForAi(toAnalyticsContext(context)),
  ),
  defineAnalyticsTool(
    {
      id: ANALYTICS_AI_TOOL_IDS.EXECUTIVE_SUMMARY,
      name: "Generate Executive Summary",
      description: "Generate an executive summary of business performance.",
      requiredPermissions: [ANALYTICS_PERMISSIONS.READ],
      requiredModules: [PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: ANALYTICS_AGENT_SLUGS,
      capabilityId: "capability.analytics",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (_input, context) => generateExecutiveSummaryForAi(toAnalyticsContext(context)),
  ),
  defineAnalyticsTool(
    {
      id: ANALYTICS_AI_TOOL_IDS.COMPARE_BRANCHES,
      name: "Compare Branches",
      description: "Compare metrics and benchmarks across branches.",
      requiredPermissions: [ANALYTICS_PERMISSIONS.BENCHMARK],
      requiredModules: [PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: { type: "object", properties: { branchIds: { type: "array" }, metricKeys: { type: "array" } } },
      outputSchema: { type: "object" },
      supportedAgents: ANALYTICS_AGENT_SLUGS,
      capabilityId: "capability.analytics",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input, context) =>
      compareBranchesForAi(toAnalyticsContext(context), {
        branchIds: Array.isArray(input.branchIds)
          ? input.branchIds.filter((id): id is string => typeof id === "string")
          : undefined,
        metricKeys: Array.isArray(input.metricKeys)
          ? input.metricKeys.filter((key): key is string => typeof key === "string")
          : undefined,
      }),
  ),
  defineAnalyticsTool(
    {
      id: ANALYTICS_AI_TOOL_IDS.CUSTOMER_INSIGHTS,
      name: "Customer Insights",
      description: "Analyze customer segments, retention, and lifetime value.",
      requiredPermissions: [ANALYTICS_PERMISSIONS.READ],
      requiredModules: [PLATFORM_MODULES.ANALYTICS, PLATFORM_MODULES.CRM],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: ANALYTICS_AGENT_SLUGS,
      capabilityId: "capability.analytics",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (_input, context) => customerInsightsForAi(toAnalyticsContext(context)),
  ),
  defineAnalyticsTool(
    {
      id: ANALYTICS_AI_TOOL_IDS.CHURN_PREDICTION,
      name: "Churn Prediction",
      description: "Predict customer churn risk from retention signals.",
      requiredPermissions: [ANALYTICS_PERMISSIONS.READ],
      requiredModules: [PLATFORM_MODULES.ANALYTICS, PLATFORM_MODULES.CRM],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: ANALYTICS_AGENT_SLUGS,
      capabilityId: "capability.analytics",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (_input, context) => churnPredictionForAi(toAnalyticsContext(context)),
  ),
  defineAnalyticsTool(
    {
      id: ANALYTICS_AI_TOOL_IDS.INVENTORY_FORECAST,
      name: "Inventory Forecast",
      description: "Forecast inventory demand and low-stock risk.",
      requiredPermissions: [ANALYTICS_PERMISSIONS.READ],
      requiredModules: [PLATFORM_MODULES.ANALYTICS, PLATFORM_MODULES.INVENTORY],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: ANALYTICS_AGENT_SLUGS,
      capabilityId: "capability.analytics",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (_input, context) => inventoryForecastForAi(toAnalyticsContext(context)),
  ),
  defineAnalyticsTool(
    {
      id: ANALYTICS_AI_TOOL_IDS.STAFFING_RECOMMENDATIONS,
      name: "Staffing Recommendations",
      description: "Recommend staffing levels based on demand and labour cost.",
      requiredPermissions: [ANALYTICS_PERMISSIONS.READ],
      requiredModules: [PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: ANALYTICS_AGENT_SLUGS,
      capabilityId: "capability.analytics",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (_input, context) => staffingRecommendationsForAi(toAnalyticsContext(context)),
  ),
  defineAnalyticsTool(
    {
      id: ANALYTICS_AI_TOOL_IDS.FINANCIAL_FORECAST,
      name: "Financial Forecast",
      description: "Forecast revenue, expenses, and net profit.",
      requiredPermissions: [ANALYTICS_PERMISSIONS.READ],
      requiredModules: [PLATFORM_MODULES.ANALYTICS, PLATFORM_MODULES.FINANCE],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: ANALYTICS_AGENT_SLUGS,
      capabilityId: "capability.analytics",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (_input, context) => financialForecastForAi(toAnalyticsContext(context)),
  ),
  defineAnalyticsTool(
    {
      id: ANALYTICS_AI_TOOL_IDS.BUSINESS_HEALTH_SCORE,
      name: "Business Health Score",
      description: "Calculate an overall business health score.",
      requiredPermissions: [ANALYTICS_PERMISSIONS.READ],
      requiredModules: [PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: ANALYTICS_AGENT_SLUGS,
      capabilityId: "capability.analytics",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (_input, context) => businessHealthScoreForAi(toAnalyticsContext(context)),
  ),
];

let registered = false;

/** Registers Analytics platform tools with the AI Tool Platform (idempotent). */
export function registerAnalyticsAiTools(): void {
  if (registered) {
    return;
  }

  for (const tool of ANALYTICS_AI_TOOLS) {
    registerPlatformTool(tool);
  }

  registered = true;
}

export { buildAnalyticsAiContext };
