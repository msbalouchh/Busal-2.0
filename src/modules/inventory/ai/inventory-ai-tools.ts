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
  createInventoryItemForAi,
  detectInventoryWaste,
  forecastDemand,
  optimizeStockLevels,
  predictExpiryRisk,
  predictLowStock,
  recommendPurchaseOrders,
  suggestReorderQuantity,
  updateStockForAi,
} from "@/modules/inventory/ai/inventory-ai-context";
import { INVENTORY_AI_TOOL_IDS } from "@/modules/inventory/constants/inventory-status";
import { buildInventoryPlatformContext } from "@/modules/inventory/lib/inventory-platform-context";
import type { InventoryPlatformContext } from "@/modules/inventory/types/inventory-platform";

function toInventoryContext(context: PlatformExecutionContext): InventoryPlatformContext {
  if (!context.businessId || !context.branchId) {
    throw new Error("Business and branch scope are required for inventory tools");
  }

  return buildInventoryPlatformContext({
    tenantId: context.tenantId ?? context.businessId,
    workspaceId: context.workspaceId ?? context.businessId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  });
}

function defineInventoryTool(
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
      category: "Inventory",
      tags: ["inventory", "stock", "purchasing"],
      readOnly: false,
      confirmationRequired: false,
      dryRunSupported: true,
      riskLevel: "low",
      ...partial.metadata,
    },
    handler,
  };
}

const INVENTORY_AGENT_SLUGS = [
  BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT,
  BUILTIN_AGENT_SLUGS.OPERATIONS,
  BUILTIN_AGENT_SLUGS.ANALYTICS,
];

export const INVENTORY_AI_TOOLS: RegisteredPlatformTool[] = [
  defineInventoryTool(
    {
      id: INVENTORY_AI_TOOL_IDS.CREATE_ITEM,
      name: "Create Inventory Item",
      description: "Create a new inventory item with stock settings.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.INVENTORY_MANAGE],
      requiredModules: [PLATFORM_MODULES.INVENTORY],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: [
          "sku",
          "name",
          "categoryId",
          "unitId",
          "reorderPoint",
          "reorderQuantity",
          "parLevel",
          "costPerUnitCents",
        ],
        properties: {
          sku: { type: "string" },
          name: { type: "string" },
          categoryId: { type: "string" },
          unitId: { type: "string" },
          reorderPoint: { type: "number" },
          reorderQuantity: { type: "number" },
          parLevel: { type: "number" },
          costPerUnitCents: { type: "number" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: INVENTORY_AGENT_SLUGS,
      capabilityId: "capability.inventory",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input, context) =>
      createInventoryItemForAi(toInventoryContext(context), {
        sku: typeof input.sku === "string" ? input.sku : "SKU-NEW",
        name: typeof input.name === "string" ? input.name : "New Item",
        categoryId: typeof input.categoryId === "string" ? input.categoryId : "cat-dry-goods",
        unitId: typeof input.unitId === "string" ? input.unitId : "unit-each",
        reorderPoint: typeof input.reorderPoint === "number" ? input.reorderPoint : 10,
        reorderQuantity: typeof input.reorderQuantity === "number" ? input.reorderQuantity : 20,
        parLevel: typeof input.parLevel === "number" ? input.parLevel : 20,
        costPerUnitCents: typeof input.costPerUnitCents === "number" ? input.costPerUnitCents : 100,
      }),
  ),
  defineInventoryTool(
    {
      id: INVENTORY_AI_TOOL_IDS.UPDATE_STOCK,
      name: "Update Stock",
      description: "Adjust stock quantity for an inventory item.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.INVENTORY_MANAGE],
      requiredModules: [PLATFORM_MODULES.INVENTORY],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["itemId", "quantityDelta"],
        properties: {
          itemId: { type: "string" },
          quantityDelta: { type: "number" },
          notes: { type: "string" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: INVENTORY_AGENT_SLUGS,
      capabilityId: "capability.inventory",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input, context) => {
      const itemId = typeof input.itemId === "string" ? input.itemId : "";
      const quantityDelta = typeof input.quantityDelta === "number" ? input.quantityDelta : 0;
      const notes = typeof input.notes === "string" ? input.notes : undefined;
      return (
        (await updateStockForAi(toInventoryContext(context), itemId, quantityDelta, notes)) ?? {
          error: "Item not found.",
        }
      );
    },
  ),
  defineInventoryTool(
    {
      id: INVENTORY_AI_TOOL_IDS.PREDICT_LOW_STOCK,
      name: "Predict Low Stock",
      description: "Predict items at risk of low or out-of-stock.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.INVENTORY_READ],
      requiredModules: [PLATFORM_MODULES.INVENTORY, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        properties: { limit: { type: "number" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.inventory",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input, context) => {
      const limit = typeof input.limit === "number" ? input.limit : 10;
      return predictLowStock(toInventoryContext(context), limit);
    },
  ),
  defineInventoryTool(
    {
      id: INVENTORY_AI_TOOL_IDS.FORECAST_DEMAND,
      name: "Forecast Demand",
      description: "Forecast inventory demand for upcoming period.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.INVENTORY_READ],
      requiredModules: [PLATFORM_MODULES.INVENTORY, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.inventory",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (_input, context) => forecastDemand(toInventoryContext(context)),
  ),
  defineInventoryTool(
    {
      id: INVENTORY_AI_TOOL_IDS.RECOMMEND_PURCHASE_ORDERS,
      name: "Recommend Purchase Orders",
      description: "Recommend purchase orders for low-stock items.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.INVENTORY_READ],
      requiredModules: [PLATFORM_MODULES.INVENTORY],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: INVENTORY_AGENT_SLUGS,
      capabilityId: "capability.inventory",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (_input, context) => recommendPurchaseOrders(toInventoryContext(context)),
  ),
  defineInventoryTool(
    {
      id: INVENTORY_AI_TOOL_IDS.DETECT_WASTE,
      name: "Detect Inventory Waste",
      description: "Detect waste patterns and high-waste items.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.INVENTORY_READ],
      requiredModules: [PLATFORM_MODULES.INVENTORY, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.inventory",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (_input, context) => detectInventoryWaste(toInventoryContext(context)),
  ),
  defineInventoryTool(
    {
      id: INVENTORY_AI_TOOL_IDS.SUGGEST_REORDER,
      name: "Suggest Reorder Quantity",
      description: "Suggest optimal reorder quantity for an item.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.INVENTORY_READ],
      requiredModules: [PLATFORM_MODULES.INVENTORY],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["itemId"],
        properties: { itemId: { type: "string" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: INVENTORY_AGENT_SLUGS,
      capabilityId: "capability.inventory",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input, context) => {
      const itemId = typeof input.itemId === "string" ? input.itemId : "";
      return (
        (await suggestReorderQuantity(toInventoryContext(context), itemId)) ?? {
          error: "Item not found.",
        }
      );
    },
  ),
  defineInventoryTool(
    {
      id: INVENTORY_AI_TOOL_IDS.OPTIMIZE_STOCK,
      name: "Optimize Stock Levels",
      description: "Recommend par level and stock optimizations.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.INVENTORY_READ],
      requiredModules: [PLATFORM_MODULES.INVENTORY, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.inventory",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (_input, context) => optimizeStockLevels(toInventoryContext(context)),
  ),
];

let registered = false;

/** Registers Inventory platform tools with the AI Tool Platform (idempotent). */
export function registerInventoryAiTools(): void {
  if (registered) {
    return;
  }

  for (const tool of INVENTORY_AI_TOOLS) {
    registerPlatformTool(tool);
  }

  registered = true;
}

export { predictExpiryRisk };
