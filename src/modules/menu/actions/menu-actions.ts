"use server";

import { revalidatePath } from "next/cache";

import { MENU_PERMISSIONS } from "@/modules/menu/constants/permissions";
import { MENU_ROUTES } from "@/modules/menu/constants/routes";
import { resolveMenuScope, toMenuPlatformContext } from "@/modules/menu/lib/menu-scope";
import { menuRepository } from "@/modules/menu/repository/menu-repository";
import { menuService } from "@/modules/menu/services/menu.service";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import {
  createCategory,
  createModifierGroup,
  createModifierOption,
  deleteCategory,
  deleteModifierGroup,
  deleteModifierOption,
  reorderCategories,
  setCategoryActiveStatus,
  updateCategory,
  updateModifierGroup,
  updateModifierOption,
  type CategoryInput,
  type ModifierGroupInput,
  type ModifierOptionInput,
} from "@/services/menu-management.service";

function revalidateMenuPages() {
  Object.values(MENU_ROUTES).forEach((path) => revalidatePath(path));
}

export async function createCategoryAction(input: CategoryInput) {
  return protectedAction(MENU_PERMISSIONS.MENU_CREATE, async ({ platform }) => {
    await createCategory(platform.user.id, input);
    revalidateMenuPages();
    return { success: true as const };
  });
}

export async function updateCategoryAction(categoryId: string, input: CategoryInput) {
  return protectedAction(MENU_PERMISSIONS.MENU_UPDATE, async ({ platform }) => {
    await updateCategory(platform.user.id, categoryId, input);
    revalidateMenuPages();
    return { success: true as const };
  });
}

export async function deleteCategoryAction(categoryId: string) {
  return protectedAction(MENU_PERMISSIONS.MENU_DELETE, async ({ platform }) => {
    await deleteCategory(platform.user.id, categoryId);
    revalidateMenuPages();
    return { success: true as const };
  });
}

export async function setCategoryActiveStatusAction(categoryId: string, isActive: boolean) {
  return protectedAction(MENU_PERMISSIONS.MENU_UPDATE, async ({ platform }) => {
    await setCategoryActiveStatus(platform.user.id, categoryId, isActive);
    revalidateMenuPages();
    return { success: true as const };
  });
}

export async function reorderCategoriesAction(orderedIds: string[]) {
  return protectedAction(MENU_PERMISSIONS.MENU_UPDATE, async ({ platform }) => {
    await reorderCategories(platform.user.id, orderedIds);
    revalidateMenuPages();
    return { success: true as const };
  });
}

export async function createMenuItemAction(input: {
  name: string;
  description?: string;
  price: number;
  categoryId?: string | null;
  isAvailable?: boolean;
  isFeatured?: boolean;
  branchId?: string | null;
  menuId?: string;
  sectionId?: string;
}) {
  return protectedAction(MENU_PERMISSIONS.MENU_CREATE, async ({ platform }) => {
    const scope = resolveMenuScope(platform);
    const context = toMenuPlatformContext(scope);
    const menus = await menuRepository.listMenus(scope);
    const menu = menus.find((entry) => entry.menu.id === input.menuId) ?? menus[0];

    if (!menu) {
      throw new Error("No menu found for this business");
    }

    const categoryId = input.categoryId ?? menu.categories[0]?.id;
    const sectionId = input.sectionId ?? menu.sections[0]?.id ?? categoryId;

    if (!categoryId || !sectionId) {
      throw new Error("Category is required");
    }

    await menuService.createItem(
      {
        menuId: menu.menu.id,
        categoryId,
        sectionId,
        name: input.name,
        description: input.description ?? null,
        basePricePence: Math.round(input.price * 100),
        status: input.isAvailable === false ? "hidden" : "active",
        prepTimeMinutes: 10,
      },
      context,
    );

    if (input.isFeatured) {
      const created = await menuService.searchItems({ query: input.name, pageSize: 1 }, context);
      const itemId = created.records[0]?.item.id;
      if (itemId) {
        await menuService.setItemFeatured(itemId, true, context);
      }
    }

    revalidateMenuPages();
    return { success: true as const };
  });
}

