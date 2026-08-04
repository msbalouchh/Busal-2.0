import { BUILTIN_AGENT_SLUGS } from "@/modules/ai/constants/agent-slugs";
import { PLATFORM_MODULES } from "@/modules/ai-tools/constants/platform-tools";
import { registerPlatformTool } from "@/modules/ai-tools/registry/platform-tool-registry";
import type { RegisteredPlatformTool } from "@/modules/ai-tools/types/platform-tool";
import {
  analyzeRevenueForAi,
  detectFailedPaymentsForAi,
  downgradeSubscriptionForAi,
  forecastMrrForAi,
  predictChurnForAi,
  recommendPlanForAi,
  recommendPricingForAi,
  upgradeSubscriptionForAi,
} from "@/modules/billing/ai/billing-ai-context";
import {
  BILLING_AI_TOOL_IDS,
  BILLING_PERMISSIONS,
} from "@/modules/billing/constants/billing-status";

const BILLING_MODULE = "billing";

function defineBillingTool(
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
      category: "Billing",
      tags: ["billing", "subscription", "saas"],
      readOnly: false,
      confirmationRequired: false,
      dryRunSupported: true,
      riskLevel: "low",
      ...partial.metadata,
    },
    handler,
  };
}

const BILLING_AGENT_SLUGS = [
  BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT,
  BUILTIN_AGENT_SLUGS.OPERATIONS,
  BUILTIN_AGENT_SLUGS.ANALYTICS,
];

export const BILLING_AI_TOOLS: RegisteredPlatformTool[] = [
  defineBillingTool(
    {
      id: BILLING_AI_TOOL_IDS.RECOMMEND_PLAN,
      name: "Recommend Plan",
      description: "Recommend the optimal subscription plan based on usage.",
      requiredPermissions: [BILLING_PERMISSIONS.READ],
      requiredModules: [BILLING_MODULE, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: BILLING_AGENT_SLUGS,
      capabilityId: "capability.billing",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async () => recommendPlanForAi(),
  ),
  defineBillingTool(
    {
      id: BILLING_AI_TOOL_IDS.UPGRADE_SUBSCRIPTION,
      name: "Upgrade Subscription",
      description: "Upgrade workspace subscription to a higher plan.",
      requiredPermissions: [BILLING_PERMISSIONS.SUBSCRIBE],
      requiredModules: [BILLING_MODULE],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        required: ["targetPlanId"],
        properties: {
          targetPlanId: { type: "string" },
          prorate: { type: "boolean" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: BILLING_AGENT_SLUGS,
      capabilityId: "capability.billing",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) =>
      upgradeSubscriptionForAi({
        targetPlanId: typeof input.targetPlanId === "string" ? input.targetPlanId : "",
        prorate: typeof input.prorate === "boolean" ? input.prorate : true,
      }),
  ),
  defineBillingTool(
    {
      id: BILLING_AI_TOOL_IDS.DOWNGRADE_SUBSCRIPTION,
      name: "Downgrade Subscription",
      description: "Downgrade workspace subscription to a lower plan.",
      requiredPermissions: [BILLING_PERMISSIONS.SUBSCRIBE],
      requiredModules: [BILLING_MODULE],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        required: ["targetPlanId"],
        properties: {
          targetPlanId: { type: "string" },
          effectiveAt: { type: "string" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: BILLING_AGENT_SLUGS,
      capabilityId: "capability.billing",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) =>
      downgradeSubscriptionForAi({
        targetPlanId: typeof input.targetPlanId === "string" ? input.targetPlanId : "",
        effectiveAt:
          input.effectiveAt === "immediate" || input.effectiveAt === "period_end"
            ? input.effectiveAt
            : "period_end",
      }),
  ),
  defineBillingTool(
    {
      id: BILLING_AI_TOOL_IDS.PREDICT_CHURN,
      name: "Predict Churn",
      description: "Predict subscription churn risk for the workspace.",
      requiredPermissions: [BILLING_PERMISSIONS.ANALYTICS_READ],
      requiredModules: [BILLING_MODULE, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.billing",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async () => predictChurnForAi(),
  ),
  defineBillingTool(
    {
      id: BILLING_AI_TOOL_IDS.FORECAST_MRR,
      name: "Forecast MRR",
      description: "Forecast monthly recurring revenue for upcoming months.",
      requiredPermissions: [BILLING_PERMISSIONS.ANALYTICS_READ],
      requiredModules: [BILLING_MODULE, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        properties: { monthsAhead: { type: "number" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.billing",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) =>
      forecastMrrForAi({
        monthsAhead: typeof input.monthsAhead === "number" ? input.monthsAhead : 3,
      }),
  ),
  defineBillingTool(
    {
      id: BILLING_AI_TOOL_IDS.ANALYZE_REVENUE,
      name: "Analyze Revenue",
      description: "Analyze subscription revenue metrics.",
      requiredPermissions: [BILLING_PERMISSIONS.ANALYTICS_READ],
      requiredModules: [BILLING_MODULE, PLATFORM_MODULES.ANALYTICS, PLATFORM_MODULES.FINANCE],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT],
      capabilityId: "capability.billing",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async () => analyzeRevenueForAi(),
  ),
  defineBillingTool(
    {
      id: BILLING_AI_TOOL_IDS.RECOMMEND_PRICING,
      name: "Recommend Pricing",
      description: "Recommend pricing optimizations for the current plan.",
      requiredPermissions: [BILLING_PERMISSIONS.ANALYTICS_READ],
      requiredModules: [BILLING_MODULE, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT],
      capabilityId: "capability.billing",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async () => recommendPricingForAi(),
  ),
  defineBillingTool(
    {
      id: BILLING_AI_TOOL_IDS.DETECT_FAILED_PAYMENTS,
      name: "Detect Failed Payments",
      description: "Detect and summarize failed subscription payments.",
      requiredPermissions: [BILLING_PERMISSIONS.INVOICE],
      requiredModules: [BILLING_MODULE, PLATFORM_MODULES.FINANCE],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: BILLING_AGENT_SLUGS,
      capabilityId: "capability.billing",
      skillIds: [],
      metadata: { readOnly: true, riskLevel: "medium" },
    },
    async () => detectFailedPaymentsForAi(),
  ),
];

let registered = false;

/** Registers Billing platform tools with the AI Tool Platform (mock, idempotent). */
export function registerBillingAiTools(): void {
  if (registered) {
    return;
  }

  for (const tool of BILLING_AI_TOOLS) {
    registerPlatformTool(tool);
  }

  registered = true;
}
