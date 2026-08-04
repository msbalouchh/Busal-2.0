import type {
  CategoryStatus,
  MenuStatus,
  MenuType as PrismaMenuType,
  Prisma,
  ProductStatus,
  ProductType,
} from "@prisma/client";

import {
  AVAILABILITY_MODES,
  MENU_CATEGORY_TYPES,
  MENU_CHANNELS,
  MENU_ITEM_STATUSES,
  MENU_TYPES,
  type MenuCategoryType,
  type MenuChannel,
  type MenuItemStatus,
  type MenuType,
} from "@/modules/menu/constants/menu-status";
import type { MenuTenantScope } from "@/modules/menu/lib/menu-scope";
import type {
  ItemVariant,
  Menu,
  MenuAddOn,
  MenuAiContext,
  MenuAllergen,
  MenuCategory,
  MenuItemImage,
  MenuItemPricing,
  MenuItemRecord,
  MenuItemTag,
  MenuItemTax,
  MenuRecord,
  MenuSection,
  ModifierGroup,
} from "@/modules/menu/types/menu";

function decimalToPence(value: Prisma.Decimal | number | null | undefined): number {
  if (value == null) {
    return 0;
  }

  return Math.round(Number(value) * 100);
}

function parseStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

export function mapProductStatusToModule(status: ProductStatus): MenuItemStatus {
  switch (status) {
    case "ACTIVE":
      return MENU_ITEM_STATUSES.ACTIVE;
    case "INACTIVE":
      return MENU_ITEM_STATUSES.HIDDEN;
    case "ARCHIVED":
      return MENU_ITEM_STATUSES.ARCHIVED;
    default:
      return MENU_ITEM_STATUSES.DRAFT;
  }
}

export function mapModuleStatusToProduct(status: MenuItemStatus): ProductStatus {
  switch (status) {
    case MENU_ITEM_STATUSES.ACTIVE:
    case MENU_ITEM_STATUSES.SEASONAL:
      return "ACTIVE";
    case MENU_ITEM_STATUSES.HIDDEN:
      return "INACTIVE";
    case MENU_ITEM_STATUSES.ARCHIVED:
      return "ARCHIVED";
    default:
      return "INACTIVE";
  }
}

export function mapMenuStatusToModule(status: MenuStatus): MenuItemStatus {
  switch (status) {
    case "ACTIVE":
      return MENU_ITEM_STATUSES.ACTIVE;
    case "DRAFT":
      return MENU_ITEM_STATUSES.DRAFT;
    case "ARCHIVED":
      return MENU_ITEM_STATUSES.ARCHIVED;
    default:
      return MENU_ITEM_STATUSES.HIDDEN;
  }
}

export function mapPrismaMenuType(type: PrismaMenuType): MenuType {
  switch (type) {
    case "SEASONAL":
      return MENU_TYPES.SEASONAL;
    case "BREAKFAST":
    case "LUNCH":
    case "DINNER":
      return MENU_TYPES.TIME_BASED;
    default:
      return MENU_TYPES.STANDARD;
  }
}

function inferCategoryType(name: string): MenuCategoryType {
  const normalized = name.toLowerCase();

  if (normalized.includes("breakfast")) return MENU_CATEGORY_TYPES.BREAKFAST;
  if (normalized.includes("lunch")) return MENU_CATEGORY_TYPES.LUNCH;
  if (normalized.includes("dinner")) return MENU_CATEGORY_TYPES.DINNER;
  if (normalized.includes("drink")) return MENU_CATEGORY_TYPES.DRINKS;
  if (normalized.includes("dessert")) return MENU_CATEGORY_TYPES.DESSERTS;
  if (normalized.includes("season")) return MENU_CATEGORY_TYPES.SEASONAL;
  if (normalized.includes("special")) return MENU_CATEGORY_TYPES.SPECIAL_OFFERS;

  return MENU_CATEGORY_TYPES.LUNCH;
}

function defaultChannels(): MenuChannel[] {
  return [
    MENU_CHANNELS.DINE_IN,
    MENU_CHANNELS.TAKEAWAY,
    MENU_CHANNELS.DELIVERY,
    MENU_CHANNELS.QR,
    MENU_CHANNELS.POS,
  ];
}

function computePopularityScore(product: { isFeatured: boolean; displayOrder: number }): number {
  return product.isFeatured ? 0.85 : Math.max(0.1, 0.5 - product.displayOrder * 0.02);
}

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: {
      include: {
        parentCategory: { select: { id: true; name: true } };
        menu: { select: { id: true; branchId: true } };
      };
    };
    modifierGroups: {
      include: {
        modifierGroup: { include: { options: true } };
      };
    };
  };
}>;

