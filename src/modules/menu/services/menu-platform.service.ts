import { menuRepository } from "@/modules/menu/repository/menu-repository";
import type { MenuItemRecord, MenuPlatformContext, MenuRecord } from "@/modules/menu/types/menu";
import { DEFAULT_MENU_SCOPE } from "@/modules/menu/constants/mock-data";

export interface MenuPlatformSnapshot {
  context: MenuPlatformContext;
  menus: MenuRecord[];
  itemCount: number;
  activeItemCount: number;
  draftItemCount: number;
  hiddenItemCount: number;
  archivedItemCount: number;
  seasonalItemCount: number;
  channelCoverage: Record<string, number>;
}

export interface MenuPlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId?: string;
  branchId?: string;
  userId?: string;
}

export function buildMenuPlatformContext(input: MenuPlatformInput = {}): MenuPlatformContext {
  return {
    tenantId: input.tenantId ?? DEFAULT_MENU_SCOPE.tenantId,
    workspaceId: input.workspaceId ?? DEFAULT_MENU_SCOPE.workspaceId,
    businessId: input.businessId ?? DEFAULT_MENU_SCOPE.businessId,
    branchId: input.branchId ?? DEFAULT_MENU_SCOPE.branchId,
    userId: input.userId ?? DEFAULT_MENU_SCOPE.userId,
  };
}

export function buildMenuPlatformSnapshot(input: MenuPlatformInput = {}): MenuPlatformSnapshot {
  const context = buildMenuPlatformContext(input);
  const menus = menuRepository
    .listMenus()
    .filter(
      (record) =>
        record.menu.tenantId === context.tenantId && record.menu.businessId === context.businessId,
    );

  const items = menus.flatMap((menu) => menu.items);

  const channelCoverage: Record<string, number> = {};
  for (const item of items) {
    for (const channel of item.item.channels) {
      channelCoverage[channel] = (channelCoverage[channel] ?? 0) + 1;
    }
  }

  return {
    context,
    menus,
    itemCount: items.length,
    activeItemCount: items.filter((i) => i.item.status === "active").length,
    draftItemCount: items.filter((i) => i.item.status === "draft").length,
    hiddenItemCount: items.filter((i) => i.item.status === "hidden").length,
    archivedItemCount: items.filter((i) => i.item.status === "archived").length,
    seasonalItemCount: items.filter((i) => i.item.status === "seasonal").length,
    channelCoverage,
  };
}

export function getDefaultMenuSnapshot(): MenuPlatformSnapshot {
  return buildMenuPlatformSnapshot();
}

export function getPopularItems(limit = 5): MenuItemRecord[] {
  return menuRepository
    .listItems()
    .sort((a, b) => b.aiContext.popularityScore - a.aiContext.popularityScore)
    .slice(0, limit);
}
