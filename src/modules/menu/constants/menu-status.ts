/** Menu item lifecycle statuses. */
export const MENU_ITEM_STATUSES = {
  DRAFT: "draft",
  ACTIVE: "active",
  HIDDEN: "hidden",
  ARCHIVED: "archived",
  SEASONAL: "seasonal",
} as const;

export type MenuItemStatus = (typeof MENU_ITEM_STATUSES)[keyof typeof MENU_ITEM_STATUSES];

/** Menu category types (daypart / offering). */
export const MENU_CATEGORY_TYPES = {
  BREAKFAST: "breakfast",
  LUNCH: "lunch",
  DINNER: "dinner",
  DRINKS: "drinks",
  DESSERTS: "desserts",
  SPECIAL_OFFERS: "special_offers",
  SEASONAL: "seasonal",
} as const;

export type MenuCategoryType = (typeof MENU_CATEGORY_TYPES)[keyof typeof MENU_CATEGORY_TYPES];

/** Channel-specific menu surfaces. */
export const MENU_CHANNELS = {
  QR: "qr",
  DELIVERY: "delivery",
  DINE_IN: "dine_in",
  TAKEAWAY: "takeaway",
  POS: "pos",
} as const;

export type MenuChannel = (typeof MENU_CHANNELS)[keyof typeof MENU_CHANNELS];

export const MENU_TYPES = {
  STANDARD: "standard",
  TIME_BASED: "time_based",
  BRANCH_SPECIFIC: "branch_specific",
  SEASONAL: "seasonal",
} as const;

export type MenuType = (typeof MENU_TYPES)[keyof typeof MENU_TYPES];

export const AVAILABILITY_MODES = {
  ALWAYS: "always",
  SCHEDULED: "scheduled",
  BRANCH_HOURS: "branch_hours",
} as const;

export type AvailabilityMode = (typeof AVAILABILITY_MODES)[keyof typeof AVAILABILITY_MODES];

export const MENU_AI_TOOL_IDS = {
  CREATE_ITEM: "menu.create-item",
  UPDATE_ITEM: "menu.update-item",
  RECOMMEND_PRICING: "menu.recommend-pricing",
  RECOMMEND_UPSELLS: "menu.recommend-upsells",
  ANALYZE_POPULAR: "menu.analyze-popular-items",
  DETECT_DUPLICATES: "menu.detect-duplicate-items",
} as const;

export type MenuAiToolId = (typeof MENU_AI_TOOL_IDS)[keyof typeof MENU_AI_TOOL_IDS];
