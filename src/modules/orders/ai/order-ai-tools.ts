import { BUILTIN_AGENT_SLUGS } from "@/modules/ai/constants/agent-slugs";
import {
  PLATFORM_MODULES,
  PLATFORM_TOOL_PERMISSIONS,
} from "@/modules/ai-tools/constants/platform-tools";
import { registerPlatformTool } from "@/modules/ai-tools/registry/platform-tool-registry";
import type { RegisteredPlatformTool } from "@/modules/ai-tools/types/platform-tool";
import {
  buildOrderAiContext,
  buildOrderTrackingSummary,
  generateUpsellRecommendations,
  predictOrderDelay,
} from "@/modules/orders/ai/order-ai-context";
import { ORDER_AI_TOOL_IDS } from "@/modules/orders/constants/order-status";
import { DEFAULT_OMS_SCOPE } from "@/modules/orders/constants/mock-data";
import { orderService } from "@/modules/orders/services/order.service";

function defineOrderTool(
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
      category: "Orders",
      tags: ["orders", "oms", "transaction"],
      readOnly: false,
      confirmationRequired: false,
      dryRunSupported: true,
      riskLevel: "low",
      ...partial.metadata,
    },
    handler,
  };
}

const ORDER_AGENT_SLUGS = [
  BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT,
  BUILTIN_AGENT_SLUGS.SALES,
  BUILTIN_AGENT_SLUGS.CUSTOMER_SUPPORT,
  BUILTIN_AGENT_SLUGS.OPERATIONS,
  BUILTIN_AGENT_SLUGS.ANALYTICS,
];

