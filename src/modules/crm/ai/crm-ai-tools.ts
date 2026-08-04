import { BUILTIN_AGENT_SLUGS } from "@/modules/ai/constants/agent-slugs";
import {
  PLATFORM_MODULES,
  PLATFORM_TOOL_PERMISSIONS,
} from "@/modules/ai-tools/constants/platform-tools";
import { registerPlatformTool } from "@/modules/ai-tools/registry/platform-tool-registry";
import type { RegisteredPlatformTool } from "@/modules/ai-tools/types/platform-tool";
import {
  buildCustomerAiContext,
  buildCustomerHistorySummary,
  generateMarketingRecommendations,
  searchCustomersForAi,
} from "@/modules/crm/ai/crm-ai-context";
import { buildCrmPlatformContext } from "@/modules/crm/services/crm-platform.service";
import { customerService } from "@/modules/crm/services/customer.service";
import { CRM_AI_TOOL_IDS } from "@/modules/crm/constants/customer-status";
import type { CrmPlatformContext } from "@/modules/crm/types/customer";

function defineCrmTool(
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
      category: "CRM",
      tags: ["crm", "customer"],
      readOnly: false,
      confirmationRequired: false,
      dryRunSupported: true,
      riskLevel: "low",
      ...partial.metadata,
    },
    handler,
  };
}

function resolveAiContext(input: Record<string, unknown>): CrmPlatformContext {
  const businessId = typeof input.businessId === "string" ? input.businessId : "";
  const tenantId = typeof input.tenantId === "string" ? input.tenantId : businessId;
  const workspaceId = typeof input.workspaceId === "string" ? input.workspaceId : businessId;
  const branchId = typeof input.branchId === "string" ? input.branchId : null;
  const userId = typeof input.userId === "string" ? input.userId : "system";

  return buildCrmPlatformContext({
    tenantId,
    workspaceId,
    businessId: businessId || tenantId,
    branchId,
    userId,
  });
}

const CRM_AGENT_SLUGS = [
  BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT,
  BUILTIN_AGENT_SLUGS.SALES,
  BUILTIN_AGENT_SLUGS.CUSTOMER_SUPPORT,
  BUILTIN_AGENT_SLUGS.MARKETING,
  BUILTIN_AGENT_SLUGS.ANALYTICS,
];

