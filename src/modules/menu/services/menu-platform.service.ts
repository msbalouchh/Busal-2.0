import "server-only";

import {
  buildMenuScopeFromInput,
  toMenuPlatformContext,
  type MenuTenantScope,
} from "@/modules/menu/lib/menu-scope";
import { menuRepository } from "@/modules/menu/repository/menu-repository";
import { menuService } from "@/modules/menu/services/menu.service";
import type { MenuItemRecord, MenuPlatformContext, MenuRecord } from "@/modules/menu/types/menu";

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
  businessId: string;
  branchId?: string | null;
  userId?: string;
}

export function buildMenuPlatformContext(input: MenuPlatformInput): MenuPlatformContext {
  return toMenuPlatformContext(buildMenuScopeFromInput(input));
}

export async function buildMenuPlatformSnapshot(
  input: MenuPlatformInput,
): Promise<MenuPlatformSnapshot> {
  const context = buildMenuPlatformContext(input);
  const scope: MenuTenantScope = buildMenuScopeFromInput(input);
  const menus = await menuRepository.listMenus(scope);
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
    activeItemCount: items.filter((entry) => entry.item.status === "active").length,
    draftItemCount: items.filter((entry) => entry.item.status === "draft").length,
    hiddenItemCount: items.filter((entry) => entry.item.status === "hidden").length,
    archivedItemCount: items.filter((entry) => entry.item.status === "archived").length,
    seasonalItemCount: items.filter((entry) => entry.item.status === "seasonal").length,
    channelCoverage,
  };
}

export async function getDefaultMenuSnapshot(businessId: string): Promise<MenuPlatformSnapshot> {
  return buildMenuPlatformSnapshot({ businessId });
}

export async function getPopularItems(
  context: MenuPlatformContext,
  limit = 5,
): Promise<MenuItemRecord[]> {
  const result = await menuService.searchItems({ pageSize: 100 }, context);

  return [...result.records]
    .sort((left, right) => right.aiContext.popularityScore - left.aiContext.popularityScore)
    .slice(0, limit);
}