export async function updateMenuItemAction(
  itemId: string,
  input: {
    name: string;
    description?: string;
    price: number;
    categoryId?: string | null;
    isAvailable?: boolean;
    isFeatured?: boolean;
    branchId?: string | null;
  },
) {
  return protectedAction(MENU_PERMISSIONS.MENU_UPDATE, async ({ platform }) => {
    const context = toMenuPlatformContext(resolveMenuScope(platform));

    await menuService.updateItem(
      {
        itemId,
        name: input.name,
        description: input.description ?? null,
        basePricePence: Math.round(input.price * 100),
        status: input.isAvailable === false ? "hidden" : "active",
      },
      context,
    );

    if (input.isFeatured !== undefined) {
      await menuService.setItemFeatured(itemId, input.isFeatured, context);
    }

    revalidateMenuPages();
    return { success: true as const };
  });
}

export async function deleteMenuItemAction(itemId: string) {
  return protectedAction(MENU_PERMISSIONS.MENU_DELETE, async ({ platform }) => {
    const context = toMenuPlatformContext(resolveMenuScope(platform));
    await menuService.archiveItem(itemId, context);
    revalidateMenuPages();
    return { success: true as const };
  });
}

export async function restoreMenuItemAction(itemId: string) {
  return protectedAction(MENU_PERMISSIONS.MENU_MANAGE, async ({ platform }) => {
    const context = toMenuPlatformContext(resolveMenuScope(platform));
    await menuService.restoreItem(itemId, context);
    revalidateMenuPages();
    return { success: true as const };
  });
}

export async function setMenuItemAvailabilityAction(itemId: string, isAvailable: boolean) {
  return protectedAction(MENU_PERMISSIONS.MENU_UPDATE, async ({ platform }) => {
    const context = toMenuPlatformContext(resolveMenuScope(platform));
    await menuService.setItemAvailability(itemId, isAvailable, context);
    revalidateMenuPages();
    return { success: true as const };
  });
}

export async function setMenuItemFeaturedAction(itemId: string, isFeatured: boolean) {
  return protectedAction(MENU_PERMISSIONS.MENU_UPDATE, async ({ platform }) => {
    const context = toMenuPlatformContext(resolveMenuScope(platform));
    await menuService.setItemFeatured(itemId, isFeatured, context);
    revalidateMenuPages();
    return { success: true as const };
  });
}

export async function duplicateMenuItemAction(itemId: string) {
  return protectedAction(MENU_PERMISSIONS.MENU_CREATE, async ({ platform }) => {
    const context = toMenuPlatformContext(resolveMenuScope(platform));
    await menuService.duplicateItem(itemId, context);
    revalidateMenuPages();
    return { success: true as const };
  });
}

export async function createModifierGroupAction(input: ModifierGroupInput) {
  return protectedAction(MENU_PERMISSIONS.MENU_CREATE, async ({ platform }) => {
    await createModifierGroup(platform.user.id, input);
    revalidateMenuPages();
    return { success: true as const };
  });
}

export async function updateModifierGroupAction(groupId: string, input: ModifierGroupInput) {
  return protectedAction(MENU_PERMISSIONS.MENU_UPDATE, async ({ platform }) => {
    await updateModifierGroup(platform.user.id, groupId, input);
    revalidateMenuPages();
    return { success: true as const };
  });
}

export async function deleteModifierGroupAction(groupId: string) {
  return protectedAction(MENU_PERMISSIONS.MENU_DELETE, async ({ platform }) => {
    await deleteModifierGroup(platform.user.id, groupId);
    revalidateMenuPages();
    return { success: true as const };
  });
}

export async function createModifierOptionAction(groupId: string, input: ModifierOptionInput) {
  return protectedAction(MENU_PERMISSIONS.MENU_CREATE, async ({ platform }) => {
    await createModifierOption(platform.user.id, groupId, input);
    revalidateMenuPages();
    return { success: true as const };
  });
}

export async function updateModifierOptionAction(optionId: string, input: ModifierOptionInput) {
  return protectedAction(MENU_PERMISSIONS.MENU_UPDATE, async ({ platform }) => {
    await updateModifierOption(platform.user.id, optionId, input);
    revalidateMenuPages();
    return { success: true as const };
  });
}

export async function deleteModifierOptionAction(optionId: string) {
  return protectedAction(MENU_PERMISSIONS.MENU_DELETE, async ({ platform }) => {
    await deleteModifierOption(platform.user.id, optionId);
    revalidateMenuPages();
    return { success: true as const };
  });
}

export async function assignModifierGroupsAction(itemId: string, modifierGroupIds: string[]) {
  return protectedAction(MENU_PERMISSIONS.MENU_UPDATE, async ({ platform }) => {
    const context = toMenuPlatformContext(resolveMenuScope(platform));
    await menuService.assignModifierGroups(itemId, modifierGroupIds, context);
    revalidateMenuPages();
    return { success: true as const };
  });
}
