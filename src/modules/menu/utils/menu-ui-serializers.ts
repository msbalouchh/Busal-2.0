import type {
  CategoryData,
  MenuItemData,
  ModifierGroupData,
} from "@/services/menu-management.service";
import type { MenuItemRecord, MenuRecord } from "@/modules/menu/types/menu";
import { mapCategoryStatusToActive } from "@/modules/menu/lib/menu-mappers";

export function serializeMenuItemForUi(record: MenuItemRecord, businessId: string): MenuItemData {
  return {
    id: record.item.id,
    businessId,
    categoryId: record.item.categoryId,
    name: record.item.name,
    description: record.item.description,
    price: record.pricing.basePricePence / 100,
    isAvailable: record.availability.isAvailable,
    isFeatured: record.item.isFeatured,
    sortOrder: record.item.sortOrder,
    category: { id: record.item.categoryId, name: record.item.categoryId },
    modifierGroupIds: record.modifierGroups.map((group) => group.id),
  };
}

export function serializeCategoryForUi(
  record: MenuRecord,
  categoryId: string,
  itemCount: number,
): CategoryData {
  const category = record.categories.find((entry) => entry.id === categoryId);

  return {
    id: categoryId,
    businessId: record.menu.businessId,
    name: category?.name ?? "Category",
    description: category?.description ?? null,
    sortOrder: category?.sortOrder ?? 0,
    isActive: category?.isVisible ?? true,
    itemCount,
  };
}

export function serializeModifierGroupForUi(group: {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  options: Array<{
    id: string;
    name: string;
    priceAdjustment: number;
    isDefault: boolean;
    sortOrder: number;
  }>;
  assignedItemCount: number;
}): ModifierGroupData {
  return {
    id: group.id,
    businessId: group.businessId,
    name: group.name,
    description: group.description,
    minSelections: group.minSelections,
    maxSelections: group.maxSelections,
    isRequired: group.isRequired,
    assignedItemCount: group.assignedItemCount,
    options: group.options.map((option) => ({
      id: option.id,
      modifierGroupId: group.id,
      name: option.name,
      priceAdjustment: option.priceAdjustment,
      isDefault: option.isDefault,
      sortOrder: option.sortOrder,
    })),
  };
}

export function recordsToUiContext(
  menus: MenuRecord[],
  modifierGroups: ModifierGroupData[],
): {
  categories: CategoryData[];
  menuItems: MenuItemData[];
  modifierGroups: ModifierGroupData[];
} {
  const defaultMenu = menus[0];
  const categories =
    defaultMenu?.categories.map((category) =>
      serializeCategoryForUi(
        defaultMenu,
        category.id,
        defaultMenu.items.filter((item) => item.item.categoryId === category.id).length,
      ),
    ) ?? [];

  const menuItems = menus.flatMap((menu) =>
    menu.items.map((item) => serializeMenuItemForUi(item, menu.menu.businessId)),
  );

  return { categories, menuItems, modifierGroups };
}

export { mapCategoryStatusToActive };
