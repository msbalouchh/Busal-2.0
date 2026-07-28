"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createIngredientAction,
  createStockAdjustmentAction,
  deactivateIngredientAction,
  updateIngredientAction,
} from "@/modules/inventory/actions/inventory-actions";
import {
  INGREDIENT_UNIT_LABELS,
  INGREDIENT_UNITS,
  STOCK_ADJUSTMENT_REASONS,
  type IngredientUnitOption,
} from "@/modules/inventory/constants/inventory";
import type { IngredientView } from "@/modules/inventory/types/inventory";
import { formatInventoryMoney } from "@/modules/inventory/utils/inventory-utils";

interface IngredientsManagerProps {
  ingredients: IngredientView[];
  categories: Array<{ id: string; name: string }>;
}

const emptyForm = {
  name: "",
  sku: "",
  categoryId: "",
  unit: "KG" as IngredientUnitOption,
  customUnit: "",
  costPricePence: "",
  currentStock: "0",
  minimumStock: "0",
};

export function IngredientsManager({ ingredients, categories }: IngredientsManagerProps) {
  const [items, setItems] = useState(ingredients);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adjustIngredientId, setAdjustIngredientId] = useState("");
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustReason, setAdjustReason] = useState<string>(STOCK_ADJUSTMENT_REASONS[0]);
  const [isPending, startTransition] = useTransition();

  const editingItem = useMemo(
    () => items.find((item) => item.id === editingId) ?? null,
    [editingId, items],
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const loadEditing = (item: IngredientView) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      sku: item.sku ?? "",
      categoryId: categories.find((category) => category.name === item.categoryName)?.id ?? "",
      unit: item.unit as IngredientUnitOption,
      customUnit: item.customUnit ?? "",
      costPricePence: String(item.costPricePence),
      currentStock: item.currentStock,
      minimumStock: item.minimumStock,
    });
  };

  const saveIngredient = () => {
    const costPricePence = Number.parseInt(form.costPricePence, 10);
    if (!form.name.trim() || !Number.isInteger(costPricePence)) {
      toast.error("Enter a valid name and cost in pence");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          name: form.name,
          sku: form.sku || null,
          categoryId: form.categoryId || null,
          unit: form.unit,
          customUnit: form.unit === "CUSTOM" ? form.customUnit : null,
          costPricePence,
          currentStock: form.currentStock,
          minimumStock: form.minimumStock,
          status: "ACTIVE" as const,
        };

        if (editingId) {
          await updateIngredientAction(editingId, payload);
          setItems((current) =>
            current.map((item) =>
              item.id === editingId
                ? {
                    ...item,
                    ...payload,
                    categoryName:
                      categories.find((category) => category.id === payload.categoryId)?.name ??
                      null,
                  }
                : item,
            ),
          );
          toast.success("Ingredient updated");
        } else {
          const result = await createIngredientAction(payload);
          setItems((current) => [
            ...current,
            {
              id: result.ingredientId,
              name: payload.name,
              sku: payload.sku,
              categoryName:
                categories.find((category) => category.id === payload.categoryId)?.name ?? null,
              unit: payload.unit,
              customUnit: payload.customUnit,
              costPricePence,
              currentStock: payload.currentStock ?? "0",
              minimumStock: payload.minimumStock ?? "0",
              status: "ACTIVE",
            },
          ]);
          toast.success("Ingredient created");
        }
        resetForm();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed");
      }
    });
  };

  const adjustStock = () => {
    if (!adjustIngredientId || !adjustQuantity.trim()) {
      toast.error("Select an ingredient and quantity");
      return;
    }

    startTransition(async () => {
      try {
        await createStockAdjustmentAction({
          ingredientId: adjustIngredientId,
          direction: "INCREASE",
          quantity: adjustQuantity,
          reason: adjustReason,
        });
        toast.success("Stock adjusted");
        setAdjustQuantity("");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Adjustment failed");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="bg-card space-y-3 rounded-xl border p-4 shadow-sm">
        <h3 className="text-lg font-semibold">Ingredients</h3>
        <ul className="divide-y rounded-lg border">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-muted-foreground text-xs">
                  {item.categoryName ?? "Uncategorised"} · {item.currentStock}{" "}
                  {INGREDIENT_UNIT_LABELS[item.unit as IngredientUnitOption]} ·{" "}
                  {formatInventoryMoney(item.costPricePence)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => loadEditing(item)}>
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        await deactivateIngredientAction({ ingredientId: item.id });
                        setItems((current) => current.filter((entry) => entry.id !== item.id));
                        toast.success("Ingredient deactivated");
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Deactivate failed");
                      }
                    })
                  }
                >
                  Deactivate
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-6">
        <div className="bg-card space-y-3 rounded-xl border p-4 shadow-sm">
          <h3 className="text-lg font-semibold">
            {editingItem ? "Edit Ingredient" : "Add Ingredient"}
          </h3>
          <Input
            placeholder="Name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          <Input
            placeholder="SKU (optional)"
            value={form.sku}
            onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
          />
          <select
            className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
            value={form.categoryId}
            onChange={(event) =>
              setForm((current) => ({ ...current, categoryId: event.target.value }))
            }
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
            value={form.unit}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                unit: event.target.value as IngredientUnitOption,
              }))
            }
          >
            {INGREDIENT_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {INGREDIENT_UNIT_LABELS[unit]}
              </option>
            ))}
          </select>
          {form.unit === "CUSTOM" ? (
            <Input
              placeholder="Custom unit"
              value={form.customUnit}
              onChange={(event) =>
                setForm((current) => ({ ...current, customUnit: event.target.value }))
              }
            />
          ) : null}
          <Input
            placeholder="Cost price (pence)"
            inputMode="numeric"
            value={form.costPricePence}
            onChange={(event) =>
              setForm((current) => ({ ...current, costPricePence: event.target.value }))
            }
          />
          <Input
            placeholder="Current stock"
            value={form.currentStock}
            onChange={(event) =>
              setForm((current) => ({ ...current, currentStock: event.target.value }))
            }
          />
          <Input
            placeholder="Minimum stock"
            value={form.minimumStock}
            onChange={(event) =>
              setForm((current) => ({ ...current, minimumStock: event.target.value }))
            }
          />
          <div className="flex gap-2">
            <Button type="button" disabled={isPending} onClick={saveIngredient}>
              {editingItem ? "Update" : "Create"}
            </Button>
            {editingItem ? (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            ) : null}
          </div>
        </div>

        <div className="bg-card space-y-3 rounded-xl border p-4 shadow-sm">
          <h3 className="text-lg font-semibold">Manual Adjustment</h3>
          <select
            className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
            value={adjustIngredientId}
            onChange={(event) => setAdjustIngredientId(event.target.value)}
          >
            <option value="">Select ingredient</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <Input
            placeholder="Quantity to increase"
            value={adjustQuantity}
            onChange={(event) => setAdjustQuantity(event.target.value)}
          />
          <select
            className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
            value={adjustReason}
            onChange={(event) => setAdjustReason(event.target.value)}
          >
            {STOCK_ADJUSTMENT_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
          <Button type="button" disabled={isPending} onClick={adjustStock}>
            Apply Adjustment
          </Button>
        </div>
      </section>
    </div>
  );
}
