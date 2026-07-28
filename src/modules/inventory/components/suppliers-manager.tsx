"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createSupplierAction,
  deactivateSupplierAction,
  updateSupplierAction,
} from "@/modules/inventory/actions/inventory-actions";
import type { SupplierView } from "@/modules/inventory/types/inventory";

interface SuppliersManagerProps {
  suppliers: SupplierView[];
}

const emptyForm = {
  name: "",
  contactName: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

export function SuppliersManager({ suppliers }: SuppliersManagerProps) {
  const [items, setItems] = useState(suppliers);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const saveSupplier = () => {
    if (!form.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          name: form.name,
          contactName: form.contactName || null,
          phone: form.phone || null,
          email: form.email || null,
          address: form.address || null,
          notes: form.notes || null,
        };

        if (editingId) {
          await updateSupplierAction(editingId, payload);
          setItems((current) =>
            current.map((item) =>
              item.id === editingId ? { ...item, ...payload, status: "ACTIVE" } : item,
            ),
          );
          toast.success("Supplier updated");
        } else {
          const result = await createSupplierAction(payload);
          setItems((current) => [
            ...current,
            { id: result.supplierId, ...payload, status: "ACTIVE" },
          ]);
          toast.success("Supplier created");
        }

        setForm(emptyForm);
        setEditingId(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="bg-card space-y-3 rounded-xl border p-4 shadow-sm">
        <h3 className="text-lg font-semibold">Suppliers</h3>
        <ul className="divide-y rounded-lg border">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-muted-foreground text-xs">
                  {item.contactName ?? "No contact"} · {item.phone ?? "No phone"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(item.id);
                    setForm({
                      name: item.name,
                      contactName: item.contactName ?? "",
                      phone: item.phone ?? "",
                      email: item.email ?? "",
                      address: item.address ?? "",
                      notes: item.notes ?? "",
                    });
                  }}
                >
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
                        await deactivateSupplierAction({ supplierId: item.id });
                        setItems((current) => current.filter((entry) => entry.id !== item.id));
                        toast.success("Supplier deactivated");
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

      <section className="bg-card space-y-3 rounded-xl border p-4 shadow-sm">
        <h3 className="text-lg font-semibold">{editingId ? "Edit Supplier" : "Add Supplier"}</h3>
        <Input
          placeholder="Name"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
        <Input
          placeholder="Contact"
          value={form.contactName}
          onChange={(event) =>
            setForm((current) => ({ ...current, contactName: event.target.value }))
          }
        />
        <Input
          placeholder="Phone"
          value={form.phone}
          onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
        />
        <Input
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        />
        <Input
          placeholder="Address"
          value={form.address}
          onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
        />
        <Input
          placeholder="Notes"
          value={form.notes}
          onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
        />
        <Button type="button" disabled={isPending} onClick={saveSupplier}>
          {editingId ? "Update" : "Create"}
        </Button>
      </section>
    </div>
  );
}
