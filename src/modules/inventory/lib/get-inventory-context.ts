import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeIngredient,
  serializeInventoryDashboard,
  serializeRecipe,
  serializeSupplier,
} from "@/modules/inventory/utils/inventory-utils";
import { listStockMovements } from "@/services/inventory-stock.service";
import {
  getInventoryDashboard,
  listIngredientCategories,
  listIngredients,
  listSuppliers,
} from "@/services/inventory.service";
import { listRecipes } from "@/services/recipe.service";
import { prisma } from "@/lib/prisma";

export const getInventoryOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.INVENTORY_VIEW });
  const dashboard = await getInventoryDashboard(context.business.id, context.branchId);

  return {
    context,
    dashboard: serializeInventoryDashboard(dashboard),
  };
});

export const getInventoryIngredientsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.INVENTORY_VIEW });
  const [ingredients, categories] = await Promise.all([
    listIngredients(context.business.id),
    listIngredientCategories(context.business.id),
  ]);

  return {
    context,
    ingredients: ingredients.map(serializeIngredient),
    categories,
  };
});

export const getInventoryRecipesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.INVENTORY_VIEW });
  const [recipes, ingredients, menuItems] = await Promise.all([
    listRecipes(context.business.id, context.branchId),
    listIngredients(context.business.id),
    prisma.menuItem.findMany({
      where: { businessId: context.business.id },
      select: { id: true, name: true },
      orderBy: [{ name: "asc" }],
    }),
  ]);

  return {
    context,
    recipes: recipes.map(serializeRecipe),
    ingredients: ingredients.map(serializeIngredient),
    menuItems,
  };
});

export const getInventorySuppliersContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.INVENTORY_VIEW });
  const suppliers = await listSuppliers(context.business.id);

  return {
    context,
    suppliers: suppliers.map(serializeSupplier),
  };
});

export const getInventoryMovementsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.INVENTORY_VIEW });
  const movements = await listStockMovements(context.business.id, context.branchId);

  return {
    context,
    movements: movements.map((movement) => ({
      id: movement.id,
      ingredientName: movement.ingredientName,
      movementType: movement.movementType,
      quantityChange: movement.quantityChange,
      balanceAfter: movement.balanceAfter,
      reason: movement.reason,
      createdAt: movement.createdAt.toISOString(),
    })),
  };
});
