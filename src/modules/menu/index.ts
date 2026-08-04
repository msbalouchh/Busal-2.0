export {
  MENU_ITEM_STATUSES,
  MENU_CATEGORY_TYPES,
  MENU_CHANNELS,
  MENU_TYPES,
  AVAILABILITY_MODES,
  MENU_AI_TOOL_IDS,
  type MenuItemStatus,
  type MenuCategoryType,
  type MenuChannel,
  type MenuType,
  type AvailabilityMode,
  type MenuAiToolId,
} from "@/modules/menu/constants/menu-status";

export { MENU_PERMISSIONS, type MenuPermissionCode } from "@/modules/menu/constants/permissions";
export {
  MENU_INTEGRATION_POINTS,
  MENU_INTEGRATION_STATUS,
  type MenuIntegrationPoint,
} from "@/modules/menu/constants/integration-points";

export * from "@/modules/menu/constants/routes";
export * from "@/modules/menu/lib/get-menu-context";
export * from "@/modules/menu/lib/menu-scope";
export type * from "@/modules/menu/types/menu";
export * from "@/modules/menu/utils/menu-selectors";
export * from "@/modules/menu/utils/menu-ui-serializers";
export * from "@/modules/menu/validation/menu-schemas";

export {
  MenuRepository,
  menuRepository,
  type MenuItemSearchResult,
} from "@/modules/menu/repository/menu-repository";

export { MenuService, menuService } from "@/modules/menu/services/menu.service";
export {
  buildMenuPlatformContext,
  buildMenuPlatformSnapshot,
  getDefaultMenuSnapshot,
  getPopularItems,
  type MenuPlatformSnapshot,
  type MenuPlatformInput,
} from "@/modules/menu/services/menu-platform.service";

export { MenuProvider } from "@/modules/menu/providers/menu-provider";
export { MenuContext } from "@/modules/menu/contexts/menu-context";

export { useMenu, useMenuContext } from "@/modules/menu/hooks/use-menu";
export { useMenuItem } from "@/modules/menu/hooks/use-menu-item";
export { useMenuSearch } from "@/modules/menu/hooks/use-menu-search";

export { MenuItemStatusBadge } from "@/modules/menu/components/menu-item-status-badge";
export { MenuCategoryBadge } from "@/modules/menu/components/menu-category-badge";

export {
  registerMenuAiTools,
  MENU_AI_TOOLS,
  buildMenuItemAiContext,
  recommendMenuPricing,
  recommendMenuUpsells,
  analyzePopularMenuItems,
  detectDuplicateMenuItems,
  searchMenuItemsForAi,
  buildMenuCatalogSummary,
  generateMenuItemDescription,
  suggestMenuImprovements,
  type MenuItemAiInsights,
} from "@/modules/menu/ai";

export * from "@/modules/menu/actions/menu-actions";

export { MenuNav } from "@/modules/menu/components/menu-nav";
export { MenuOverview } from "@/modules/menu/components/menu-overview";
export { MenuPageHeader } from "@/modules/menu/components/menu-page-header";
export { CategoriesManager } from "@/modules/menu/components/categories-manager";
export { MenuItemsManager } from "@/modules/menu/components/menu-items-manager";
export { ModifiersManager } from "@/modules/menu/components/modifiers-manager";
