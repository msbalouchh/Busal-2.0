import "server-only";

import { prisma } from "@/lib/prisma";
import {
  getInventoryDashboardStats,
  listLowStockItems,
} from "@/services/restaurant-inventory.service";
import { AI_BUSINESS_TOOL_IDS } from "@/modules/customer-ai/constants/customer-ai.constants";
import type { AiBusinessToolDefinition } from "@/modules/customer-ai/tools/tool-types";

async function resolveBranchId(businessId: string, branchId?: string | null): Promise<string | null> {
  if (branchId) return branchId;
  const branch = await prisma.branch.findFirst({
    where: { businessId, isMain: true, isActive: true },
    select: { id: true },
  });
  return branch?.id ?? null;
}

export const inventoryTools: AiBusinessToolDefinition[] = [
  {
    toolId: AI_BUSINESS_TOOL_IDS.INVENTORY_LOW_STOCK,
    name: "Low Stock Items",
    description: "List inventory items that are low in stock.",
    inputSchema: { type: "object", properties: {} },
    permission: "ai.inventory.read",
    riskLevel: "READ",
    audience: "OWNER",
    handler: async (_input, context) => {
      if (!context.ownerId) return { error: "Owner context required." };
      const branchId = await resolveBranchId(context.businessId, context.branchId);
      if (!branchId) return { error: "No branch configured for inventory." };
      const items = await listLowStockItems(context.ownerId, branchId);
      return {
        count: items.length,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          currentStock: item.currentStock,
          minimumStock: item.minimumStock,
        })),
      };
    },
  },
  {
    toolId: AI_BUSINESS_TOOL_IDS.INVENTORY_SUMMARY,
    name: "Inventory Summary",
    description: "Summarize inventory dashboard statistics.",
    inputSchema: { type: "object", properties: {} },
    permission: "ai.inventory.read",
    riskLevel: "READ",
    audience: "OWNER",
    handler: async (_input, context) => {
      if (!context.ownerId) return { error: "Owner context required." };
      const branchId = await resolveBranchId(context.businessId, context.branchId);
      if (!branchId) return { error: "No branch configured for inventory." };
      const stats = await getInventoryDashboardStats(context.ownerId, branchId);
      return stats;
    },
  },
];