export const CRM_AI_TOOLS: RegisteredPlatformTool[] = [
  defineCrmTool(
    {
      id: CRM_AI_TOOL_IDS.SEARCH,
      name: "Search Customer",
      description: "Search customers by name, email, or phone.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.CUSTOMERS_READ],
      requiredModules: [PLATFORM_MODULES.CRM],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string", description: "Search query" } },
      },
      outputSchema: {
        type: "object",
        properties: { customers: { type: "array" }, count: { type: "number" } },
      },
      supportedAgents: CRM_AGENT_SLUGS,
      capabilityId: "capability.crm",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => {
      const query = typeof input.query === "string" ? input.query : "";
      const context = resolveAiContext(input);
      const results = await searchCustomersForAi(query, context);
      return {
        count: results.length,
        customers: results.map((record) => ({
          id: record.customer.id,
          name: record.profile.displayName,
          email: record.profile.email,
          status: record.customer.status,
          lifetimeValuePence: record.analytics.lifetimeValuePence,
        })),
      };
    },
  ),
  defineCrmTool(
    {
      id: CRM_AI_TOOL_IDS.CREATE,
      name: "Create Customer",
      description: "Create a new customer record in CRM.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.CUSTOMERS_MANAGE],
      requiredModules: [PLATFORM_MODULES.CRM],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        required: ["firstName", "lastName"],
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
        },
      },
      outputSchema: {
        type: "object",
        properties: { customerId: { type: "string" }, displayName: { type: "string" } },
      },
      supportedAgents: [BUILTIN_AGENT_SLUGS.SALES, BUILTIN_AGENT_SLUGS.CUSTOMER_SUPPORT],
      capabilityId: "capability.crm",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) => {
      const firstName = typeof input.firstName === "string" ? input.firstName : "Guest";
      const lastName = typeof input.lastName === "string" ? input.lastName : "Customer";
      const context = resolveAiContext(input);
      const record = await customerService.create({
        tenantId: context.tenantId,
        workspaceId: context.workspaceId,
        businessId: context.businessId,
        branchId: context.branchId,
        firstName,
        lastName,
        email: typeof input.email === "string" ? input.email : null,
        phone: typeof input.phone === "string" ? input.phone : null,
      });
      return { customerId: record.customer.id, displayName: record.profile.displayName };
    },
  ),
  defineCrmTool(
    {
      id: CRM_AI_TOOL_IDS.UPDATE,
      name: "Update Customer",
      description: "Update an existing customer profile.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.CUSTOMERS_MANAGE],
      requiredModules: [PLATFORM_MODULES.CRM],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        required: ["customerId"],
        properties: {
          customerId: { type: "string" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          status: { type: "string" },
        },
      },
      outputSchema: {
        type: "object",
        properties: { updated: { type: "boolean" }, customerId: { type: "string" } },
      },
      supportedAgents: [BUILTIN_AGENT_SLUGS.SALES, BUILTIN_AGENT_SLUGS.CUSTOMER_SUPPORT],
      capabilityId: "capability.crm",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) => {
      const customerId = typeof input.customerId === "string" ? input.customerId : "";
      const context = resolveAiContext(input);
      const updated = await customerService.update(
        {
          customerId,
          firstName: typeof input.firstName === "string" ? input.firstName : undefined,
          lastName: typeof input.lastName === "string" ? input.lastName : undefined,
          email: typeof input.email === "string" ? input.email : undefined,
          phone: typeof input.phone === "string" ? input.phone : undefined,
          status:
            typeof input.status === "string"
              ? (input.status as "active" | "inactive" | "prospect" | "vip" | "blocked")
              : undefined,
        },
        context,
      );
      return { updated: Boolean(updated), customerId };
    },
  ),
  defineCrmTool(
    {
      id: CRM_AI_TOOL_IDS.VIEW_HISTORY,
      name: "View Customer History",
      description: "Retrieve customer timeline, communications, and notes.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.CUSTOMERS_READ],
      requiredModules: [PLATFORM_MODULES.CRM],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        required: ["customerId"],
        properties: { customerId: { type: "string" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: CRM_AGENT_SLUGS,
      capabilityId: "capability.crm",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => {
      const customerId = typeof input.customerId === "string" ? input.customerId : "";
      const context = resolveAiContext(input);
      return (
        (await buildCustomerHistorySummary(customerId, context)) ?? {
          error: "Customer not found.",
        }
      );
    },
  ),
  defineCrmTool(
    {
      id: CRM_AI_TOOL_IDS.GENERATE_INSIGHTS,
      name: "Generate Customer Insights",
      description: "Generate AI-ready customer insights and summary.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.CUSTOMERS_READ],
      requiredModules: [PLATFORM_MODULES.CRM],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        required: ["customerId"],
        properties: { customerId: { type: "string" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: [
        BUILTIN_AGENT_SLUGS.ANALYTICS,
        BUILTIN_AGENT_SLUGS.MARKETING,
        BUILTIN_AGENT_SLUGS.SALES,
      ],
      capabilityId: "capability.crm",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => {
      const customerId = typeof input.customerId === "string" ? input.customerId : "";
      const context = resolveAiContext(input);
      const aiContext = await buildCustomerAiContext(customerId, context);
      return (aiContext ?? { error: "Customer not found." }) as Record<string, unknown>;
    },
  ),
  defineCrmTool(
    {
      id: CRM_AI_TOOL_IDS.RECOMMEND_MARKETING,
      name: "Recommend Marketing Actions",
      description: "Recommend marketing actions for a customer.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.MARKETING_READ],
      requiredModules: [PLATFORM_MODULES.CRM, PLATFORM_MODULES.MARKETING],
      requiredTenantScope: "required",
      requiredBranchScope: "none",
      inputSchema: {
        type: "object",
        required: ["customerId"],
        properties: { customerId: { type: "string" } },
      },
      outputSchema: {
        type: "object",
        properties: { recommendations: { type: "array" } },
      },
      supportedAgents: [BUILTIN_AGENT_SLUGS.MARKETING, BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT],
      capabilityId: "capability.crm",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => {
      const customerId = typeof input.customerId === "string" ? input.customerId : "";
      const context = resolveAiContext(input);
      return { recommendations: await generateMarketingRecommendations(customerId, context) };
    },
  ),
];

let registered = false;

/** Registers CRM tools with the AI Tool Platform (idempotent). */
export function registerCrmAiTools(): void {
  if (registered) {
    return;
  }

  for (const tool of CRM_AI_TOOLS) {
    registerPlatformTool(tool);
  }

  registered = true;
}