type CategoryWithRelations = Prisma.CategoryGetPayload<{
  include: {
    childCategories: true;
    products: {
      include: {
        modifierGroups: {
          include: {
            modifierGroup: { include: { options: true } };
          };
        };
      };
    };
  };
}>;

type MenuWithRelations = Prisma.MenuGetPayload<{
  include: {
    categories: {
      include: {
        childCategories: true;
        products: {
          include: {
            modifierGroups: {
              include: {
                modifierGroup: { include: { options: true } };
              };
            };
          };
        };
      };
    };
  };
}>;

export function mapProductToItemRecord(
  product: ProductWithRelations,
  _scope: MenuTenantScope,
): MenuItemRecord {
  const menuId = product.category.menuId;
  const parentCategoryId = product.category.parentCategoryId;
  const categoryId = parentCategoryId ?? product.categoryId;
  const sectionId = product.categoryId;
  const basePricePence = decimalToPence(product.price);
  const popularityScore = computePopularityScore(product);
  const allergens = parseStringArray(product.allergens);
  const ingredients = parseStringArray(product.ingredients);
  const gallery = parseStringArray(product.gallery);

  const modifierGroups: ModifierGroup[] = product.modifierGroups.map((assignment, index) => ({
    id: assignment.modifierGroup.id,
    itemId: product.id,
    name: assignment.modifierGroup.name,
    minSelections: assignment.modifierGroup.minimumSelection,
    maxSelections: assignment.modifierGroup.maximumSelection,
    required: assignment.modifierGroup.isRequired,
    sortOrder: assignment.displayOrder ?? index,
    modifiers: assignment.modifierGroup.options.map((option, optionIndex) => ({
      id: option.id,
      groupId: assignment.modifierGroup.id,
      name: option.name,
      priceDeltaPence: decimalToPence(option.priceAdjustment),
      isDefault: optionIndex === 0,
      sortOrder: option.displayOrder,
    })),
  }));

  const variants: ItemVariant[] = [
    {
      id: `${product.id}-default`,
      itemId: product.id,
      name: "Regular",
      sku: product.sku,
      isDefault: true,
      priceDeltaPence: 0,
      sortOrder: 0,
    },
  ];

  const addOns: MenuAddOn[] =
    product.productType === "ADDON"
      ? [
          {
            id: `${product.id}-addon`,
            itemId: product.id,
            linkedItemId: product.id,
            label: product.name,
            pricePence: basePricePence,
            isRecommended: product.isFeatured,
          },
        ]
      : [];

  const pricing: MenuItemPricing = {
    itemId: product.id,
    basePricePence,
    compareAtPricePence: null,
    currency: "GBP",
    branchOverrides: product.category.menu.branchId
      ? [{ branchId: product.category.menu.branchId, pricePence: basePricePence }]
      : [],
  };

  const taxes: MenuItemTax[] =
    product.taxRate != null
      ? [
          {
            id: `${product.id}-tax`,
            itemId: product.id,
            name: "VAT",
            rate: Number(product.taxRate),
            inclusive: false,
          },
        ]
      : [];

  const images: MenuItemImage[] = [
    ...(product.image
      ? [
          {
            id: `${product.id}-img-primary`,
            itemId: product.id,
            url: product.image,
            alt: product.name,
            isPrimary: true,
            sortOrder: 0,
          },
        ]
      : []),
    ...gallery.map((url, index) => ({
      id: `${product.id}-img-${index + 1}`,
      itemId: product.id,
      url,
      alt: product.name,
      isPrimary: false,
      sortOrder: index + 1,
    })),
  ];

  const tags: MenuItemTag[] = [
    ...(product.isVegetarian
      ? [{ id: `${product.id}-veg`, itemId: product.id, label: "Vegetarian", slug: "vegetarian" }]
      : []),
    ...(product.isVegan
      ? [{ id: `${product.id}-vegan`, itemId: product.id, label: "Vegan", slug: "vegan" }]
      : []),
    ...(product.isGlutenFree
      ? [{ id: `${product.id}-gf`, itemId: product.id, label: "Gluten Free", slug: "gluten-free" }]
      : []),
    ...(product.isFeatured
      ? [{ id: `${product.id}-featured`, itemId: product.id, label: "Featured", slug: "featured" }]
      : []),
  ];

  const allergenRecords: MenuAllergen[] = allergens.map((label, index) => ({
    id: `${product.id}-allergen-${index}`,
    itemId: product.id,
    code: label.toLowerCase().replace(/\s+/g, "-"),
    label,
  }));

  const aiContext: MenuAiContext = {
    itemId: product.id,
    summary: `${product.name} · £${(basePricePence / 100).toFixed(2)}`,
    insights: ingredients.length > 0 ? [`Ingredients: ${ingredients.slice(0, 3).join(", ")}`] : [],
    recommendedActions: product.image ? [] : ["Add product image"],
    upsellSuggestions: modifierGroups.length > 0 ? [`Offer ${modifierGroups[0]?.name}`] : [],
    pricingRecommendationPence: basePricePence + (popularityScore > 0.7 ? 75 : 0),
    popularityScore,
    duplicateCandidates: [],
    lastGeneratedAt: product.updatedAt.toISOString(),
  };

  return {
    item: {
      id: product.id,
      menuId,
      categoryId,
      sectionId,
      sku: product.sku,
      name: product.name,
      description: product.description,
      status: mapProductStatusToModule(product.status),
      channels: defaultChannels(),
      sortOrder: product.displayOrder,
      isFeatured: product.isFeatured,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    },
    variants,
    modifierGroups,
    comboMeals: [],
    mealBundles: product.productType === "COMBO" ? [] : [],
    addOns,
    pricing,
    taxes,
    availability: {
      itemId: product.id,
      mode: AVAILABILITY_MODES.ALWAYS,
      isAvailable: product.status === "ACTIVE",
      schedule: [],
      branchIds: product.category.menu.branchId ? [product.category.menu.branchId] : [],
      hiddenUntil: null,
    },
    preparation: {
      itemId: product.id,
      prepTimeMinutes: product.preparationTime ?? 10,
      cookTimeMinutes: product.preparationTime ?? 10,
      stationId: null,
      instructions: product.shortDescription,
    },
    nutrition: {
      itemId: product.id,
      calories: product.calories,
      proteinGrams: null,
      carbsGrams: null,
      fatGrams: null,
      servingSize: null,
    },
    allergens: allergenRecords,
    images,
    tags,
    aiContext,
  };
}

