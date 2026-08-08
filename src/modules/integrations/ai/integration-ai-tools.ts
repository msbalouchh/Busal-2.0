import "server-only";

import { BUILTIN_AGENT_SLUGS } from "@/modules/ai/constants/agent-slugs";
import { PLATFORM_MODULES } from "@/modules/ai-tools/constants/platform-tools";
import { registerPlatformTool } from "@/modules/ai-tools/registry/platform-tool-registry";
import type {
  PlatformExecutionContext,
  RegisteredPlatformTool,
} from "@/modules/ai-tools/types/platform-tool";
import {
  analyzeApiUsageForAi,
  analyzeWebhookFailuresForAi,
  detectFailedWebhooksForAi,
  explainApiErrorsForAi,
  generateApiKeyForAi,
  generateIntegrationMappingForAi,
  monitorApiHealthForAi,
  optimizeApiUsageForAi,
  recommendIntegrationForAi,
  recommendRateLimitsForAi,
  suggestRetryForAi,
} from "@/modules/integrations/ai/integration-ai-context";
import {
  INTEGRATION_AI_TOOL_IDS,
  INTEGRATION_CATEGORIES,
  INTEGRATION_PERMISSIONS,
} from "@/modules/integrations/constants/integration-status";
import { toIntegrationPlatformContext } from "@/modules/integrations/lib/integration-scope";
import type { IntegrationCategory } from "@/modules/integrations/constants/integration-status";
import type { IntegrationPlatformContext } from "@/modules/integrations/types/integration-platform";

function toIntegrationContext(context: PlatformExecutionContext): IntegrationPlatformContext {
  if (!context.businessId || !context.branchId) {
    throw new Error("Business and branch scope are required for Integration tools");
  }

  return toIntegrationPlatformContext({
    tenantId: context.tenantId ?? context.businessId,
    workspaceId: context.workspaceId ?? context.businessId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  });
}

function defineIntegrationTool(
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
      category: "Integrations",
      tags: ["integrations", "api", "webhooks", "developer"],
      readOnly: false,
      confirmationRequired: false,
      dryRunSupported: true,
      riskLevel: "low",
      ...partial.metadata,
    },
    handler,
  };
}

const INTEGRATION_AGENT_SLUGS = [
  BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT,
  BUILTIN_AGENT_SLUGS.OPERATIONS,
  BUILTIN_AGENT_SLUGS.ANALYTICS,
];

const ALL_CATEGORIES = Object.values(INTEGRATION_CATEGORIES);

function parseCategory(value: unknown): IntegrationCategory | undefined {
  if (typeof value === "string" && ALL_CATEGORIES.includes(value as IntegrationCategory)) {
    return value as IntegrationCategory;
  }
  return undefined;
}

