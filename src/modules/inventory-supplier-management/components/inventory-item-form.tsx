"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InventoryItemInput } from "@/modules/inventory-supplier-management/types/inventory-supplier-types";
import type { InventoryStatus } from "@prisma/client";

interface InventoryItemFormProps {
  initial?: InventoryItemInput;
  submitLabel: string;
  disabled?: boolean;
  allowInitialStock?: boolean;
  onSubmit: (input: InventoryItemInput) => Promise<void>;
}

export function InventoryItemForm({
  initial,
  submitLabel,
  disabled = false,
  allowInitialStock = false,
  onSubmit,
}: InventoryItemFormProps) {
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [barcode, setBarcode] = useState(initial?.barcode ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "each");
  const [minimumStock, setMinimumStock] = useState(String(initial?.minimumStock ?? 0));
  const [maximumStock, setMaximumStock] = useState(
    initial?.maximumStock != null ? String(initial.maximumStock) : "",
  );
  const [reorderLevel, setReorderLevel] = useState(
    initial?.reorderLevel != null ? String(initial.reorderLevel) : "",
  );
  const [averageCost, setAverageCost] = useState(String(initial?.averageCost ?? 0));
  const [initialStock, setInitialStock] = useState(String(initial?.initialStock ?? 0));
  const [trackStock, setTrackStock] = useState(initial?.trackStock ?? true);
  const [status, setStatus] = useState<InventoryStatus>(initial?.status ?? "ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        sku,
        barcode: barcode || null,
        name,
        description: description || null,
        category: category || null,
        unit,
        minimumStock: Number(minimumStock),
        maximumStock: maximumStock ? Number(maximumStock) : null,
        reorderLevel: reorderLevel ? Number(reorderLevel) : null,
        averageCost: Number(averageCost),
        initialStock: allowInitialStock ? Number(initialStock) : undefined,
        trackStock,
        status,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="barcode">Barcode</Label>
          <Input id="barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border-input bg-background min-h-20 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Input id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minimumStock">Minimum stock</Label>
          <Input
            id="minimumStock"
            type="number"
            step="0.0001"
            value={minimumStock}
            onChange={(e) => setMinimumStock(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reorderLevel">Reorder level</Label>
          <Input
            id="reorderLevel"
            type="number"
            step="0.0001"
            value={reorderLevel}
            onChange={(e) => setReorderLevel(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maximumStock">Maximum stock</Label>
          <Input
            id="maximumStock"
            type="number"
            step="0.0001"
            value={maximumStock}
            onChange={(e) => setMaximumStock(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="averageCost">Average cost</Label>
          <Input
            id="averageCost"
            type="number"
            step="0.01"
            value={averageCost}
            onChange={(e) => setAverageCost(e.target.value)}
          />
        </div>
        {allowInitialStock ? (
          <div className="space-y-2">
            <Label htmlFor="initialStock">Initial stock</Label>
            <Input
              id="initialStock"
              type="number"
              step="0.0001"
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as InventoryStatus)}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={trackStock}
          onChange={(e) => setTrackStock(e.target.checked)}
        />
        Track stock levels
      </label>
      <Button type="submit" disabled={disabled || isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
