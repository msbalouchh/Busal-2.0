export const INGREDIENT_UNITS = [
  "KG",
  "G",
  "LITRE",
  "ML",
  "PCS",
  "BOTTLE",
  "PACK",
  "TRAY",
  "CUSTOM",
] as const;

export type IngredientUnitOption = (typeof INGREDIENT_UNITS)[number];

export const INGREDIENT_UNIT_LABELS: Record<IngredientUnitOption, string> = {
  KG: "kg",
  G: "g",
  LITRE: "litre",
  ML: "ml",
  PCS: "pcs",
  BOTTLE: "bottle",
  PACK: "pack",
  TRAY: "tray",
  CUSTOM: "custom",
};

export const DEFAULT_INGREDIENT_CATEGORIES = [
  { name: "Meat", slug: "meat" },
  { name: "Vegetables", slug: "vegetables" },
  { name: "Dairy", slug: "dairy" },
  { name: "Spices", slug: "spices" },
  { name: "Drinks", slug: "drinks" },
  { name: "Packaging", slug: "packaging" },
  { name: "Other", slug: "other" },
] as const;

export const STOCK_ADJUSTMENT_REASONS = [
  "Stock count correction",
  "Received delivery",
  "Damaged goods",
  "Spoilage",
  "Theft or loss",
  "Return to supplier",
  "Other",
] as const;

export const INVENTORY_FUTURE_FEATURES = {
  purchaseOrders: "purchaseOrders",
  goodsReceivedNotes: "goodsReceivedNotes",
  multiLocation: "multiLocation",
  batchLotTracking: "batchLotTracking",
  expiryDates: "expiryDates",
  barcodeScanning: "barcodeScanning",
  forecasting: "forecasting",
} as const;
