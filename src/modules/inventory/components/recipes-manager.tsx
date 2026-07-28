"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteRecipeAction,
  upsertRecipeAction,
} from "@/modules/inventory/actions/inventory-actions";
import {
  INGREDIENT_UNIT_LABELS,
  INGREDIENT_UNITS,
  type IngredientUnitOption,
} from "@/modules/inventory/constants/inventory";
import type { IngredientView, RecipeView } from "@/modules/inventory/types/inventory";
import { formatInventoryMoney } from "@/modules/inventory/utils/inventory-utils";

interface RecipesManagerProps {
  recipes: RecipeView[];
  ingredients: IngredientView[];
  menuItems: Array<{ id: string; name: string }>;
}

export function RecipesManager({ recipes, ingredients, menuItems }: RecipesManagerProps) {
  const [recipeList, setRecipeList] = useState(recipes);
  const [menuItemId, setMenuItemId] = useState(menuItems[0]?.id ?? "");
  const [ingredientId, setIngredientId] = useState(ingredients[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<IngredientUnitOption>("G");
  const [wastePercent, setWastePercent] = useState("0");
  const [isPending, startTransition] = useTransition();

  const saveRecipe = () => {
    if (!menuItemId || !ingredientId) {
      toast.error("Select a menu item and ingredient");
      return;
    }

    startTransition(async () => {
      try {
        const existing = recipeList.find((recipe) => recipe.menuItemId === menuItemId);
        const lines = existing
          ? [
              ...existing.lines.map((line) => ({
                ingredientId: line.ingredientId,
                quantity: line.quantity,
                unit: line.unit,
                wastePercent: line.wastePercent,
              })),
              { ingredientId, quantity, unit, wastePercent },
            ]
          : [{ ingredientId, quantity, unit, wastePercent }];

        const result = await upsertRecipeAction({ menuItemId, lines });
        const menuItemName = menuItems.find((item) => item.id === menuItemId)?.name ?? "Menu Item";
        const ingredient = ingredients.find((item) => item.id === ingredientId);
        const lineCostPence = ingredient
          ? Math.round(
              Number.parseFloat(quantity) *
                (1 + Number.parseFloat(wastePercent) / 100) *
                ingredient.costPricePence,
            )
          : 0;

        setRecipeList((current) => {
          const nextRecipe: RecipeView = {
            id: result.recipeId,
            menuItemId,
            menuItemName,
            notes: null,
            totalCostPence: (existing?.totalCostPence ?? 0) + lineCostPence,
            lines: [
              ...(existing?.lines ?? []),
              {
                id: `temp-${Date.now()}`,
                ingredientId,
                ingredientName: ingredient?.name ?? "Ingredient",
                quantity,
                unit,
                wastePercent,
                lineCostPence,
              },
            ],
          };

          const withoutExisting = current.filter((recipe) => recipe.menuItemId !== menuItemId);
          return [nextRecipe, ...withoutExisting];
        });

        toast.success("Recipe saved");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Recipe save failed");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="bg-card space-y-3 rounded-xl border p-4 shadow-sm">
        <h3 className="text-lg font-semibold">Recipes</h3>
        {recipeList.length === 0 ? (
          <p className="text-muted-foreground text-sm">No recipes configured yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {recipeList.map((recipe) => (
              <li key={recipe.id} className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{recipe.menuItemName}</p>
                    <p className="text-muted-foreground text-xs">
                      Cost: {formatInventoryMoney(recipe.totalCostPence)} · {recipe.lines.length}{" "}
                      ingredients
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        try {
                          await deleteRecipeAction({ recipeId: recipe.id });
                          setRecipeList((current) =>
                            current.filter((entry) => entry.id !== recipe.id),
                          );
                          toast.success("Recipe deleted");
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Delete failed");
                        }
                      })
                    }
                  >
                    Delete
                  </Button>
                </div>
                <ul className="text-sm">
                  {recipe.lines.map((line) => (
                    <li key={line.id}>
                      {line.quantity} {INGREDIENT_UNIT_LABELS[line.unit as IngredientUnitOption]}{" "}
                      {line.ingredientName} · {formatInventoryMoney(line.lineCostPence)}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-card space-y-3 rounded-xl border p-4 shadow-sm">
        <h3 className="text-lg font-semibold">Add Recipe Line</h3>
        <select
          className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
          value={menuItemId}
          onChange={(event) => setMenuItemId(event.target.value)}
        >
          {menuItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
          value={ingredientId}
          onChange={(event) => setIngredientId(event.target.value)}
        >
          {ingredients.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <Input
          placeholder="Quantity"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
        <select
          className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
          value={unit}
          onChange={(event) => setUnit(event.target.value as IngredientUnitOption)}
        >
          {INGREDIENT_UNITS.map((entry) => (
            <option key={entry} value={entry}>
              {INGREDIENT_UNIT_LABELS[entry]}
            </option>
          ))}
        </select>
        <Input
          placeholder="Waste %"
          value={wastePercent}
          onChange={(event) => setWastePercent(event.target.value)}
        />
        <Button type="button" disabled={isPending} onClick={saveRecipe}>
          Save Recipe Line
        </Button>
      </section>
    </div>
  );
}
