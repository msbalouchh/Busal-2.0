import { menuRepository } from "@/modules/menu/repository/menu-repository";
import type {
  CreateMenuItemInput,
  MenuItemRecord,
  MenuPlatformContext,
  MenuRecord,
  MenuSearchQuery,
  UpdateMenuItemInput,
} from "@/modules/menu/types/menu";

export class MenuService {
  listMenus(context?: MenuPlatformContext): MenuRecord[] {
    const menus = menuRepository.listMenus();
    if (!context) return menus;

    return menus.filter(
      (record) =>
        record.menu.tenantId === context.tenantId && record.menu.businessId === context.businessId,
    );
  }

  getMenuById(menuId: string): MenuRecord | undefined {
    return menuRepository.findMenuById(menuId);
  }

  getItemById(itemId: string): MenuItemRecord | undefined {
    return menuRepository.findItemById(itemId);
  }

  searchItems(query: MenuSearchQuery, context?: MenuPlatformContext): MenuItemRecord[] {
    return menuRepository.searchItems({
      ...query,
      tenantId: query.tenantId ?? context?.tenantId,
      businessId: query.businessId ?? context?.businessId,
      branchId: query.branchId ?? context?.branchId,
    });
  }

  createItem(input: CreateMenuItemInput): MenuItemRecord {
    return menuRepository.createItem(input);
  }

  updateItem(input: UpdateMenuItemInput): MenuItemRecord | undefined {
    return menuRepository.updateItem(input);
  }

  detectDuplicates(): Array<{ itemId: string; duplicates: string[] }> {
    return menuRepository.detectDuplicates();
  }
}

export const menuService = new MenuService();
