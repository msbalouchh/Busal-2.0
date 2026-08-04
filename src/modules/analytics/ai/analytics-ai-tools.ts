import { BUILTIN_AGENT_SLUGS } from "@/modules/ai/constants/agent-slugs";
import { PLATFORM_MODULES } from "@/modules/ai-tools/constants/platform-tools";
import { registerPlatformTool } from "@/modules/ai-tools/registry/platform-tool-registry";
import type { RegisteredPlatformTool } from "@/modules/ai-tools/types/platform-tool";
import {
  compareBranchesForAi,
  detectBusinessAnomaliesForAi,
  explainKpiForAi,
  forecastDemandForAi,
  forecastRevenueForAi,
  generateExecutiveSummaryForAi,
  generateReportForAi,
  recommendImprovementsForAi,
} from "@/modules/analytics/ai/analytics-ai-context";
import {
  ANALYTICS_AI_TOOL_IDS,
  ANALYTICS_MODULE_SOURCES,
  ANALYTICS_PERMISSIONS,
} from "@/modules/analytics/constants/analytics-status";
import type { AnalyticsModuleSource } from "@/modules/analytics/constants/analytics-status";

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
      inputSchema: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          moduleSources: { type: "array" },
          periodStart: { type: "string" },
          periodEnd: { type: "string" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: ANALYTICS_AGENT_SLUGS,
      capabilityId: "capability.analytics",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) =>
      generateReportForAi({
        name: typeof input.name === "string" ? input.name : "Analytics Report",
        moduleSources: parseModuleSources(input.moduleSources),
        periodStart: typeof input.periodStart === "string" ? input.periodStart : undefined,
        periodEnd: typeof input.periodEnd === "string" ? input.periodEnd : undefined,
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
      inputSchema: {
        type: "object",
        properties: { kpiKey: { type: "string" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: ANALYTICS_AGENT_SLUGS,
      capabilityId: "capability.analytics",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) =>
      explainKpiForAi({
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
      inputSchema: {
        type: "object",
        properties: { periodsAhead: { type: "number" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.analytics",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) =>
      forecastRevenueForAi({
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
      inputSchema: {
        type: "object",
        properties: { periodsAhead: { type: "number" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.analytics",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) =>
      forecastDemandForAi({
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
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.analytics",
      skillIds: [],
      metadata: { readOnly: true, riskLevel: "medium" },
    },
    async () => detectBusinessAnomaliesForAi(),
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
    async () => recommendImprovementsForAi(),
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
      supportedAgents: [BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT, BUILTIN_AGENT_SLUGS.ANALYTICS],
      capabilityId: "capability.analytics",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async () => generateExecutiveSummaryForAi(),
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
      inputSchema: {
        type: "object",
        properties: {
          branchIds: { type: "array" },
          metricKeys: { type: "array" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.analytics",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) =>
      compareBranchesForAi({
        branchIds: Array.isArray(input.branchIds)
          ? input.branchIds.filter((id): id is string => typeof id === "string")
          : undefined,
        metricKeys: Array.isArray(input.metricKeys)
          ? input.metricKeys.filter((key): key is string => typeof key === "string")
          : undefined,
      }),
  ),
];

let registered = false;

/** Registers Analytics platform tools with the AI Tool Platform (mock, idempotent). */
export function registerAnalyticsAiTools(): void {
  if (registered) {
    return;
  }

  for (const tool of ANALYTICS_AI_TOOLS) {
    registerPlatformTool(tool);
  }

  registered = true;
}
