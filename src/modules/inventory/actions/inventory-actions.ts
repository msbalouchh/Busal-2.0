"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { INVENTORY_ROUTES } from "@/modules/inventory/constants/routes";
import type { IngredientUnit } from "@prisma/client";
import type { StockAdjustmentDirection } from "@prisma/client";
import {
  createIngredient,
  createSupplier,
  deactivateIngredient,
  deactivateSupplier,
  updateIngredient,
  updateSupplier,
} from "@/services/inventory.service";
import { createStockAdjustment } from "@/services/inventory-stock.service";
import { deleteRecipe, upsertRecipe } from "@/services/recipe.service";

function revalidateInventoryPaths() {
  Object.values(INVENTORY_ROUTES).forEach((path) => revalidatePath(path));
}

export async function createIngredientAction(input: {
  name: string;
  sku?: string | null;
  categoryId?: string | null;
  unit: IngredientUnit;
  customUnit?: string | null;
  costPricePence: number;
  currentStock?: string;
  minimumStock?: string;
}) {
  return protectedAction(PERMISSION_CODES.INVENTORY_MANAGE, async ({ business, platform }) => {
    const ingredient = await createIngredient(
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateInventoryPaths();
    return { success: true as const, ingredientId: ingredient.id };
  });
}

export async function updateIngredientAction(
  ingredientId: string,
  input: {
    name: string;
    sku?: string | null;
    categoryId?: string | null;
    unit: IngredientUnit;
    customUnit?: string | null;
    costPricePence: number;
    currentStock?: string;
    minimumStock?: string;
    status?: "ACTIVE" | "INACTIVE";
  },
) {
  return protectedAction(PERMISSION_CODES.INVENTORY_MANAGE, async ({ business, platform }) => {
    await updateIngredient(
      ingredientId,
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateInventoryPaths();
    return { success: true as const };
  });
}

export async function deactivateIngredientAction(input: { ingredientId: string }) {
  return protectedAction(PERMISSION_CODES.INVENTORY_MANAGE, async ({ business, platform }) => {
    await deactivateIngredient(
      input.ingredientId,
      business.id,
      platform.staffSession?.staffId ?? null,
    );
    revalidateInventoryPaths();
    return { success: true as const };
  });
}

export async function createStockAdjustmentAction(input: {
  ingredientId: string;
  direction: StockAdjustmentDirection;
  quantity: string;
  reason: string;
  notes?: string | null;
}) {
  return protectedAction(PERMISSION_CODES.INVENTORY_MANAGE, async ({ business, platform }) => {
    await createStockAdjustment(
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
      platform.branchId,
    );
    revalidateInventoryPaths();
    return { success: true as const };
  });
}

export async function upsertRecipeAction(input: {
  menuItemId: string;
  notes?: string | null;
  lines: Array<{
    ingredientId: string;
    quantity: string;
    unit: IngredientUnit;
    wastePercent?: string;
    notes?: string | null;
  }>;
}) {
  return protectedAction(PERMISSION_CODES.RECIPE_MANAGE, async ({ business, platform }) => {
    const recipe = await upsertRecipe(business.id, platform.staffSession?.staffId ?? null, input);
    revalidateInventoryPaths();
    return { success: true as const, recipeId: recipe.id };
  });
}

export async function deleteRecipeAction(input: { recipeId: string }) {
  return protectedAction(PERMISSION_CODES.RECIPE_MANAGE, async ({ business, platform }) => {
    await deleteRecipe(input.recipeId, business.id, platform.staffSession?.staffId ?? null);
    revalidateInventoryPaths();
    return { success: true as const };
  });
}

export async function createSupplierAction(input: {
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
}) {
  return protectedAction(PERMISSION_CODES.INVENTORY_MANAGE, async ({ business, platform }) => {
    const supplier = await createSupplier(
      business.id,
      platform.staffSession?.staffId ?? null,
      input,
    );
    revalidateInventoryPaths();
    return { success: true as const, supplierId: supplier.id };
  });
}

export async function updateSupplierAction(
  supplierId: string,
  input: {
    name: string;
    contactName?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
    status?: "ACTIVE" | "INACTIVE";
  },
) {
  return protectedAction(PERMISSION_CODES.INVENTORY_MANAGE, async ({ business, platform }) => {
    await updateSupplier(supplierId, business.id, platform.staffSession?.staffId ?? null, input);
    revalidateInventoryPaths();
    return { success: true as const };
  });
}

export async function deactivateSupplierAction(input: { supplierId: string }) {
  return protectedAction(PERMISSION_CODES.INVENTORY_MANAGE, async ({ business, platform }) => {
    await deactivateSupplier(input.supplierId, business.id, platform.staffSession?.staffId ?? null);
    revalidateInventoryPaths();
    return { success: true as const };
  });
}
