import type {
  AvailabilityMode,
  MenuCategoryType,
  MenuChannel,
  MenuItemStatus,
  MenuType,
} from "@/modules/menu/constants/menu-status";

/** Top-level menu container (supports multiple menus per branch). */
export interface Menu {
  id: string;
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  name: string;
  slug: string;
  description: string | null;
  menuType: MenuType;
  channels: MenuChannel[];
  isDefault: boolean;
  status: MenuItemStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  id: string;
  menuId: string;
  name: string;
  categoryType: MenuCategoryType;
  description: string | null;
  sortOrder: number;
  isVisible: boolean;
}

export interface MenuSection {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  menuId: string;
  categoryId: string;
  sectionId: string;
  sku: string;
  name: string;
  description: string | null;
  status: MenuItemStatus;
  channels: MenuChannel[];
  sortOrder: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ItemVariant {
  id: string;
  itemId: string;
  name: string;
  sku: string | null;
  isDefault: boolean;
  priceDeltaPence: number;
  sortOrder: number;
}

export interface MenuModifier {
  id: string;
  groupId: string;
  name: string;
  priceDeltaPence: number;
  isDefault: boolean;
  sortOrder: number;
}

export interface ModifierGroup {
  id: string;
  itemId: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  required: boolean;
  sortOrder: number;
  modifiers: MenuModifier[];
}

export interface ComboMeal {
  id: string;
  itemId: string;
  name: string;
  includedItemIds: string[];
  bundlePricePence: number;
  savingsPence: number;
}

export interface MealBundle {
  id: string;
  itemId: string;
  name: string;
  componentItemIds: string[];
  bundlePricePence: number;
}

export interface MenuAddOn {
  id: string;
  itemId: string;
  linkedItemId: string;
  label: string;
  pricePence: number;
  isRecommended: boolean;
}

export interface MenuItemPricing {
  itemId: string;
  basePricePence: number;
  compareAtPricePence: number | null;
  currency: string;
  branchOverrides: Array<{
    branchId: string;
    pricePence: number;
  }>;
}

export interface MenuItemTax {
  id: string;
  itemId: string;
  name: string;
  rate: number;
  inclusive: boolean;
}

export interface MenuItemAvailability {
  itemId: string;
  mode: AvailabilityMode;
  isAvailable: boolean;
  schedule: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  branchIds: string[];
  hiddenUntil: string | null;
}

export interface MenuItemPreparation {
  itemId: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  stationId: string | null;
  instructions: string | null;
}

export interface NutritionalInformation {
  itemId: string;
  calories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
  servingSize: string | null;
}

export interface MenuAllergen {
  id: string;
  itemId: string;
  code: string;
  label: string;
}

export interface MenuItemImage {
  id: string;
  itemId: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface MenuItemTag {
  id: string;
  itemId: string;
  label: string;
  slug: string;
}

export interface MenuAiContext {
  itemId: string;
  summary: string;
  insights: string[];
  recommendedActions: string[];
  upsellSuggestions: string[];
  pricingRecommendationPence: number | null;
  popularityScore: number;
  duplicateCandidates: string[];
  lastGeneratedAt: string;
}

/** Full menu item record — single source of truth aggregate. */
export interface MenuItemRecord {
  item: MenuItem;
  variants: ItemVariant[];
  modifierGroups: ModifierGroup[];
  comboMeals: ComboMeal[];
  mealBundles: MealBundle[];
  addOns: MenuAddOn[];
  pricing: MenuItemPricing;
  taxes: MenuItemTax[];
  availability: MenuItemAvailability;
  preparation: MenuItemPreparation;
  nutrition: NutritionalInformation;
  allergens: MenuAllergen[];
  images: MenuItemImage[];
  tags: MenuItemTag[];
  aiContext: MenuAiContext;
}

/** Menu with nested categories, sections, and item records. */
export interface MenuRecord {
  menu: Menu;
  categories: MenuCategory[];
  sections: MenuSection[];
  items: MenuItemRecord[];
}

export interface MenuSearchQuery {
  query?: string;
  tenantId?: string;
  businessId?: string;
  branchId?: string;
  menuId?: string;
  categoryType?: MenuCategoryType;
  status?: MenuItemStatus;
  channel?: MenuChannel;
  limit?: number;
}

export interface CreateMenuItemInput {
  menuId: string;
  categoryId: string;
  sectionId: string;
  name: string;
  description?: string | null;
  sku?: string;
  basePricePence: number;
  status?: MenuItemStatus;
  channels?: MenuChannel[];
  prepTimeMinutes?: number;
}

export interface UpdateMenuItemInput {
  itemId: string;
  name?: string;
  description?: string | null;
  status?: MenuItemStatus;
  basePricePence?: number;
  channels?: MenuChannel[];
  prepTimeMinutes?: number;
}

export interface MenuPlatformContext {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
}

export interface MenuContextValue {
  context: MenuPlatformContext;
  menus: MenuRecord[];
  selectedMenu: MenuRecord | null;
  selectedItem: MenuItemRecord | null;
  selectMenu: (menuId: string | null) => void;
  selectItem: (itemId: string | null) => void;
  searchItems: (query: MenuSearchQuery) => MenuItemRecord[];
  refresh: () => void;
}
