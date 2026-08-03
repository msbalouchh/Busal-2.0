import { BUILTIN_AGENT_SLUGS } from "@/modules/ai/constants/agent-slugs";
import {
  PLATFORM_MODULES,
  PLATFORM_TOOL_PERMISSIONS,
} from "@/modules/ai-tools/constants/platform-tools";
import { registerPlatformTool } from "@/modules/ai-tools/registry/platform-tool-registry";
import type { RegisteredPlatformTool } from "@/modules/ai-tools/types/platform-tool";
import {
  analyzePopularMenuItems,
  detectDuplicateMenuItems,
  recommendMenuPricing,
  recommendMenuUpsells,
} from "@/modules/menu/ai/menu-ai-context";
import { MENU_AI_TOOL_IDS } from "@/modules/menu/constants/menu-status";
import { MOCK_MENU_RECORD } from "@/modules/menu/constants/mock-data";
import { menuService } from "@/modules/menu/services/menu.service";
import type { MenuItemStatus } from "@/modules/menu/constants/menu-status";

function defineMenuTool(
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
      category: "Menu",
      tags: ["menu", "catalog", "pricing"],
      readOnly: false,
      confirmationRequired: false,
      dryRunSupported: true,
      riskLevel: "low",
      ...partial.metadata,
    },
    handler,
  };
}

const MENU_AGENT_SLUGS = [
  BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT,
  BUILTIN_AGENT_SLUGS.OPERATIONS,
  BUILTIN_AGENT_SLUGS.ANALYTICS,
  BUILTIN_AGENT_SLUGS.MARKETING,
];

export const MENU_AI_TOOLS: RegisteredPlatformTool[] = [
  defineMenuTool(
    {
      id: MENU_AI_TOOL_IDS.CREATE_ITEM,
      name: "Create Menu Item",
      description: "Create a new menu item in the catalog.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.MENU_MANAGE],
      requiredModules: [PLATFORM_MODULES.MENU],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        required: ["name", "basePricePence"],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          basePricePence: { type: "number" },
          prepTimeMinutes: { type: "number" },
        },
      },
      outputSchema: {
        type: "object",
        properties: { itemId: { type: "string" }, name: { type: "string" } },
      },
      supportedAgents: [BUILTIN_AGENT_SLUGS.OPERATIONS, BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT],
      capabilityId: "capability.menu",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) => {
      const menu = MOCK_MENU_RECORD;
      const categoryId = menu.categories[0]?.id ?? "cat-default";
      const sectionId = menu.sections[0]?.id ?? "sec-default";

      const record = menuService.createItem({
        menuId: menu.menu.id,
        categoryId,
        sectionId,
        name: typeof input.name === "string" ? input.name : "New Item",
        description: typeof input.description === "string" ? input.description : null,
        basePricePence: typeof input.basePricePence === "number" ? input.basePricePence : 995,
        prepTimeMinutes: typeof input.prepTimeMinutes === "number" ? input.prepTimeMinutes : 10,
      });

      return { itemId: record.item.id, name: record.item.name };
    },
  ),
  defineMenuTool(
    {
      id: MENU_AI_TOOL_IDS.UPDATE_ITEM,
      name: "Update Menu Item",
      description: "Update an existing menu item.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.MENU_MANAGE],
      requiredModules: [PLATFORM_MODULES.MENU],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        required: ["itemId"],
        properties: {
          itemId: { type: "string" },
          name: { type: "string" },
          status: { type: "string" },
          basePricePence: { type: "number" },
        },
      },
      outputSchema: {
        type: "object",
        properties: { updated: { type: "boolean" }, itemId: { type: "string" } },
      },
      supportedAgents: MENU_AGENT_SLUGS,
      capabilityId: "capability.menu",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) => {
      const itemId = typeof input.itemId === "string" ? input.itemId : "";
      const updated = menuService.updateItem({
        itemId,
        name: typeof input.name === "string" ? input.name : undefined,
        status: typeof input.status === "string" ? (input.status as MenuItemStatus) : undefined,
        basePricePence: typeof input.basePricePence === "number" ? input.basePricePence : undefined,
      });

      return { updated: Boolean(updated), itemId };
    },
  ),
  defineMenuTool(
    {
      id: MENU_AI_TOOL_IDS.RECOMMEND_PRICING,
      name: "Recommend Pricing",
      description: "Recommend optimal pricing for a menu item.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.MENU_READ],
      requiredModules: [PLATFORM_MODULES.MENU, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        required: ["itemId"],
        properties: { itemId: { type: "string" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.menu",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => {
      const itemId = typeof input.itemId === "string" ? input.itemId : "";
      return recommendMenuPricing(itemId) ?? { error: "Item not found." };
    },
  ),
  defineMenuTool(
    {
      id: MENU_AI_TOOL_IDS.RECOMMEND_UPSELLS,
      name: "Recommend Upsells",
      description: "Recommend upsell pairings for a menu item.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.MENU_READ],
      requiredModules: [PLATFORM_MODULES.MENU, PLATFORM_MODULES.MARKETING],
      requiredTenantScope: "required",
      requiredBranchScope: "none",
      inputSchema: {
        type: "object",
        required: ["itemId"],
        properties: { itemId: { type: "string" } },
      },
      outputSchema: {
        type: "object",
        properties: { recommendations: { type: "array" } },
      },
      supportedAgents: [BUILTIN_AGENT_SLUGS.MARKETING, BUILTIN_AGENT_SLUGS.SALES],
      capabilityId: "capability.menu",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => {
      const itemId = typeof input.itemId === "string" ? input.itemId : "";
      return { recommendations: recommendMenuUpsells(itemId) };
    },
  ),
  defineMenuTool(
    {
      id: MENU_AI_TOOL_IDS.ANALYZE_POPULAR,
      name: "Analyze Popular Items",
      description: "Analyze top-performing menu items.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.MENU_READ],
      requiredModules: [PLATFORM_MODULES.MENU, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        properties: { limit: { type: "number" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.menu",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => {
      const limit = typeof input.limit === "number" ? input.limit : 5;
      return analyzePopularMenuItems(limit);
    },
  ),
  defineMenuTool(
    {
      id: MENU_AI_TOOL_IDS.DETECT_DUPLICATES,
      name: "Detect Duplicate Items",
      description: "Detect potentially duplicate menu items in the catalog.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.MENU_READ],
      requiredModules: [PLATFORM_MODULES.MENU],
      requiredTenantScope: "required",
      requiredBranchScope: "none",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.OPERATIONS, BUILTIN_AGENT_SLUGS.ANALYTICS],
      capabilityId: "capability.menu",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async () => detectDuplicateMenuItems(),
  ),
];

let registered = false;

/** Registers Menu platform tools with the AI Tool Platform (mock, idempotent). */
export function registerMenuAiTools(): void {
  if (registered) {
    return;
  }

  for (const tool of MENU_AI_TOOLS) {
    registerPlatformTool(tool);
  }

  registered = true;
}

registerMenuAiTools();
