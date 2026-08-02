"use client";

import type { SelectionType } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MODIFIER_SELECTION_TYPE_OPTIONS } from "@/modules/modifier-management/constants/routes";
import { resolveSelectionDefaults } from "@/modules/modifier-management/lib/modifier-validation";
import type {
  ModifierManagementInput,
  ModifierManagementRecord,
} from "@/modules/modifier-management/types/modifier-management-types";

interface ModifierFormProps {
  initialModifierGroup?: ModifierManagementRecord | null;
  submitLabel: string;
  disabled?: boolean;
  onSubmit: (input: ModifierManagementInput) => Promise<void>;
}

function buildInitialForm(
  modifierGroup?: ModifierManagementRecord | null,
): ModifierManagementInput {
  if (modifierGroup) {
    return {
      name: modifierGroup.name,
      description: modifierGroup.description ?? "",
      selectionType: modifierGroup.selectionType,
      minimumSelection: modifierGroup.minimumSelection,
      maximumSelection: modifierGroup.maximumSelection,
      isRequired: modifierGroup.isRequired,
      displayOrder: modifierGroup.displayOrder,
    };
  }

  return {
    name: "",
    description: "",
    selectionType: "SINGLE",
    minimumSelection: 0,
    maximumSelection: 1,
    isRequired: false,
    displayOrder: 0,
  };
}

export function ModifierForm({
  initialModifierGroup,
  submitLabel,
  disabled = false,
  onSubmit,
}: ModifierFormProps) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ModifierManagementInput>(() =>
    buildInitialForm(initialModifierGroup),
  );

  useEffect(() => {
    if (form.selectionType === "SINGLE") {
      setForm((current) => ({
        ...current,
        maximumSelection: 1,
        minimumSelection: Math.min(current.minimumSelection ?? 0, 1),
      }));
    }
  }, [form.selectionType]);

  const handleSelectionTypeChange = (selectionType: SelectionType) => {
    const defaults = resolveSelectionDefaults(selectionType);
    setForm((current) => ({
      ...current,
      selectionType,
      minimumSelection: defaults.minimumSelection,
      maximumSelection: defaults.maximumSelection,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      try {
        await onSubmit(form);
        toast.success(
          submitLabel === "Create modifier group"
            ? "Modifier group created"
            : "Modifier group updated",
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="modifier-name">Name</Label>
          <Input
            id="modifier-name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Size, Cheese, Spice Level..."
            disabled={disabled || isPending}
            required
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="modifier-description">Description</Label>
          <textarea
            id="modifier-description"
            value={form.description ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm"
            disabled={disabled || isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="modifier-selection-type">Selection type</Label>
          <select
            id="modifier-selection-type"
            className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            value={form.selectionType}
            onChange={(event) => handleSelectionTypeChange(event.target.value as SelectionType)}
            disabled={disabled || isPending}
          >
            {MODIFIER_SELECTION_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="modifier-display-order">Display order</Label>
          <Input
            id="modifier-display-order"
            type="number"
            min={0}
            value={form.displayOrder ?? 0}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                displayOrder: Number(event.target.value),
              }))
            }
            disabled={disabled || isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="modifier-min-selection">Minimum selection</Label>
          <Input
            id="modifier-min-selection"
            type="number"
            min={0}
            max={form.maximumSelection ?? 1}
            value={form.minimumSelection ?? 0}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                minimumSelection: Number(event.target.value),
              }))
            }
            disabled={disabled || isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="modifier-max-selection">Maximum selection</Label>
          <Input
            id="modifier-max-selection"
            type="number"
            min={1}
            value={form.maximumSelection ?? 1}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                maximumSelection: Number(event.target.value),
              }))
            }
            disabled={disabled || isPending || form.selectionType === "SINGLE"}
          />
        </div>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input
            type="checkbox"
            checked={Boolean(form.isRequired)}
            onChange={(event) =>
              setForm((current) => ({ ...current, isRequired: event.target.checked }))
            }
            disabled={disabled || isPending}
          />
          Required modifier group
        </label>
      </section>

      <Button type="submit" disabled={disabled || isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
