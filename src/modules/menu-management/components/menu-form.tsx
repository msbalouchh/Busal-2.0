"use client";

import type { MenuType } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MENU_DAY_OPTIONS, MENU_TYPE_OPTIONS } from "@/modules/menu-management/constants/routes";
import type {
  MenuManagementInput,
  MenuManagementRecord,
} from "@/modules/menu-management/types/menu-management-types";
import type { BranchData } from "@/services/staff-management.service";

interface MenuFormProps {
  initialMenu?: MenuManagementRecord | null;
  branches: BranchData[];
  submitLabel: string;
  disabled?: boolean;
  onSubmit: (input: MenuManagementInput) => Promise<void>;
}

function buildInitialForm(menu: MenuManagementRecord | null | undefined): MenuManagementInput {
  if (menu) {
    return {
      name: menu.name,
      description: menu.description ?? "",
      menuType: menu.menuType,
      branchId: menu.branchId,
      displayOrder: menu.displayOrder,
      availableFrom: menu.availableFrom ?? "",
      availableUntil: menu.availableUntil ?? "",
      daysAvailable: menu.daysAvailable,
      image: menu.image ?? "",
    };
  }

  return {
    name: "",
    description: "",
    menuType: "ALL_DAY",
    branchId: null,
    displayOrder: 0,
    availableFrom: "",
    availableUntil: "",
    daysAvailable: [1, 2, 3, 4, 5, 6, 7],
    image: "",
  };
}

export function MenuForm({
  initialMenu,
  branches,
  submitLabel,
  disabled = false,
  onSubmit,
}: MenuFormProps) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<MenuManagementInput>(() => buildInitialForm(initialMenu));

  const toggleDay = (day: number) => {
    setForm((current) => {
      const days = current.daysAvailable ?? [];
      const next = days.includes(day) ? days.filter((entry) => entry !== day) : [...days, day];
      return { ...current, daysAvailable: next.sort((a, b) => a - b) };
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      try {
        await onSubmit({
          ...form,
          description: form.description?.trim() || undefined,
          branchId: form.branchId || null,
          availableFrom: form.availableFrom?.trim() || null,
          availableUntil: form.availableUntil?.trim() || null,
          image: form.image?.trim() || null,
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save menu");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="menu-name">Menu name</Label>
          <Input
            id="menu-name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="e.g. Weekend Brunch"
            required
            disabled={disabled || isPending}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="menu-description">Description</Label>
          <textarea
            id="menu-description"
            value={form.description ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Optional guest-facing description"
            className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm"
            disabled={disabled || isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="menu-type">Menu type</Label>
          <select
            id="menu-type"
            className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            value={form.menuType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                menuType: event.target.value as MenuType,
              }))
            }
            disabled={disabled || isPending}
          >
            {MENU_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="menu-branch">Primary branch</Label>
          <select
            id="menu-branch"
            className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            value={form.branchId ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                branchId: event.target.value || null,
              }))
            }
            disabled={disabled || isPending}
          >
            <option value="">Business-wide</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="menu-display-order">Display order</Label>
          <Input
            id="menu-display-order"
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
          <Label htmlFor="menu-image">Image URL</Label>
          <Input
            id="menu-image"
            value={form.image ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
            placeholder="https://"
            disabled={disabled || isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="menu-available-from">Available from</Label>
          <Input
            id="menu-available-from"
            type="time"
            value={form.availableFrom ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, availableFrom: event.target.value }))
            }
            disabled={disabled || isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="menu-available-until">Available until</Label>
          <Input
            id="menu-available-until"
            type="time"
            value={form.availableUntil ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, availableUntil: event.target.value }))
            }
            disabled={disabled || isPending}
          />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Days available</legend>
        <div className="flex flex-wrap gap-2">
          {MENU_DAY_OPTIONS.map((day) => {
            const selected = (form.daysAvailable ?? []).includes(day.value);
            return (
              <Button
                key={day.value}
                type="button"
                size="sm"
                variant={selected ? "default" : "outline"}
                onClick={() => toggleDay(day.value)}
                disabled={disabled || isPending}
                aria-pressed={selected}
              >
                {day.label}
              </Button>
            );
          })}
        </div>
      </fieldset>

      <Button type="submit" disabled={disabled || isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
