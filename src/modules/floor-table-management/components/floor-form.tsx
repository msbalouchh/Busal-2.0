"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FloorManagementInput } from "@/modules/floor-table-management/types/floor-table-management-types";

interface FloorFormProps {
  initialFloor?: Partial<FloorManagementInput>;
  branchId: string;
  submitLabel: string;
  disabled?: boolean;
  onSubmit: (input: FloorManagementInput) => Promise<void>;
}

export function FloorForm({
  initialFloor,
  branchId,
  submitLabel,
  disabled = false,
  onSubmit,
}: FloorFormProps) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FloorManagementInput>({
    branchId,
    name: initialFloor?.name ?? "",
    description: initialFloor?.description ?? "",
    displayOrder: initialFloor?.displayOrder ?? 0,
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      try {
        await onSubmit(form);
        toast.success(submitLabel === "Create floor" ? "Floor created" : "Floor updated");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="floor-name">Floor name</Label>
        <Input
          id="floor-name"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="Ground floor, Terrace, Patio..."
          disabled={disabled || isPending}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="floor-description">Description</Label>
        <textarea
          id="floor-description"
          value={form.description ?? ""}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
          className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm"
          disabled={disabled || isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="floor-order">Display order</Label>
        <Input
          id="floor-order"
          type="number"
          min={0}
          value={form.displayOrder ?? 0}
          onChange={(event) =>
            setForm((current) => ({ ...current, displayOrder: Number(event.target.value) }))
          }
          disabled={disabled || isPending}
        />
      </div>
      <Button type="submit" disabled={disabled || isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
