import "server-only";

import { type IngredientUnit, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { branchScope } from "@/modules/business-context/utils/branch-scope";
import { logInventoryAudit } from "@/modules/inventory/utils/inventory-audit";
import {
  calculateRecipeLineCostPence,
  calculateRequiredQuantity,
  decimalFromInput,
} from "@/modules/inventory/utils/inventory-cost";

export interface RecipeLineData {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: string;
  unit: IngredientUnit;
  wastePercent: string;
  notes: string | null;
  lineCostPence: number;
}

export interface RecipeData {
  id: string;
  businessId: string;
  menuItemId: string;
  menuItemName: string;
  notes: string | null;
  totalCostPence: number;
  lines: RecipeLineData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeLineInput {
  ingredientId: string;
  quantity: string | number;
  unit: IngredientUnit;
  wastePercent?: string | number;
  notes?: string | null;
}

export interface RecipeInput {
  menuItemId: string;
  notes?: string | null;
  lines: RecipeLineInput[];
}

const recipeInclude = {
  menuItem: { select: { name: true } },
  lines: {
    orderBy: [{ createdAt: "asc" as const }],
    include: {
      ingredient: { select: { name: true, costPricePence: true } },
    },
  },
} satisfies Prisma.RecipeInclude;

type RecipeRecord = Prisma.RecipeGetPayload<{ include: typeof recipeInclude }>;

function mapRecipeLine(line: RecipeRecord["lines"][number]): RecipeLineData {
  const wastePercent = line.wastePercent;
  const lineCostPence = calculateRecipeLineCostPence(
    line.quantity,
    wastePercent,
    line.ingredient.costPricePence,
  );

  return {
    id: line.id,
    ingredientId: line.ingredientId,
    ingredientName: line.ingredient.name,
    quantity: line.quantity.toString(),
    unit: line.unit,
    wastePercent: wastePercent.toString(),
    notes: line.notes,
    lineCostPence,
  };
}

function mapRecipe(recipe: RecipeRecord): RecipeData {
  const lines = recipe.lines.map(mapRecipeLine);

  return {
    id: recipe.id,
    businessId: recipe.businessId,
    menuItemId: recipe.menuItemId,
    menuItemName: recipe.menuItem.name,
    notes: recipe.notes,
    totalCostPence: lines.reduce((sum, line) => sum + line.lineCostPence, 0),
    lines,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
  };
}

export async function listRecipes(
  businessId: string,
  branchId: string | null = null,
): Promise<RecipeData[]> {
  const recipes = await prisma.recipe.findMany({
    where: {
      businessId,
      menuItem: branchScope(branchId),
    },
    include: recipeInclude,
    orderBy: [{ updatedAt: "desc" }],
  });

  return recipes.map(mapRecipe);
}

export async function getRecipeByMenuItem(
  menuItemId: string,
  businessId: string,
  branchId: string | null = null,
): Promise<RecipeData | null> {
  const recipe = await prisma.recipe.findFirst({
    where: {
      menuItemId,
      businessId,
      menuItem: branchScope(branchId),
    },
    include: recipeInclude,
  });

  return recipe ? mapRecipe(recipe) : null;
}

export async function getRecipe(recipeId: string, businessId: string): Promise<RecipeData> {
  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, businessId },
    include: recipeInclude,
  });

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  return mapRecipe(recipe);
}

export async function calculateMenuItemCostPence(
  menuItemId: string,
  businessId: string,
  branchId: string | null = null,
): Promise<number> {
  const recipe = await getRecipeByMenuItem(menuItemId, businessId, branchId);

  return recipe?.totalCostPence ?? 0;
}

export async function upsertRecipe(
  businessId: string,
  staffId: string | null,
  input: RecipeInput,
  branchId: string | null = null,
): Promise<RecipeData> {
  const menuItem = await prisma.menuItem.findFirst({
    where: { id: input.menuItemId, businessId, ...branchScope(branchId) },
    select: { id: true },
  });

  if (!menuItem) {
    throw new Error("Menu item not found");
  }

  if (input.lines.length === 0) {
    throw new Error("Recipe must contain at least one ingredient line");
  }

  const ingredientIds = input.lines.map((line) => line.ingredientId);
  const ingredients = await prisma.ingredient.findMany({
    where: { businessId, id: { in: ingredientIds }, deletedAt: null, status: "ACTIVE" },
    select: { id: true },
  });

  if (ingredients.length !== new Set(ingredientIds).size) {
    throw new Error("One or more ingredients are invalid");
  }

  const recipe = await prisma.$transaction(async (tx) => {
    const saved = await tx.recipe.upsert({
      where: { menuItemId: input.menuItemId },
      create: {
        businessId,
        menuItemId: input.menuItemId,
        notes: input.notes?.trim() || null,
      },
      update: {
        notes: input.notes?.trim() || null,
      },
      include: recipeInclude,
    });

    await tx.recipeLine.deleteMany({ where: { recipeId: saved.id } });

    for (const line of input.lines) {
      await tx.recipeLine.create({
        data: {
          recipeId: saved.id,
          ingredientId: line.ingredientId,
          quantity: decimalFromInput(line.quantity),
          unit: line.unit,
          wastePercent: decimalFromInput(line.wastePercent ?? 0),
          notes: line.notes?.trim() || null,
        },
      });
    }

    return tx.recipe.findUniqueOrThrow({
      where: { id: saved.id },
      include: recipeInclude,
    });
  });

  await logInventoryAudit(businessId, {
    staffId,
    entityType: "recipe",
    entityId: recipe.id,
    action: "UPSERTED",
    metadata: { menuItemId: input.menuItemId, lineCount: input.lines.length },
  });

  return mapRecipe(recipe);
}

export async function deleteRecipe(
  recipeId: string,
  businessId: string,
  staffId: string | null,
): Promise<void> {
  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, businessId },
    select: { id: true },
  });

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  await prisma.recipe.delete({ where: { id: recipeId } });

  await logInventoryAudit(businessId, {
    staffId,
    entityType: "recipe",
    entityId: recipeId,
    action: "DELETED",
  });
}

export { calculateRequiredQuantity };