export const ORDER_AI_TOOLS: RegisteredPlatformTool[] = [
  defineOrderTool(
    {
      id: ORDER_AI_TOOL_IDS.CREATE,
      name: "Create Order",
      description: "Create a new order in the OMS.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.ORDERS_MANAGE],
      requiredModules: [PLATFORM_MODULES.ORDERS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        required: ["orderType", "items"],
        properties: {
          orderType: { type: "string" },
          customerName: { type: "string" },
          tableNumber: { type: "string" },
          items: { type: "array" },
        },
      },
      outputSchema: {
        type: "object",
        properties: { orderId: { type: "string" }, orderNumber: { type: "string" } },
      },
      supportedAgents: [
        BUILTIN_AGENT_SLUGS.SALES,
        BUILTIN_AGENT_SLUGS.CUSTOMER_SUPPORT,
        BUILTIN_AGENT_SLUGS.OPERATIONS,
      ],
      capabilityId: "capability.orders",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) => {
      const orderType = typeof input.orderType === "string" ? input.orderType : "dine_in";
      const items = Array.isArray(input.items) ? input.items : [];

      const parsedItems = items
        .filter(
          (item): item is Record<string, unknown> => typeof item === "object" && item !== null,
        )
        .map((item) => ({
          productId: typeof item.productId === "string" ? item.productId : "prod-unknown",
          productName: typeof item.productName === "string" ? item.productName : "Item",
          quantity: typeof item.quantity === "number" ? item.quantity : 1,
          unitPricePence: typeof item.unitPricePence === "number" ? item.unitPricePence : 1000,
        }));

      const record = orderService.create({
        tenantId: DEFAULT_OMS_SCOPE.tenantId,
        workspaceId: DEFAULT_OMS_SCOPE.workspaceId,
        businessId: DEFAULT_OMS_SCOPE.businessId,
        branchId: DEFAULT_OMS_SCOPE.branchId,
        orderType: orderType as "dine_in",
        source: "ai_agent",
        customerName: typeof input.customerName === "string" ? input.customerName : null,
        tableNumber: typeof input.tableNumber === "string" ? input.tableNumber : null,
        items:
          parsedItems.length > 0
            ? parsedItems
            : [
                {
                  productId: "prod-default",
                  productName: "Default Item",
                  quantity: 1,
                  unitPricePence: 1000,
                },
              ],
      });

      return { orderId: record.order.id, orderNumber: record.order.orderNumber };
    },
  ),
  defineOrderTool(
    {
      id: ORDER_AI_TOOL_IDS.MODIFY,
      name: "Modify Order",
      description: "Modify an existing order (status, items, or notes).",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.ORDERS_MANAGE],
      requiredModules: [PLATFORM_MODULES.ORDERS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        required: ["orderId"],
        properties: {
          orderId: { type: "string" },
          status: { type: "string" },
          note: { type: "string" },
        },
      },
      outputSchema: {
        type: "object",
        properties: { updated: { type: "boolean" }, orderId: { type: "string" } },
      },
      supportedAgents: ORDER_AGENT_SLUGS,
      capabilityId: "capability.orders",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) => {
      const orderId = typeof input.orderId === "string" ? input.orderId : "";
      const updated = orderService.modify({
        orderId,
        status: typeof input.status === "string" ? (input.status as "confirmed") : undefined,
        note: typeof input.note === "string" ? input.note : undefined,
      });

      return { updated: Boolean(updated), orderId };
    },
  ),
  defineOrderTool(
    {
      id: ORDER_AI_TOOL_IDS.CANCEL,
      name: "Cancel Order",
      description: "Cancel an active order.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.ORDERS_MANAGE],
      requiredModules: [PLATFORM_MODULES.ORDERS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        required: ["orderId"],
        properties: {
          orderId: { type: "string" },
          reason: { type: "string" },
        },
      },
      outputSchema: {
        type: "object",
        properties: { cancelled: { type: "boolean" }, orderId: { type: "string" } },
      },
      supportedAgents: [BUILTIN_AGENT_SLUGS.CUSTOMER_SUPPORT, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.orders",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "high" },
    },
    async (input) => {
      const orderId = typeof input.orderId === "string" ? input.orderId : "";
      const reason = typeof input.reason === "string" ? input.reason : undefined;
      const cancelled = orderService.cancel(orderId, reason);

      return { cancelled: Boolean(cancelled), orderId };
    },
  ),
  defineOrderTool(
    {
      id: ORDER_AI_TOOL_IDS.TRACK,
      name: "Track Order",
      description: "Retrieve order status, timeline, and fulfillment details.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.ORDERS_READ],
      requiredModules: [PLATFORM_MODULES.ORDERS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        required: ["orderId"],
        properties: { orderId: { type: "string" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: ORDER_AGENT_SLUGS,
      capabilityId: "capability.orders",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => {
      const orderId = typeof input.orderId === "string" ? input.orderId : "";
      return buildOrderTrackingSummary(orderId) ?? { error: "Order not found." };
    },
  ),
  defineOrderTool(
    {
      id: ORDER_AI_TOOL_IDS.RECOMMEND_UPSELLS,
      name: "Recommend Upsells",
      description: "Recommend upsell items for an order.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.ORDERS_READ],
      requiredModules: [PLATFORM_MODULES.ORDERS, PLATFORM_MODULES.MARKETING],
      requiredTenantScope: "required",
      requiredBranchScope: "none",
      inputSchema: {
        type: "object",
        required: ["orderId"],
        properties: { orderId: { type: "string" } },
      },
      outputSchema: {
        type: "object",
        properties: { recommendations: { type: "array" } },
      },
      supportedAgents: [BUILTIN_AGENT_SLUGS.SALES, BUILTIN_AGENT_SLUGS.MARKETING],
      capabilityId: "capability.orders",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => {
      const orderId = typeof input.orderId === "string" ? input.orderId : "";
      return { recommendations: generateUpsellRecommendations(orderId) };
    },
  ),
  defineOrderTool(
    {
      id: ORDER_AI_TOOL_IDS.PREDICT_DELAYS,
      name: "Predict Delays",
      description: "Predict fulfillment delays for an order.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.ORDERS_READ],
      requiredModules: [PLATFORM_MODULES.ORDERS, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        required: ["orderId"],
        properties: { orderId: { type: "string" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: [
        BUILTIN_AGENT_SLUGS.OPERATIONS,
        BUILTIN_AGENT_SLUGS.ANALYTICS,
        BUILTIN_AGENT_SLUGS.CUSTOMER_SUPPORT,
      ],
      capabilityId: "capability.orders",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => {
      const orderId = typeof input.orderId === "string" ? input.orderId : "";
      const context = buildOrderAiContext(orderId);
      const prediction = predictOrderDelay(orderId);

      return {
        ...(prediction ?? { error: "Order not found." }),
        aiContext: context ?? null,
      } as Record<string, unknown>;
    },
  ),
];

let registered = false;

/** Registers Order OMS tools with the AI Tool Platform (mock, idempotent). */
export function registerOrderAiTools(): void {
  if (registered) {
    return;
  }

  for (const tool of ORDER_AI_TOOLS) {
    registerPlatformTool(tool);
  }

  registered = true;
}

registerOrderAiTools();
