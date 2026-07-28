import type { CategoryData, MenuItemData } from "@/services/menu-management.service";
import type { PublicBusinessMenuInfo } from "@/services/qr-menu.service";

export interface PublicMenuItemView {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  price: number;
  priceLabel: string;
  isAvailable: boolean;
  isFeatured: boolean;
}

export interface PublicMenuCategoryView {
  id: string;
  name: string;
  description: string | null;
  items: PublicMenuItemView[];
}

export interface PublicMenuViewModel {
  business: PublicBusinessMenuInfo;
  categories: PublicMenuCategoryView[];
  uncategorizedItems: PublicMenuItemView[];
}

const priceFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
});

export function formatMenuPrice(price: number): string {
  return priceFormatter.format(price);
}

export function serializePublicMenuItem(item: MenuItemData): PublicMenuItemView {
  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    description: item.description,
    price: item.price,
    priceLabel: formatMenuPrice(item.price),
    isAvailable: item.isAvailable,
    isFeatured: item.isFeatured,
  };
}

export function buildPublicMenuViewModel(
  business: PublicBusinessMenuInfo,
  categories: CategoryData[],
  menuItems: MenuItemData[],
): PublicMenuViewModel {
  const activeCategoryIds = new Set(categories.map((category) => category.id));
  const itemsByCategory = new Map<string, PublicMenuItemView[]>();

  for (const category of categories) {
    itemsByCategory.set(category.id, []);
  }

  const uncategorizedItems: PublicMenuItemView[] = [];

  for (const item of menuItems) {
    const viewItem = serializePublicMenuItem(item);

    if (item.categoryId && activeCategoryIds.has(item.categoryId)) {
      itemsByCategory.get(item.categoryId)?.push(viewItem);
    } else {
      uncategorizedItems.push(viewItem);
    }
  }

  const categoryViews: PublicMenuCategoryView[] = categories.map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    items: itemsByCategory.get(category.id) ?? [],
  }));

  return {
    business,
    categories: categoryViews,
    uncategorizedItems,
  };
}

export function getBusinessDisplayName(business: PublicBusinessMenuInfo): string {
  return business.businessName?.trim() || "Menu";
}
