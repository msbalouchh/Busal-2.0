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
  generateMenuItemDescription,
  recommendMenuPricing,
  recommendMenuUpsells,
  suggestMenuImprovements,
} from "@/modules/menu/ai/menu-ai-context";
import { MENU_AI_TOOL_IDS } from "@/modules/menu/constants/menu-status";
import { buildMenuPlatformContext } from "@/modules/menu/services/menu-platform.service";
import { menuService } from "@/modules/menu/services/menu.service";
import type { MenuItemStatus } from "@/modules/menu/constants/menu-status";
import type { MenuPlatformContext } from "@/modules/menu/types/menu";

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

function resolveAiContext(input: Record<string, unknown>): MenuPlatformContext {
  const businessId = typeof input.businessId === "string" ? input.businessId : "";
  return buildMenuPlatformContext({
    tenantId: typeof input.tenantId === "string" ? input.tenantId : businessId,
    workspaceId: typeof input.workspaceId === "string" ? input.workspaceId : businessId,
    businessId: businessId || (typeof input.tenantId === "string" ? input.tenantId : ""),
    branchId: typeof input.branchId === "string" ? input.branchId : null,
    userId: typeof input.userId === "string" ? input.userId : "system",
  });
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
        required: ["name", "basePricePence", "menuId", "categoryId", "sectionId"],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          basePricePence: { type: "number" },
          prepTimeMinutes: { type: "number" },
          menuId: { type: "string" },
          categoryId: { type: "string" },
          sectionId: { type: "string" },
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
      const context = resolveAiContext(input);
      const menus = await menuService.listMenus(context);
      const menu = menus.find((entry) => entry.menu.id === input.menuId) ?? menus[0];

      if (!menu) {
        return { error: "No menu available" };
      }

      const record = await menuService.createItem(
        {
          menuId: typeof input.menuId === "string" ? input.menuId : menu.menu.id,
          categoryId:
            typeof input.categoryId === "string"
              ? input.categoryId
              : (menu.categories[0]?.id ?? ""),
          sectionId:
            typeof input.sectionId === "string" ? input.sectionId : (menu.sections[0]?.id ?? ""),
          name: typeof input.name === "string" ? input.name : "New Item",
          description: typeof input.description === "string" ? input.description : null,
          basePricePence: typeof input.basePricePence === "number" ? input.basePricePence : 995,
          prepTimeMinutes: typeof input.prepTimeMinutes === "number" ? input.prepTimeMinutes : 10,
        },
        context,
      );

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
      const context = resolveAiContext(input);
      const updated = await menuService.updateItem(
        {
          itemId,
          name: typeof input.name === "string" ? input.name : undefined,
          status: typeof input.status === "string" ? (input.status as MenuItemStatus) : undefined,
          basePricePence:
            typeof input.basePricePence === "number" ? input.basePricePence : undefined,
        },
        context,
      );

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
      return (
        (await recommendMenuPricing(itemId, resolveAiContext(input))) ?? {
          error: "Item not found.",
        }
      );
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
      return {
        recommendations: await recommendMenuUpsells(itemId, resolveAiContext(input)),
      };
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
      return analyzePopularMenuItems(resolveAiContext(input), limit);
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
    async (input) => detectDuplicateMenuItems(resolveAiContext(input)),
  ),
];

let registered = false;

/** Registers Menu platform tools with the AI Tool Platform (idempotent). */
export function registerMenuAiTools(): void {
  if (registered) {
    return;
  }

  for (const tool of MENU_AI_TOOLS) {
    registerPlatformTool(tool);
  }

  registered = true;
}

export { generateMenuItemDescription, suggestMenuImprovements };
