import { BUILTIN_AGENT_SLUGS } from "@/modules/ai/constants/agent-slugs";
import {
  PLATFORM_MODULES,
  PLATFORM_TOOL_PERMISSIONS,
} from "@/modules/ai-tools/constants/platform-tools";
import { registerPlatformTool } from "@/modules/ai-tools/registry/platform-tool-registry";
import type {
  PlatformExecutionContext,
  RegisteredPlatformTool,
} from "@/modules/ai-tools/types/platform-tool";
import {
  buildOrderAiContext,
  buildOrderTrackingSummary,
  detectDelays,
  forecastDemand,
  generateUpsellRecommendations,
  predictOrderDelay,
  suggestOrderOptimizations,
} from "@/modules/orders/ai/order-ai-context";
import { randomUUID } from "node:crypto";

import { ORDER_AI_TOOL_IDS, ORDER_SOURCES, ORDER_TYPES } from "@/modules/orders/constants/order-status";
import type { OrderStatus } from "@/modules/orders/constants/order-status";
import { orderService } from "@/modules/orders/services/order.service";
import type { OmsPlatformContext } from "@/modules/orders/types/order";

function toOrderContext(context: PlatformExecutionContext): OmsPlatformContext {
  if (!context.businessId || !context.branchId) {
    throw new Error("Business and branch scope are required for order tools");
  }

  return {
    tenantId: context.tenantId ?? context.businessId,
    workspaceId: context.workspaceId ?? context.businessId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  };
}

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
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["orderType", "items"],
        properties: {
          orderType: { type: "string" },
          customerName: { type: "string" },
          tableId: { type: "string" },
          items: { type: "array" },
        },
      },
      outputSchema: {
        type: "object",
        properties: { orderId: { type: "string" }, orderNumber: { type: "string" } },
      },
      supportedAgents: [BUILTIN_AGENT_SLUGS.SALES, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.orders",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input, executionContext) => {
      const context = toOrderContext(executionContext);
      const orderType = typeof input.orderType === "string" ? input.orderType : ORDER_TYPES.DINE_IN;
      const items = Array.isArray(input.items) ? input.items : [];
      const parsedItems = items
        .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
        .map((item) => ({
          productId: typeof item.productId === "string" ? item.productId : randomUUID(),
          productName: typeof item.productName === "string" ? item.productName : "Item",
          quantity: typeof item.quantity === "number" ? item.quantity : 1,
          unitPricePence: typeof item.unitPricePence === "number" ? item.unitPricePence : 1000,
        }));

      const record = await orderService.create(context, {
        tenantId: context.tenantId,
        workspaceId: context.workspaceId,
        businessId: context.businessId,
        branchId: context.branchId,
        orderType: orderType as typeof ORDER_TYPES.DINE_IN,
        source: ORDER_SOURCES.AI_AGENT,
        customerName: typeof input.customerName === "string" ? input.customerName : null,
        tableId: typeof input.tableId === "string" ? input.tableId : null,
        items:
          parsedItems.length > 0
            ? parsedItems
            : [{ productId: randomUUID(), productName: "Default Item", quantity: 1, unitPricePence: 1000 }],
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
      requiredBranchScope: "required",
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
    async (input, executionContext) => {
      const context = toOrderContext(executionContext);
      const orderId = typeof input.orderId === "string" ? input.orderId : "";
      const updated = await orderService.modify(context, {
        orderId,
        status: typeof input.status === "string" ? (input.status as OrderStatus) : undefined,
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
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["orderId"],
        properties: { orderId: { type: "string" }, reason: { type: "string" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.CUSTOMER_SUPPORT, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.orders",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "high" },
    },
    async (input, executionContext) => {
      const context = toOrderContext(executionContext);
      const orderId = typeof input.orderId === "string" ? input.orderId : "";
      const reason = typeof input.reason === "string" ? input.reason : undefined;
      const cancelled = await orderService.cancel(context, orderId, reason);
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
      requiredBranchScope: "required",
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
    async (input, executionContext) => {
      const context = toOrderContext(executionContext);
      const orderId = typeof input.orderId === "string" ? input.orderId : "";
      return (await buildOrderTrackingSummary(context, orderId)) ?? { error: "Order not found." };
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
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.SALES, BUILTIN_AGENT_SLUGS.MARKETING],
      capabilityId: "capability.orders",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input, executionContext) => {
      const context = toOrderContext(executionContext);
      const orderId = typeof input.orderId === "string" ? input.orderId : "";
      return { recommendations: await generateUpsellRecommendations(context, orderId) };
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
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["orderId"],
        properties: { orderId: { type: "string" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.OPERATIONS, BUILTIN_AGENT_SLUGS.ANALYTICS],
      capabilityId: "capability.orders",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input, executionContext) => {
      const context = toOrderContext(executionContext);
      const orderId = typeof input.orderId === "string" ? input.orderId : "";
      const aiContext = await buildOrderAiContext(context, orderId);
      const prediction = await predictOrderDelay(context, orderId);
      return { ...(prediction ?? { error: "Order not found." }), aiContext };
    },
  ),
];

let registered = false;

export function registerOrderAiTools(): void {
  if (registered) {
    return;
  }

  for (const tool of ORDER_AI_TOOLS) {
    registerPlatformTool(tool);
  }

  registered = true;
}