export const INTEGRATION_AI_TOOLS: RegisteredPlatformTool[] = [
  defineIntegrationTool(
    {
      id: INTEGRATION_AI_TOOL_IDS.RECOMMEND_INTEGRATION,
      name: "Recommend Integration",
      description: "Recommend a third-party integration for a category.",
      requiredPermissions: [INTEGRATION_PERMISSIONS.READ],
      requiredModules: ["integrations", PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: { category: { type: "string" } } },
      outputSchema: { type: "object" },
      supportedAgents: INTEGRATION_AGENT_SLUGS,
      capabilityId: "capability.integrations",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input, context) =>
      recommendIntegrationForAi(toIntegrationContext(context), { category: parseCategory(input.category) }),
  ),
  defineIntegrationTool(
    {
      id: INTEGRATION_AI_TOOL_IDS.GENERATE_API_KEY,
      name: "Generate API Key",
      description: "Generate a new API key with specified scopes.",
      requiredPermissions: [INTEGRATION_PERMISSIONS.API_KEY],
      requiredModules: ["integrations"],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        required: ["name"],
        properties: { name: { type: "string" }, scopes: { type: "array" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: INTEGRATION_AGENT_SLUGS,
      capabilityId: "capability.integrations",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input, context) =>
      generateApiKeyForAi(toIntegrationContext(context), {
        name: typeof input.name === "string" ? input.name : "API Key",
        scopes: Array.isArray(input.scopes)
          ? input.scopes.filter((scope): scope is string => typeof scope === "string")
          : undefined,
      }),
  ),
  defineIntegrationTool(
    {
      id: INTEGRATION_AI_TOOL_IDS.ANALYZE_API_USAGE,
      name: "Analyze API Usage",
      description: "Analyze API usage patterns and error rates.",
      requiredPermissions: [INTEGRATION_PERMISSIONS.ANALYTICS_READ],
      requiredModules: ["integrations", PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.integrations",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (_input, context) => analyzeApiUsageForAi(toIntegrationContext(context)),
  ),
  defineIntegrationTool(
    {
      id: INTEGRATION_AI_TOOL_IDS.DETECT_FAILED_WEBHOOKS,
      name: "Detect Failed Webhooks",
      description: "Detect failed and retrying webhook deliveries.",
      requiredPermissions: [INTEGRATION_PERMISSIONS.WEBHOOK],
      requiredModules: ["integrations"],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: INTEGRATION_AGENT_SLUGS,
      capabilityId: "capability.integrations",
      skillIds: [],
      metadata: { readOnly: true, riskLevel: "medium" },
    },
    async (_input, context) => detectFailedWebhooksForAi(toIntegrationContext(context)),
  ),
  defineIntegrationTool(
    {
      id: INTEGRATION_AI_TOOL_IDS.SUGGEST_RETRY,
      name: "Suggest Retry",
      description: "Suggest retry strategy for failed webhook delivery.",
      requiredPermissions: [INTEGRATION_PERMISSIONS.WEBHOOK],
      requiredModules: ["integrations"],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: { eventId: { type: "string" } } },
      outputSchema: { type: "object" },
      supportedAgents: INTEGRATION_AGENT_SLUGS,
      capabilityId: "capability.integrations",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input, context) =>
      suggestRetryForAi(toIntegrationContext(context), {
        eventId: typeof input.eventId === "string" ? input.eventId : undefined,
      }),
  ),
  defineIntegrationTool(
    {
      id: INTEGRATION_AI_TOOL_IDS.EXPLAIN_API_ERRORS,
      name: "Explain API Errors",
      description: "Explain API error responses and suggest fixes.",
      requiredPermissions: [INTEGRATION_PERMISSIONS.READ],
      requiredModules: ["integrations"],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: { requestId: { type: "string" } } },
      outputSchema: { type: "object" },
      supportedAgents: INTEGRATION_AGENT_SLUGS,
      capabilityId: "capability.integrations",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input, context) =>
      explainApiErrorsForAi(toIntegrationContext(context), {
        requestId: typeof input.requestId === "string" ? input.requestId : undefined,
      }),
  ),
  defineIntegrationTool(
    {
      id: INTEGRATION_AI_TOOL_IDS.RECOMMEND_RATE_LIMITS,
      name: "Recommend Rate Limits",
      description: "Recommend API rate limits based on usage patterns.",
      requiredPermissions: [INTEGRATION_PERMISSIONS.ANALYTICS_READ],
      requiredModules: ["integrations", PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.integrations",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (_input, context) => recommendRateLimitsForAi(toIntegrationContext(context)),
  ),
  defineIntegrationTool(
    {
      id: INTEGRATION_AI_TOOL_IDS.GENERATE_MAPPING,
      name: "Generate Integration Mapping",
      description: "Generate field mapping between Busal and external entities.",
      requiredPermissions: [INTEGRATION_PERMISSIONS.MANAGE],
      requiredModules: ["integrations"],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        required: ["integrationId", "sourceEntity", "targetEntity"],
        properties: {
          integrationId: { type: "string" },
          sourceEntity: { type: "string" },
          targetEntity: { type: "string" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: INTEGRATION_AGENT_SLUGS,
      capabilityId: "capability.integrations",
      skillIds: [],
      metadata: { confirmationRequired: true },
    },
    async (input, context) =>
      generateIntegrationMappingForAi(toIntegrationContext(context), {
        integrationId: typeof input.integrationId === "string" ? input.integrationId : "",
        sourceEntity: typeof input.sourceEntity === "string" ? input.sourceEntity : "",
        targetEntity: typeof input.targetEntity === "string" ? input.targetEntity : "",
      }),
  ),
  defineIntegrationTool(
    {
      id: INTEGRATION_AI_TOOL_IDS.OPTIMIZE_API_USAGE,
      name: "Optimize API Usage",
      description: "Recommend optimizations for API usage patterns.",
      requiredPermissions: [INTEGRATION_PERMISSIONS.ANALYTICS_READ],
      requiredModules: ["integrations", PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: INTEGRATION_AGENT_SLUGS,
      capabilityId: "capability.integrations",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (_input, context) => optimizeApiUsageForAi(toIntegrationContext(context)),
  ),
  defineIntegrationTool(
    {
      id: INTEGRATION_AI_TOOL_IDS.API_HEALTH_MONITORING,
      name: "API Health Monitoring",
      description: "Monitor integration and API health across the tenant.",
      requiredPermissions: [INTEGRATION_PERMISSIONS.READ],
      requiredModules: ["integrations"],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: INTEGRATION_AGENT_SLUGS,
      capabilityId: "capability.integrations",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (_input, context) => monitorApiHealthForAi(toIntegrationContext(context)),
  ),
  defineIntegrationTool(
    {
      id: INTEGRATION_AI_TOOL_IDS.WEBHOOK_FAILURE_ANALYSIS,
      name: "Webhook Failure Analysis",
      description: "Analyze webhook delivery failures and remediation steps.",
      requiredPermissions: [INTEGRATION_PERMISSIONS.WEBHOOK],
      requiredModules: ["integrations"],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: INTEGRATION_AGENT_SLUGS,
      capabilityId: "capability.integrations",
      skillIds: [],
      metadata: { readOnly: true, riskLevel: "medium" },
    },
    async (_input, context) => analyzeWebhookFailuresForAi(toIntegrationContext(context)),
  ),
];

let registered = false;

/** Registers Integration platform tools with the AI Tool Platform (idempotent). */
export function registerIntegrationAiTools(): void {
  if (registered) {
    return;
  }

  for (const tool of INTEGRATION_AI_TOOLS) {
    registerPlatformTool(tool);
  }

  registered = true;
}
