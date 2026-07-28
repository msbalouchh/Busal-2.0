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
import {
  QR_MENU_SELECT_CLASSNAME,
  validateQRCodeForm,
  type QRCodeFormErrors,
  type QRCodeFormState,
} from "@/modules/qr-menu/lib/qr-menu-form";
import type { ClientTableOption } from "@/modules/qr-menu/lib/qr-menu-utils";

export interface QRCodeFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  initialForm: QRCodeFormState;
  tables: ClientTableOption[];
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (form: QRCodeFormState) => void;
}

export function QRCodeFormDialog({
  open,
  mode,
  initialForm,
  tables,
  isPending,
  onOpenChange,
  onSubmit,
}: QRCodeFormDialogProps) {
  const [form, setForm] = useState<QRCodeFormState>(initialForm);
  const [errors, setErrors] = useState<QRCodeFormErrors>({});

  useEffect(() => {
    if (open) {
      setForm(initialForm);
      setErrors({});
    }
  }, [open, initialForm]);

  const handleSubmit = () => {
    const nextErrors = validateQRCodeForm(form);
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
          <DialogTitle>{mode === "create" ? "Create QR code" : "Edit QR code"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new QR code for your menu. The code value is generated automatically."
              : "Update the QR code details below."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="dialog-qr-slug">Slug</Label>
            <Input
              id="dialog-qr-slug"
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              disabled={isPending}
              placeholder="e.g. patio-table-1"
              aria-invalid={Boolean(errors.slug)}
            />
            {errors.slug ? <p className="text-destructive text-xs">{errors.slug}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dialog-qr-table">Assign table</Label>
            <select
              id="dialog-qr-table"
              className={QR_MENU_SELECT_CLASSNAME}
              value={form.tableId}
              onChange={(event) => setForm({ ...form, tableId: event.target.value })}
              disabled={isPending}
            >
              <option value="">No table assigned</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="dialog-qr-active"
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              disabled={isPending}
            />
            <Label htmlFor="dialog-qr-active">Active</Label>
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
            {mode === "create" ? "Create QR code" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
