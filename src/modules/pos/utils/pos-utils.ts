import type { CartData } from "@/services/cart.service";
import type { CategoryData, MenuItemData } from "@/services/menu-management.service";
import type { TableData } from "@/services/table.service";

import type {
  PosCartView,
  PosMenuCategoryView,
  PosMenuItemView,
  PosTableView,
} from "@/modules/pos/types/pos";

export function serializePosCart(cart: CartData): PosCartView {
  return {
    id: cart.id,
    subtotal: cart.subtotal,
    items: cart.items.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      name: item.menuItemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      notes: item.notes,
    })),
  };
}

export function serializePosCategories(categories: CategoryData[]): PosMenuCategoryView[] {
  return categories
    .filter((category) => category.isActive)
    .map((category) => ({
      id: category.id,
      name: category.name,
      sortOrder: category.sortOrder,
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function serializePosMenuItems(items: MenuItemData[]): PosMenuItemView[] {
  return items
    .filter((item) => item.isAvailable)
    .map((item) => ({
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      description: item.description,
      price: item.price,
      isAvailable: item.isAvailable,
      isFeatured: item.isFeatured,
    }));
}

export function serializePosTables(tables: TableData[]): PosTableView[] {
  return tables
    .filter((table) => table.isActive)
    .map((table) => ({
      id: table.id,
      name: table.name,
      section: table.section,
      capacity: table.capacity,
      status: table.status,
    }));
}

export function filterPosMenuItems(
  items: PosMenuItemView[],
  options: { categoryId?: string | null; searchQuery?: string },
): PosMenuItemView[] {
  const query = options.searchQuery?.trim().toLowerCase() ?? "";

  return items.filter((item) => {
    if (options.categoryId && item.categoryId !== options.categoryId) {
      return false;
    }

    if (!query) {
      return true;
    }

    return (
      item.name.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query)
    );
  });
}

export function formatPosMoney(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(value);
}
