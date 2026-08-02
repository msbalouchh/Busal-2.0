"use client";

import type { ModifierOptionStatus } from "@prisma/client";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createModifierOptionAction,
  deleteModifierOptionAction,
  reorderModifierOptionsAction,
  updateModifierOptionAction,
} from "@/modules/modifier-management/actions/modifier-management-actions";
import { MODIFIER_OPTION_STATUS_OPTIONS } from "@/modules/modifier-management/constants/routes";
import type {
  ModifierManagementRecord,
  ModifierOptionInput,
} from "@/modules/modifier-management/types/modifier-management-types";

interface ModifierOptionListProps {
  menuId: string;
  modifierGroup: ModifierManagementRecord;
  canUpdate?: boolean;
}

const emptyOptionForm: ModifierOptionInput = {
  name: "",
  description: "",
  priceAdjustment: 0,
  costAdjustment: null,
  status: "ACTIVE",
};

export function ModifierOptionList({
  menuId,
  modifierGroup,
  canUpdate = false,
}: ModifierOptionListProps) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ModifierOptionInput>(emptyOptionForm);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ModifierOptionInput>(emptyOptionForm);

  const runAction = (action: () => Promise<unknown>, successMessage: string) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  };

  const handleCreate = () => {
    runAction(() => createModifierOptionAction(menuId, modifierGroup.id, form), "Option added");
    setForm(emptyOptionForm);
  };

  const startEdit = (option: ModifierManagementRecord["options"][number]) => {
    setEditingOptionId(option.id);
    setEditForm({
      name: option.name,
      description: option.description ?? "",
      priceAdjustment: option.priceAdjustment,
      costAdjustment: option.costAdjustment,
      displayOrder: option.displayOrder,
      status: option.status,
    });
  };

  const handleUpdate = () => {
    if (!editingOptionId) return;

    runAction(
      () => updateModifierOptionAction(menuId, modifierGroup.id, editingOptionId, editForm),
      "Option updated",
    );
    setEditingOptionId(null);
  };

  const moveOption = (optionId: string, direction: "up" | "down") => {
    const ids = modifierGroup.options.map((option) => option.id);
    const index = ids.indexOf(optionId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= ids.length) {
      return;
    }

    const currentId = ids[index];
    const targetId = ids[targetIndex];

    if (!currentId || !targetId) {
      return;
    }

    ids[index] = targetId;
    ids[targetIndex] = currentId;

    runAction(
      () =>
        reorderModifierOptionsAction(menuId, {
          modifierGroupId: modifierGroup.id,
          optionIds: ids,
        }),
      "Options reordered",
    );
  };

  return (
    <section className="space-y-4 rounded-xl border p-4 sm:p-6">
      <div>
        <h3 className="text-lg font-semibold">Modifier options</h3>
        <p className="text-muted-foreground text-sm">
          Add choices like Small, Medium, Large or Extra Cheese.
        </p>
      </div>

      {canUpdate && modifierGroup.status !== "ARCHIVED" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="option-name">Option name</Label>
            <Input
              id="option-name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Small"
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="option-price">Price adjustment</Label>
            <Input
              id="option-price"
              type="number"
              step="0.01"
              value={form.priceAdjustment ?? 0}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  priceAdjustment: Number(event.target.value),
                }))
              }
              disabled={isPending}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="option-description">Description</Label>
            <Input
              id="option-description"
              value={form.description ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              disabled={isPending}
            />
          </div>
          <Button type="button" onClick={handleCreate} disabled={isPending || !form.name.trim()}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add option
          </Button>
        </div>
      ) : null}

      {modifierGroup.options.length === 0 ? (
        <p className="text-muted-foreground text-sm">No options yet.</p>
      ) : (
        <ul className="space-y-2">
          {modifierGroup.options.map((option, index) => (
            <li key={option.id} className="rounded-md border p-3">
              {editingOptionId === option.id ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    value={editForm.name}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.priceAdjustment ?? 0}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        priceAdjustment: Number(event.target.value),
                      }))
                    }
                  />
                  <select
                    className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm md:col-span-2"
                    value={editForm.status}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        status: event.target.value as ModifierOptionStatus,
                      }))
                    }
                  >
                    {MODIFIER_OPTION_STATUS_OPTIONS.map((statusOption) => (
                      <option key={statusOption.value} value={statusOption.value}>
                        {statusOption.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2 md:col-span-2">
                    <Button type="button" size="sm" onClick={handleUpdate} disabled={isPending}>
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingOptionId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{option.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {option.priceAdjustment >= 0 ? "+" : ""}
                      {option.priceAdjustment.toFixed(2)} · {option.status.toLowerCase()}
                    </p>
                  </div>
                  {canUpdate && modifierGroup.status !== "ARCHIVED" ? (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={isPending || index === 0}
                        onClick={() => moveOption(option.id, "up")}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={isPending || index === modifierGroup.options.length - 1}
                        onClick={() => moveOption(option.id, "down")}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(option)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() =>
                          runAction(
                            () => deleteModifierOptionAction(menuId, modifierGroup.id, option.id),
                            "Option deleted",
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
