import { BUILTIN_AGENT_SLUGS } from "@/modules/ai/constants/agent-slugs";
import {
  PLATFORM_MODULES,
  PLATFORM_TOOL_PERMISSIONS,
} from "@/modules/ai-tools/constants/platform-tools";
import { registerPlatformTool } from "@/modules/ai-tools/registry/platform-tool-registry";
import type { RegisteredPlatformTool } from "@/modules/ai-tools/types/platform-tool";
import {
  applyDiscountForAi,
  createSaleForAi,
  detectSuspiciousRefunds,
  forecastRevenue,
  predictBusyHours,
  recommendUpsells,
  splitBillForAi,
  suggestPromotions,
} from "@/modules/pos/ai/pos-ai-context";
import { POS_AI_TOOL_IDS } from "@/modules/pos/constants/pos-status";

function definePosTool(
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
      category: "POS",
      tags: ["pos", "sales", "payments"],
      readOnly: false,
      confirmationRequired: false,
      dryRunSupported: true,
      riskLevel: "low",
      ...partial.metadata,
    },
    handler,
  };
}

const POS_AGENT_SLUGS = [
  BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT,
  BUILTIN_AGENT_SLUGS.OPERATIONS,
  BUILTIN_AGENT_SLUGS.ANALYTICS,
  BUILTIN_AGENT_SLUGS.MARKETING,
];

export const POS_AI_TOOLS: RegisteredPlatformTool[] = [
  definePosTool(
    {
      id: POS_AI_TOOL_IDS.CREATE_SALE,
      name: "Create Sale",
      description: "Create a new POS sale with items.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.POS_MANAGE],
      requiredModules: [PLATFORM_MODULES.POS, PLATFORM_MODULES.ORDERS],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["items"],
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                menuItemId: { type: "string" },
                name: { type: "string" },
                quantity: { type: "number" },
                unitPriceCents: { type: "number" },
              },
            },
          },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.OPERATIONS, BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT],
      capabilityId: "capability.pos",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) => {
      const rawItems = Array.isArray(input.items) ? input.items : [];
      const items = rawItems
        .filter(
          (item): item is Record<string, unknown> => typeof item === "object" && item !== null,
        )
        .map((item) => ({
          menuItemId: typeof item.menuItemId === "string" ? item.menuItemId : "menu-unknown",
          name: typeof item.name === "string" ? item.name : "Item",
          quantity: typeof item.quantity === "number" ? item.quantity : 1,
          unitPriceCents: typeof item.unitPriceCents === "number" ? item.unitPriceCents : 0,
        }));

      return createSaleForAi(items);
    },
  ),
  definePosTool(
    {
      id: POS_AI_TOOL_IDS.APPLY_DISCOUNT,
      name: "Apply Discount",
      description: "Apply a discount to a POS order.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.POS_MANAGE],
      requiredModules: [PLATFORM_MODULES.POS],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["orderId", "valueBps"],
        properties: {
          orderId: { type: "string" },
          valueBps: { type: "number" },
          label: { type: "string" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: POS_AGENT_SLUGS,
      capabilityId: "capability.pos",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) => {
      const orderId = typeof input.orderId === "string" ? input.orderId : "";
      const valueBps = typeof input.valueBps === "number" ? input.valueBps : 0;
      const label = typeof input.label === "string" ? input.label : "AI Discount";
      return applyDiscountForAi(orderId, valueBps, label) ?? { error: "Order not found." };
    },
  ),
  definePosTool(
    {
      id: POS_AI_TOOL_IDS.SPLIT_BILL,
      name: "Split Bill",
      description: "Split a POS bill into equal portions.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.POS_MANAGE],
      requiredModules: [PLATFORM_MODULES.POS],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["orderId", "splitCount"],
        properties: {
          orderId: { type: "string" },
          splitCount: { type: "number" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: POS_AGENT_SLUGS,
      capabilityId: "capability.pos",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "low" },
    },
    async (input) => {
      const orderId = typeof input.orderId === "string" ? input.orderId : "";
      const splitCount = typeof input.splitCount === "number" ? input.splitCount : 2;
      return splitBillForAi(orderId, splitCount) ?? { error: "Order not found." };
    },
  ),
  definePosTool(
    {
      id: POS_AI_TOOL_IDS.RECOMMEND_UPSELLS,
      name: "Recommend Upsells",
      description: "Recommend upsell items for a POS order.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.POS_READ],
      requiredModules: [PLATFORM_MODULES.POS, PLATFORM_MODULES.MENU],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["orderId"],
        properties: { orderId: { type: "string" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.MARKETING, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.pos",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => {
      const orderId = typeof input.orderId === "string" ? input.orderId : "";
      return recommendUpsells(orderId) ?? { error: "Order not found." };
    },
  ),
  definePosTool(
    {
      id: POS_AI_TOOL_IDS.PREDICT_BUSY_HOURS,
      name: "Predict Busy Hours",
      description: "Predict busy hours for POS and staffing.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.POS_READ],
      requiredModules: [PLATFORM_MODULES.POS, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.pos",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async () => predictBusyHours(),
  ),
  definePosTool(
    {
      id: POS_AI_TOOL_IDS.DETECT_SUSPICIOUS_REFUNDS,
      name: "Detect Suspicious Refunds",
      description: "Detect potentially suspicious refund patterns.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.POS_READ],
      requiredModules: [PLATFORM_MODULES.POS, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        properties: { limit: { type: "number" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.pos",
      skillIds: [],
      metadata: { readOnly: true, riskLevel: "medium" },
    },
    async (input) => {
      const limit = typeof input.limit === "number" ? input.limit : 5;
      return detectSuspiciousRefunds(limit);
    },
  ),
  definePosTool(
    {
      id: POS_AI_TOOL_IDS.SUGGEST_PROMOTIONS,
      name: "Suggest Promotions",
      description: "Suggest promotions based on current POS activity.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.POS_READ],
      requiredModules: [PLATFORM_MODULES.POS, PLATFORM_MODULES.MARKETING],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.MARKETING, BUILTIN_AGENT_SLUGS.ANALYTICS],
      capabilityId: "capability.pos",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async () => suggestPromotions(),
  ),
  definePosTool(
    {
      id: POS_AI_TOOL_IDS.FORECAST_REVENUE,
      name: "Forecast Revenue",
      description: "Forecast POS revenue for the current shift and week.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.POS_READ],
      requiredModules: [PLATFORM_MODULES.POS, PLATFORM_MODULES.ANALYTICS, PLATFORM_MODULES.FINANCE],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.pos",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async () => forecastRevenue(),
  ),
];

let registered = false;

/** Registers POS platform tools with the AI Tool Platform (mock, idempotent). */
export function registerPosAiTools(): void {
  if (registered) {
    return;
  }

  for (const tool of POS_AI_TOOLS) {
    registerPlatformTool(tool);
  }

  registered = true;
}

registerPosAiTools();
