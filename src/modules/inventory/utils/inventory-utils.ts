import { formatMoneyPence } from "@/modules/payments/utils/currency";
import type { IngredientData, SupplierData } from "@/services/inventory.service";
import type { getInventoryDashboard } from "@/services/inventory.service";
import type { RecipeData } from "@/services/recipe.service";
import type {
  IngredientView,
  InventoryDashboardView,
  RecipeView,
  SupplierView,
} from "@/modules/inventory/types/inventory";

export function formatInventoryMoney(pence: number): string {
  return formatMoneyPence(pence);
}

export function serializeIngredient(ingredient: IngredientData): IngredientView {
  return {
    id: ingredient.id,
    name: ingredient.name,
    sku: ingredient.sku,
    categoryName: ingredient.categoryName,
    unit: ingredient.unit,
    customUnit: ingredient.customUnit,
    costPricePence: ingredient.costPricePence,
    currentStock: ingredient.currentStock,
    minimumStock: ingredient.minimumStock,
    status: ingredient.status,
  };
}

export function serializeSupplier(supplier: SupplierData): SupplierView {
  return {
    id: supplier.id,
    name: supplier.name,
    contactName: supplier.contactName,
    phone: supplier.phone,
    email: supplier.email,
    address: supplier.address,
    notes: supplier.notes,
    status: supplier.status,
  };
}

export function serializeRecipe(recipe: RecipeData): RecipeView {
  return {
    id: recipe.id,
    menuItemId: recipe.menuItemId,
    menuItemName: recipe.menuItemName,
    notes: recipe.notes,
    totalCostPence: recipe.totalCostPence,
    lines: recipe.lines.map((line) => ({
      id: line.id,
      ingredientId: line.ingredientId,
      ingredientName: line.ingredientName,
      quantity: line.quantity,
      unit: line.unit,
      wastePercent: line.wastePercent,
      lineCostPence: line.lineCostPence,
    })),
  };
}

export function serializeInventoryDashboard(
  dashboard: Awaited<ReturnType<typeof getInventoryDashboard>>,
): InventoryDashboardView {
  return {
    totalIngredients: dashboard.totalIngredients,
    activeIngredients: dashboard.activeIngredients,
    lowStock: dashboard.lowStock.map(serializeIngredient),
    outOfStock: dashboard.outOfStock.map(serializeIngredient),
    recentAdjustments: dashboard.recentAdjustments,
    recentMovements: dashboard.recentMovements,
  };
}
