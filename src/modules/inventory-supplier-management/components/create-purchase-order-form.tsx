"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPurchaseOrderAction } from "@/modules/inventory-supplier-management/actions/inventory-supplier-actions";
import { INVENTORY_SUPPLIER_ROUTES } from "@/modules/inventory-supplier-management/constants/routes";
import type { PurchaseOrderItemInput } from "@/modules/inventory-supplier-management/types/inventory-supplier-types";

interface CreatePurchaseOrderFormProps {
  branchId: string;
  suppliers: Array<{ id: string; label: string }>;
  inventoryItems: Array<{ id: string; label: string; sku: string; unit: string }>;
  disabled?: boolean;
}

export function CreatePurchaseOrderForm({
  branchId,
  suppliers,
  inventoryItems,
  disabled = false,
}: CreatePurchaseOrderFormProps) {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [taxAmount, setTaxAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<PurchaseOrderItemInput[]>([
    { inventoryItemId: inventoryItems[0]?.id ?? "", quantity: 1, unitCost: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const purchaseOrder = await createPurchaseOrderAction({
        branchId,
        supplierId,
        expectedDeliveryDate: expectedDeliveryDate || null,
        taxAmount: Number(taxAmount),
        notes: notes || null,
        items: lines.filter((line) => line.inventoryItemId && line.quantity > 0),
      });
      toast.success("Purchase order created");
      router.push(INVENTORY_SUPPLIER_ROUTES.purchaseOrder(purchaseOrder.id, branchId));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create purchase order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="supplier">Supplier</Label>
          <select
            id="supplier"
            className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          >
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="expectedDeliveryDate">Expected delivery</Label>
          <Input
            id="expectedDeliveryDate"
            type="date"
            value={expectedDeliveryDate}
            onChange={(e) => setExpectedDeliveryDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxAmount">Tax amount</Label>
          <Input
            id="taxAmount"
            type="number"
            step="0.01"
            value={taxAmount}
            onChange={(e) => setTaxAmount(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <p className="font-medium">Line items</p>
        {lines.map((line, index) => (
          <div key={index} className="grid gap-3 md:grid-cols-4">
            <select
              className="border-input bg-background flex h-10 rounded-md border px-3 py-2 text-sm md:col-span-2"
              value={line.inventoryItemId}
              onChange={(e) => {
                const next = [...lines];
                next[index] = { ...line, inventoryItemId: e.target.value };
                setLines(next);
              }}
            >
              {inventoryItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <Input
              type="number"
              step="0.0001"
              placeholder="Qty"
              value={line.quantity}
              onChange={(e) => {
                const next = [...lines];
                next[index] = { ...line, quantity: Number(e.target.value) };
                setLines(next);
              }}
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Unit cost"
              value={line.unitCost}
              onChange={(e) => {
                const next = [...lines];
                next[index] = { ...line, unitCost: Number(e.target.value) };
                setLines(next);
              }}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setLines((current) => [
              ...current,
              { inventoryItemId: inventoryItems[0]?.id ?? "", quantity: 1, unitCost: 0 },
            ])
          }
        >
          Add line
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="border-input bg-background min-h-20 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <Button type="submit" disabled={disabled || isSubmitting || !supplierId}>
        {isSubmitting ? "Creating..." : "Create purchase order"}
      </Button>
    </form>
  );
}
