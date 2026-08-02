"use client";

import Link from "next/link";
import { Loader2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adjustInventoryStockAction } from "@/modules/inventory-supplier-management/actions/inventory-supplier-actions";
import { InventoryStatusBadge } from "@/modules/inventory-supplier-management/components/inventory-status-badge";
import { INVENTORY_SUPPLIER_ROUTES } from "@/modules/inventory-supplier-management/constants/routes";
import type { InventorySupplierPermissions } from "@/modules/inventory-supplier-management/lib/get-inventory-supplier-context";
import type {
  InventoryHistoryResult,
  InventoryItemRecord,
} from "@/modules/inventory-supplier-management/types/inventory-supplier-types";

interface InventoryDetailsPanelProps {
  branchId: string;
  item: InventoryItemRecord;
  history: InventoryHistoryResult;
  permissionsFlags: InventorySupplierPermissions;
}

export function InventoryDetailsPanel({
  branchId,
  item,
  history,
  permissionsFlags,
}: InventoryDetailsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");

  const handleAdjust = () => {
    const quantity = Number(adjustQty);
    if (!Number.isFinite(quantity) || quantity === 0) {
      toast.error("Enter a non-zero adjustment quantity");
      return;
    }

    startTransition(async () => {
      try {
        await adjustInventoryStockAction({
          branchId,
          inventoryItemId: item.id,
          quantity,
          notes: adjustNotes || null,
        });
        toast.success("Stock adjusted");
        setAdjustQty("");
        setAdjustNotes("");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Adjustment failed");
      }
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold">{item.name}</h2>
              <InventoryStatusBadge status={item.status} />
              {item.isLowStock ? (
                <span className="text-sm font-medium text-amber-600">Low stock</span>
              ) : null}
            </div>
            <p className="text-muted-foreground text-sm">
              {item.sku} · {item.unit}
            </p>
          </div>
          {permissionsFlags.canUpdateInventory ? (
            <Button asChild variant="outline" size="sm">
              <Link href={INVENTORY_SUPPLIER_ROUTES.editItem(item.id, branchId)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          ) : null}
        </div>

        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle>Item details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Detail label="Barcode" value={item.barcode ?? "—"} />
            <Detail label="Category" value={item.category ?? "—"} />
            <Detail label="Current stock" value={`${item.currentStock} ${item.unit}`} />
            <Detail label="Minimum stock" value={`${item.minimumStock} ${item.unit}`} />
            <Detail
              label="Reorder level"
              value={item.reorderLevel != null ? `${item.reorderLevel} ${item.unit}` : "—"}
            />
            <Detail label="Average cost" value={`£${item.averageCost.toFixed(2)}`} />
            <Detail label="Track stock" value={item.trackStock ? "Yes" : "No"} />
            <Detail label="Description" value={item.description ?? "—"} />
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle>Inventory history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.items.length === 0 ? (
              <p className="text-muted-foreground text-sm">No transactions yet.</p>
            ) : (
              history.items.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between border-b py-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">{tx.transactionType}</p>
                    <p className="text-muted-foreground text-sm">
                      {tx.notes ?? tx.referenceType ?? "—"} ·{" "}
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={tx.quantity >= 0 ? "text-green-600" : "text-red-600"}>
                    {tx.quantity >= 0 ? "+" : ""}
                    {tx.quantity}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {permissionsFlags.canAdjustInventory ? (
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle>Stock adjustment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adjustQty">Quantity (+/-)</Label>
              <Input
                id="adjustQty"
                type="number"
                step="0.0001"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjustNotes">Notes</Label>
              <Input
                id="adjustNotes"
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
              />
            </div>
            <Button onClick={handleAdjust} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Apply adjustment
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
