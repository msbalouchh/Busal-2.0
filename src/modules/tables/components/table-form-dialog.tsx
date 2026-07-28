"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TABLE_STATUS_OPTIONS } from "@/modules/tables/constants/routes";
import {
  TABLE_SELECT_CLASSNAME,
  buildCreateTablePayload,
  buildUpdateTablePayload,
  validateTableForm,
  type TableFormErrors,
  type TableFormState,
} from "@/modules/tables/lib/table-form";

interface TableFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  initialForm: TableFormState;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (form: TableFormState) => void;
}

export function TableFormDialog({
  open,
  mode,
  initialForm,
  isPending,
  onOpenChange,
  onSubmit,
}: TableFormDialogProps) {
  const [form, setForm] = useState<TableFormState>(initialForm);
  const [errors, setErrors] = useState<TableFormErrors>({});

  useEffect(() => {
    if (open) {
      setForm(initialForm);
      setErrors({});
    }
  }, [open, initialForm]);

  const handleSubmit = () => {
    const nextErrors = validateTableForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create table" : "Edit table"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new table to your floor."
              : "Update the table details below."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="dialog-table-name">Name</Label>
            <Input
              id="dialog-table-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              disabled={isPending}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name ? <p className="text-destructive text-xs">{errors.name}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dialog-table-section">Section</Label>
            <Input
              id="dialog-table-section"
              value={form.section}
              onChange={(event) => setForm({ ...form, section: event.target.value })}
              disabled={isPending}
              placeholder="e.g. Main, Patio"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dialog-table-capacity">Capacity</Label>
            <Input
              id="dialog-table-capacity"
              type="number"
              min="1"
              value={form.capacity}
              onChange={(event) => setForm({ ...form, capacity: event.target.value })}
              disabled={isPending}
              aria-invalid={Boolean(errors.capacity)}
            />
            {errors.capacity ? <p className="text-destructive text-xs">{errors.capacity}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dialog-table-status">Status</Label>
            <select
              id="dialog-table-status"
              className={TABLE_SELECT_CLASSNAME}
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value as TableFormState["status"] })
              }
              disabled={isPending}
            >
              {TABLE_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <input
              id="dialog-table-active"
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              disabled={isPending}
            />
            <Label htmlFor="dialog-table-active">Active</Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Close
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === "create" ? "Create table" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { buildCreateTablePayload, buildUpdateTablePayload };
