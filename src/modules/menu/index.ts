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

export {
  MENU_INTEGRATION_POINTS,
  type MenuIntegrationPoint,
} from "@/modules/menu/constants/integration-points";

export {
  DEFAULT_MENU_SCOPE,
  MOCK_MENU_ITEMS,
  MOCK_MENU_RECORD,
  MOCK_MENU_RECORDS,
} from "@/modules/menu/constants/mock-data";

export type * from "@/modules/menu/types/menu";
export * from "@/modules/menu/utils/menu-selectors";

export { MenuRepository, menuRepository } from "@/modules/menu/repository/menu-repository";

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
} from "@/modules/menu/ai";
