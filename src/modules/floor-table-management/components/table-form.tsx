"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TABLE_SHAPE_OPTIONS } from "@/modules/floor-table-management/constants/routes";
import type { TableManagementInput } from "@/modules/floor-table-management/types/floor-table-management-types";

interface TableFormProps {
  branchId: string;
  floorId: string;
  initialTable?: Partial<TableManagementInput>;
  submitLabel: string;
  disabled?: boolean;
  onSubmit: (input: TableManagementInput) => Promise<void>;
}

export function TableForm({
  branchId,
  floorId,
  initialTable,
  submitLabel,
  disabled = false,
  onSubmit,
}: TableFormProps) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<TableManagementInput>({
    branchId,
    floorId,
    tableNumber: initialTable?.tableNumber ?? "",
    tableName: initialTable?.tableName ?? "",
    capacity: initialTable?.capacity ?? 2,
    minimumCapacity: initialTable?.minimumCapacity ?? 1,
    shape: initialTable?.shape ?? "SQUARE",
    positionX: initialTable?.positionX ?? 40,
    positionY: initialTable?.positionY ?? 40,
    width: initialTable?.width ?? 80,
    height: initialTable?.height ?? 80,
    rotation: initialTable?.rotation ?? 0,
    isReservable: initialTable?.isReservable ?? true,
    isMergeable: initialTable?.isMergeable ?? true,
    notes: initialTable?.notes ?? "",
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      try {
        await onSubmit(form);
        toast.success(submitLabel === "Create table" ? "Table created" : "Table updated");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="table-number">Table number</Label>
          <Input
            id="table-number"
            value={form.tableNumber}
            onChange={(event) =>
              setForm((current) => ({ ...current, tableNumber: event.target.value }))
            }
            disabled={disabled || isPending}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="table-name">Table name</Label>
          <Input
            id="table-name"
            value={form.tableName ?? ""}
            onChange={(event) =>
              setForm((current) => ({ ...current, tableName: event.target.value }))
            }
            disabled={disabled || isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="table-capacity">Capacity</Label>
          <Input
            id="table-capacity"
            type="number"
            min={1}
            value={form.capacity}
            onChange={(event) =>
              setForm((current) => ({ ...current, capacity: Number(event.target.value) }))
            }
            disabled={disabled || isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="table-min-capacity">Minimum capacity</Label>
          <Input
            id="table-min-capacity"
            type="number"
            min={1}
            value={form.minimumCapacity ?? 1}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                minimumCapacity: Number(event.target.value),
              }))
            }
            disabled={disabled || isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="table-shape">Shape</Label>
          <select
            id="table-shape"
            className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            value={form.shape}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                shape: event.target.value as TableManagementInput["shape"],
              }))
            }
            disabled={disabled || isPending}
          >
            {TABLE_SHAPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={Boolean(form.isReservable)}
          onChange={(event) =>
            setForm((current) => ({ ...current, isReservable: event.target.checked }))
          }
          disabled={disabled || isPending}
        />
        Reservable
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={Boolean(form.isMergeable)}
          onChange={(event) =>
            setForm((current) => ({ ...current, isMergeable: event.target.checked }))
          }
          disabled={disabled || isPending}
        />
        Mergeable
      </label>
      <Button type="submit" disabled={disabled || isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
