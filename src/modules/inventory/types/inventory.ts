import type {
  IngredientStatus,
  IngredientUnit,
  StockAdjustmentDirection,
  StockMovementType,
  SupplierStatus,
} from "@prisma/client";

export interface IngredientView {
  id: string;
  name: string;
  sku: string | null;
  categoryName: string | null;
  unit: IngredientUnit;
  customUnit: string | null;
  costPricePence: number;
  currentStock: string;
  minimumStock: string;
  status: IngredientStatus;
}

export interface SupplierView {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: SupplierStatus;
}

export interface RecipeView {
  id: string;
  menuItemId: string;
  menuItemName: string;
  notes: string | null;
  totalCostPence: number;
  lines: Array<{
    id: string;
    ingredientId: string;
    ingredientName: string;
    quantity: string;
    unit: IngredientUnit;
    wastePercent: string;
    lineCostPence: number;
  }>;
}

export interface InventoryDashboardView {
  totalIngredients: number;
  activeIngredients: number;
  lowStock: IngredientView[];
  outOfStock: IngredientView[];
  recentAdjustments: Array<{
    id: string;
    ingredientName: string;
    direction: StockAdjustmentDirection;
    quantity: string;
    reason: string;
    createdAt: string;
  }>;
  recentMovements: Array<{
    id: string;
    ingredientName: string;
    movementType: StockMovementType;
    quantityChange: string;
    balanceAfter: string;
    createdAt: string;
  }>;
}
