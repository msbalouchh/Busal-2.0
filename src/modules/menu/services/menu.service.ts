import "server-only";

import type { MenuTenantScope } from "@/modules/menu/lib/menu-scope";
import {
  menuRepository,
  type MenuItemSearchResult,
} from "@/modules/menu/repository/menu-repository";
import type {
  CreateMenuItemInput,
  MenuItemRecord,
  MenuPlatformContext,
  MenuRecord,
  MenuSearchQuery,
  PaginatedMenuItemResult,
  UpdateMenuItemInput,
} from "@/modules/menu/types/menu";

function resolveScope(context?: MenuPlatformContext): MenuTenantScope {
  if (!context?.businessId) {
    throw new Error("Menu business context is required");
  }

  return {
    tenantId: context.tenantId ?? context.businessId,
    workspaceId: context.workspaceId ?? context.businessId,
    businessId: context.businessId,
    branchId: context.branchId ?? null,
    userId: context.userId ?? "system",
  };
}

function mergeQuery(query: MenuSearchQuery, context?: MenuPlatformContext): MenuSearchQuery {
  return {
    ...query,
    tenantId: query.tenantId ?? context?.tenantId,
    businessId: query.businessId ?? context?.businessId,
    branchId: query.branchId ?? context?.branchId,
  };
}

export class MenuService {
  async listMenus(context?: MenuPlatformContext): Promise<MenuRecord[]> {
    return menuRepository.listMenus(resolveScope(context));
  }

  async getMenuById(menuId: string, context?: MenuPlatformContext): Promise<MenuRecord | null> {
    return menuRepository.findMenuById(resolveScope(context), menuId);
  }

  async getItemById(itemId: string, context?: MenuPlatformContext): Promise<MenuItemRecord | null> {
    return menuRepository.findItemById(resolveScope(context), itemId);
  }

  async searchItems(
    query: MenuSearchQuery,
    context?: MenuPlatformContext,
  ): Promise<PaginatedMenuItemResult> {
    const scope = resolveScope(context);
    const result: MenuItemSearchResult = await menuRepository.searchItems(
      scope,
      mergeQuery(query, context),
    );

    return {
      records: result.records,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  async searchItemRecords(
    query: MenuSearchQuery,
    context?: MenuPlatformContext,
  ): Promise<MenuItemRecord[]> {
    const result = await this.searchItems(query, context);
    return result.records;
  }

  async createItem(
    input: CreateMenuItemInput,
    context: MenuPlatformContext,
  ): Promise<MenuItemRecord> {
    return menuRepository.createItem(resolveScope(context), input);
  }

  async updateItem(
    input: UpdateMenuItemInput,
    context: MenuPlatformContext,
  ): Promise<MenuItemRecord | null> {
    return menuRepository.updateItem(resolveScope(context), input);
  }

  async archiveItem(itemId: string, context: MenuPlatformContext): Promise<boolean> {
    return menuRepository.archiveItem(resolveScope(context), itemId);
  }

  async restoreItem(itemId: string, context: MenuPlatformContext): Promise<boolean> {
    return menuRepository.restoreItem(resolveScope(context), itemId);
  }

  async duplicateItem(
    itemId: string,
    context: MenuPlatformContext,
  ): Promise<MenuItemRecord | null> {
    return menuRepository.duplicateItem(resolveScope(context), itemId);
  }

  async duplicateMenu(menuId: string, context: MenuPlatformContext): Promise<MenuRecord | null> {
    return menuRepository.duplicateMenu(resolveScope(context), menuId);
  }

  async detectDuplicates(context?: MenuPlatformContext) {
    const records = await this.searchItemRecords({ pageSize: 500 }, context);
    return menuRepository.detectDuplicates(records);
  }

  async setItemAvailability(
    itemId: string,
    isAvailable: boolean,
    context: MenuPlatformContext,
  ): Promise<boolean> {
    return menuRepository.setItemAvailability(resolveScope(context), itemId, isAvailable);
  }

  async setItemFeatured(
    itemId: string,
    isFeatured: boolean,
    context: MenuPlatformContext,
  ): Promise<boolean> {
    return menuRepository.setItemFeatured(resolveScope(context), itemId, isFeatured);
  }

  async assignModifierGroups(
    itemId: string,
    modifierGroupIds: string[],
    context: MenuPlatformContext,
  ): Promise<void> {
    await menuRepository.assignModifierGroups(resolveScope(context), itemId, modifierGroupIds);
  }

  async bulkArchive(itemIds: string[], context: MenuPlatformContext): Promise<number> {
    return menuRepository.bulkArchiveItems(resolveScope(context), itemIds);
  }
}

export const menuService = new MenuService();