export function mapCategoryToDomain(
  category: {
    id: string;
    name: string;
    description: string | null;
    displayOrder: number;
    status: CategoryStatus;
  },
  menuId: string,
): MenuCategory {
  return {
    id: category.id,
    menuId,
    name: category.name,
    categoryType: inferCategoryType(category.name),
    description: category.description,
    sortOrder: category.displayOrder,
    isVisible: category.status === "ACTIVE",
  };
}

export function mapSectionToDomain(
  section: CategoryWithRelations["childCategories"][number],
  _menuId: string,
): MenuSection {
  return {
    id: section.id,
    categoryId: section.parentCategoryId ?? section.id,
    name: section.name,
    description: section.description,
    sortOrder: section.displayOrder,
  };
}

export function mapMenuToRecord(menu: MenuWithRelations, scope: MenuTenantScope): MenuRecord {
  const topLevelCategories = menu.categories.filter(
    (category) => category.parentCategoryId == null,
  );
  const categories: MenuCategory[] = topLevelCategories.map((category) =>
    mapCategoryToDomain(category, menu.id),
  );
  const sections: MenuSection[] = topLevelCategories.flatMap((category) =>
    category.childCategories.map((section) => mapSectionToDomain(section, menu.id)),
  );

  const items: MenuItemRecord[] = menu.categories.flatMap((category) =>
    category.products.map((product) =>
      mapProductToItemRecord(
        {
          ...product,
          category: {
            ...category,
            parentCategory: category.parentCategoryId
              ? { id: category.parentCategoryId, name: "" }
              : null,
            menu: { id: menu.id, branchId: menu.branchId },
          },
        },
        scope,
      ),
    ),
  );

  const menuDomain: Menu = {
    id: menu.id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId: menu.branchId ?? scope.branchId ?? scope.businessId,
    name: menu.name,
    slug: menu.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: menu.description,
    menuType: mapPrismaMenuType(menu.menuType),
    channels: defaultChannels(),
    isDefault: menu.isDefault,
    status: mapMenuStatusToModule(menu.status),
    sortOrder: menu.displayOrder,
    createdAt: menu.createdAt.toISOString(),
    updatedAt: menu.updatedAt.toISOString(),
  };

  return { menu: menuDomain, categories, sections, items };
}

export function mapCategoryStatusToActive(status: CategoryStatus): boolean {
  return status === "ACTIVE";
}

export function mapProductTypeToModule(type: ProductType): string {
  return type.toLowerCase();
}

export type { ProductWithRelations, MenuWithRelations, CategoryWithRelations };
