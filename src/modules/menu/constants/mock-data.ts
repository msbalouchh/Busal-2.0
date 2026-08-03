import {
  AVAILABILITY_MODES,
  MENU_CATEGORY_TYPES,
  MENU_CHANNELS,
  MENU_ITEM_STATUSES,
  MENU_TYPES,
} from "@/modules/menu/constants/menu-status";
import type { MenuItemRecord, MenuRecord } from "@/modules/menu/types/menu";

export const DEFAULT_MENU_SCOPE = {
  tenantId: "tenant-harbour",
  workspaceId: "ws-harbour-kitchen",
  businessId: "biz-harbour-kitchen",
  branchId: "branch-harbour-main",
  userId: "user-harbour-owner",
} as const;

const MENU_ID = "menu-harbour-main";
const CAT_STARTERS = "cat-starters";
const CAT_MAINS = "cat-mains";
const CAT_DRINKS = "cat-drinks";
const SEC_STARTERS = "sec-starters";
const SEC_MAINS = "sec-mains";
const SEC_DRINKS = "sec-drinks";

function buildItem(partial: {
  id: string;
  name: string;
  description: string;
  sku: string;
  categoryId: string;
  sectionId: string;
  basePricePence: number;
  status: (typeof MENU_ITEM_STATUSES)[keyof typeof MENU_ITEM_STATUSES];
  channels: (typeof MENU_CHANNELS)[keyof typeof MENU_CHANNELS][];
  prepTimeMinutes: number;
  categoryType: (typeof MENU_CATEGORY_TYPES)[keyof typeof MENU_CATEGORY_TYPES];
  tags?: string[];
  allergens?: string[];
  variants?: Array<{ name: string; priceDeltaPence: number }>;
  modifiers?: Array<{ group: string; options: string[] }>;
  popularityScore?: number;
}): MenuItemRecord {
  const now = "2026-02-15T12:00:00.000Z";

  return {
    item: {
      id: partial.id,
      menuId: MENU_ID,
      categoryId: partial.categoryId,
      sectionId: partial.sectionId,
      sku: partial.sku,
      name: partial.name,
      description: partial.description,
      status: partial.status,
      channels: partial.channels,
      sortOrder: 0,
      isFeatured: partial.popularityScore ? partial.popularityScore > 0.7 : false,
      createdAt: now,
      updatedAt: now,
    },
    variants: (partial.variants ?? [{ name: "Regular", priceDeltaPence: 0 }]).map((v, i) => ({
      id: `${partial.id}-var-${i + 1}`,
      itemId: partial.id,
      name: v.name,
      sku: null,
      isDefault: i === 0,
      priceDeltaPence: v.priceDeltaPence,
      sortOrder: i,
    })),
    modifierGroups: (partial.modifiers ?? []).map((mg, gi) => ({
      id: `${partial.id}-mg-${gi + 1}`,
      itemId: partial.id,
      name: mg.group,
      minSelections: 0,
      maxSelections: mg.options.length,
      required: false,
      sortOrder: gi,
      modifiers: mg.options.map((opt, mi) => ({
        id: `${partial.id}-mod-${gi + 1}-${mi + 1}`,
        groupId: `${partial.id}-mg-${gi + 1}`,
        name: opt,
        priceDeltaPence: mi === 0 ? 0 : 150,
        isDefault: mi === 0,
        sortOrder: mi,
      })),
    })),
    comboMeals: [],
    mealBundles: [],
    addOns: [],
    pricing: {
      itemId: partial.id,
      basePricePence: partial.basePricePence,
      compareAtPricePence: null,
      currency: "GBP",
      branchOverrides: [
        { branchId: "branch-harbour-main", pricePence: partial.basePricePence },
        { branchId: "branch-harbour-west", pricePence: partial.basePricePence + 50 },
      ],
    },
    taxes: [
      {
        id: `${partial.id}-tax-1`,
        itemId: partial.id,
        name: "VAT",
        rate: 20,
        inclusive: false,
      },
    ],
    availability: {
      itemId: partial.id,
      mode: AVAILABILITY_MODES.SCHEDULED,
      isAvailable: partial.status === MENU_ITEM_STATUSES.ACTIVE,
      schedule: [
        { dayOfWeek: 1, startTime: "12:00", endTime: "22:00" },
        { dayOfWeek: 2, startTime: "12:00", endTime: "22:00" },
        { dayOfWeek: 3, startTime: "12:00", endTime: "22:00" },
        { dayOfWeek: 4, startTime: "12:00", endTime: "22:00" },
        { dayOfWeek: 5, startTime: "12:00", endTime: "23:00" },
        { dayOfWeek: 6, startTime: "10:00", endTime: "23:00" },
        { dayOfWeek: 0, startTime: "10:00", endTime: "22:00" },
      ],
      branchIds: ["branch-harbour-main", "branch-harbour-west"],
      hiddenUntil: null,
    },
    preparation: {
      itemId: partial.id,
      prepTimeMinutes: partial.prepTimeMinutes,
      cookTimeMinutes: Math.max(5, partial.prepTimeMinutes - 3),
      stationId: partial.categoryType === MENU_CATEGORY_TYPES.DRINKS ? "bar" : "kitchen-main",
      instructions: null,
    },
    nutrition: {
      itemId: partial.id,
      calories: 450,
      proteinGrams: 28,
      carbsGrams: 32,
      fatGrams: 18,
      servingSize: "1 portion",
    },
    allergens: (partial.allergens ?? []).map((code, i) => ({
      id: `${partial.id}-alg-${i + 1}`,
      itemId: partial.id,
      code,
      label: code.charAt(0).toUpperCase() + code.slice(1),
    })),
    images: [
      {
        id: `${partial.id}-img-1`,
        itemId: partial.id,
        url: `/images/menu/${partial.sku}.jpg`,
        alt: partial.name,
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    tags: (partial.tags ?? []).map((label, i) => ({
      id: `${partial.id}-tag-${i + 1}`,
      itemId: partial.id,
      label,
      slug: label.toLowerCase().replace(/\s+/g, "-"),
    })),
    aiContext: {
      itemId: partial.id,
      summary: `${partial.name} — ${partial.description.slice(0, 60)}`,
      insights: [
        `Category: ${partial.categoryType.replace("_", " ")}`,
        `Prep time: ${partial.prepTimeMinutes} min`,
      ],
      recommendedActions: ["Review branch pricing quarterly"],
      upsellSuggestions: ["Add side dish", "Upgrade drink size"],
      pricingRecommendationPence: partial.basePricePence + 75,
      popularityScore: partial.popularityScore ?? 0.5,
      duplicateCandidates: [],
      lastGeneratedAt: now,
    },
  };
}

export const MOCK_MENU_ITEMS: MenuItemRecord[] = [
  buildItem({
    id: "item-ribeye",
    name: "Harbour Ribeye",
    description: "28-day aged ribeye with herb butter and seasonal vegetables.",
    sku: "MAIN-RIB-001",
    categoryId: CAT_MAINS,
    sectionId: SEC_MAINS,
    basePricePence: 3200,
    status: MENU_ITEM_STATUSES.ACTIVE,
    channels: [MENU_CHANNELS.DINE_IN, MENU_CHANNELS.QR, MENU_CHANNELS.DELIVERY],
    prepTimeMinutes: 22,
    categoryType: MENU_CATEGORY_TYPES.DINNER,
    tags: ["signature", "chef-special"],
    allergens: ["dairy"],
    variants: [
      { name: "250g", priceDeltaPence: 0 },
      { name: "350g", priceDeltaPence: 800 },
    ],
    modifiers: [{ group: "Cooking", options: ["Medium-rare", "Medium", "Well-done"] }],
    popularityScore: 0.92,
  }),
  buildItem({
    id: "item-burger",
    name: "Classic Harbour Burger",
    description: "Angus beef patty, aged cheddar, house pickles, brioche bun.",
    sku: "MAIN-BRG-002",
    categoryId: CAT_MAINS,
    sectionId: SEC_MAINS,
    basePricePence: 1450,
    status: MENU_ITEM_STATUSES.ACTIVE,
    channels: [MENU_CHANNELS.DINE_IN, MENU_CHANNELS.QR, MENU_CHANNELS.TAKEAWAY, MENU_CHANNELS.POS],
    prepTimeMinutes: 14,
    categoryType: MENU_CATEGORY_TYPES.LUNCH,
    tags: ["popular", "kids-friendly"],
    allergens: ["gluten", "dairy"],
    popularityScore: 0.88,
  }),
  buildItem({
    id: "item-soup",
    name: "Seasonal Soup",
    description: "Chef's daily soup with sourdough.",
    sku: "STR-SUP-003",
    categoryId: CAT_STARTERS,
    sectionId: SEC_STARTERS,
    basePricePence: 695,
    status: MENU_ITEM_STATUSES.SEASONAL,
    channels: [MENU_CHANNELS.DINE_IN, MENU_CHANNELS.QR],
    prepTimeMinutes: 8,
    categoryType: MENU_CATEGORY_TYPES.SPECIAL_OFFERS,
    tags: ["seasonal"],
    popularityScore: 0.45,
  }),
  buildItem({
    id: "item-latte",
    name: "House Latte",
    description: "Double espresso with steamed oat or dairy milk.",
    sku: "DRK-LAT-004",
    categoryId: CAT_DRINKS,
    sectionId: SEC_DRINKS,
    basePricePence: 395,
    status: MENU_ITEM_STATUSES.ACTIVE,
    channels: [MENU_CHANNELS.DINE_IN, MENU_CHANNELS.QR, MENU_CHANNELS.TAKEAWAY],
    prepTimeMinutes: 4,
    categoryType: MENU_CATEGORY_TYPES.DRINKS,
    variants: [
      { name: "Regular", priceDeltaPence: 0 },
      { name: "Large", priceDeltaPence: 60 },
    ],
    modifiers: [{ group: "Milk", options: ["Oat", "Whole", "Skim"] }],
    popularityScore: 0.76,
  }),
  buildItem({
    id: "item-brownie",
    name: "Chocolate Brownie",
    description: "Warm brownie with vanilla ice cream.",
    sku: "DST-BRW-005",
    categoryId: CAT_MAINS,
    sectionId: SEC_MAINS,
    basePricePence: 750,
    status: MENU_ITEM_STATUSES.HIDDEN,
    channels: [MENU_CHANNELS.DINE_IN],
    prepTimeMinutes: 6,
    categoryType: MENU_CATEGORY_TYPES.DESSERTS,
    allergens: ["gluten", "dairy", "eggs"],
    popularityScore: 0.61,
  }),
  buildItem({
    id: "item-breakfast",
    name: "Full Harbour Breakfast",
    description: "Eggs, bacon, sausage, mushrooms, toast, and beans.",
    sku: "BRK-FHB-006",
    categoryId: CAT_STARTERS,
    sectionId: SEC_STARTERS,
    basePricePence: 1295,
    status: MENU_ITEM_STATUSES.DRAFT,
    channels: [MENU_CHANNELS.DINE_IN, MENU_CHANNELS.QR],
    prepTimeMinutes: 16,
    categoryType: MENU_CATEGORY_TYPES.BREAKFAST,
    tags: ["draft"],
    popularityScore: 0.2,
  }),
  buildItem({
    id: "item-archived",
    name: "Legacy Fish Pie",
    description: "Archived menu item retained for reporting.",
    sku: "ARC-FSP-007",
    categoryId: CAT_MAINS,
    sectionId: SEC_MAINS,
    basePricePence: 1595,
    status: MENU_ITEM_STATUSES.ARCHIVED,
    channels: [],
    prepTimeMinutes: 20,
    categoryType: MENU_CATEGORY_TYPES.DINNER,
    popularityScore: 0.05,
  }),
];

export const MOCK_MENU_RECORD: MenuRecord = {
  menu: {
    id: MENU_ID,
    tenantId: DEFAULT_MENU_SCOPE.tenantId,
    workspaceId: DEFAULT_MENU_SCOPE.workspaceId,
    businessId: DEFAULT_MENU_SCOPE.businessId,
    branchId: DEFAULT_MENU_SCOPE.branchId,
    name: "Harbour Kitchen — Main Menu",
    slug: "harbour-main",
    description: "Primary dine-in, QR, delivery, and takeaway menu.",
    menuType: MENU_TYPES.STANDARD,
    channels: [
      MENU_CHANNELS.DINE_IN,
      MENU_CHANNELS.QR,
      MENU_CHANNELS.DELIVERY,
      MENU_CHANNELS.TAKEAWAY,
      MENU_CHANNELS.POS,
    ],
    isDefault: true,
    status: MENU_ITEM_STATUSES.ACTIVE,
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-02-15T12:00:00.000Z",
  },
  categories: [
    {
      id: CAT_STARTERS,
      menuId: MENU_ID,
      name: "Starters",
      categoryType: MENU_CATEGORY_TYPES.LUNCH,
      description: "Small plates and soups",
      sortOrder: 0,
      isVisible: true,
    },
    {
      id: CAT_MAINS,
      menuId: MENU_ID,
      name: "Mains & Desserts",
      categoryType: MENU_CATEGORY_TYPES.DINNER,
      description: "Main courses and sweet finishes",
      sortOrder: 1,
      isVisible: true,
    },
    {
      id: CAT_DRINKS,
      menuId: MENU_ID,
      name: "Drinks",
      categoryType: MENU_CATEGORY_TYPES.DRINKS,
      description: "Hot and cold beverages",
      sortOrder: 2,
      isVisible: true,
    },
  ],
  sections: [
    {
      id: SEC_STARTERS,
      categoryId: CAT_STARTERS,
      name: "Starters",
      description: null,
      sortOrder: 0,
    },
    {
      id: SEC_MAINS,
      categoryId: CAT_MAINS,
      name: "Main Courses",
      description: null,
      sortOrder: 0,
    },
    {
      id: SEC_DRINKS,
      categoryId: CAT_DRINKS,
      name: "Beverages",
      description: null,
      sortOrder: 0,
    },
  ],
  items: MOCK_MENU_ITEMS,
};

export const MOCK_MENU_RECORDS: MenuRecord[] = [MOCK_MENU_RECORD];
