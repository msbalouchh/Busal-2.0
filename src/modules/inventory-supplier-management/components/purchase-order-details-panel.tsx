"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  cancelPurchaseOrderAction,
  receivePurchaseOrderStockAction,
  sendPurchaseOrderAction,
} from "@/modules/inventory-supplier-management/actions/inventory-supplier-actions";
import { PurchaseOrderStatusBadge } from "@/modules/inventory-supplier-management/components/purchase-order-status-badge";
import type { InventorySupplierPermissions } from "@/modules/inventory-supplier-management/lib/get-inventory-supplier-context";
import type { PurchaseOrderRecord } from "@/modules/inventory-supplier-management/types/inventory-supplier-types";

interface PurchaseOrderDetailsPanelProps {
  branchId: string;
  purchaseOrder: PurchaseOrderRecord;
  permissionsFlags: InventorySupplierPermissions;
}

export function PurchaseOrderDetailsPanel({
  branchId,
  purchaseOrder,
  permissionsFlags,
}: PurchaseOrderDetailsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [receiveLines, setReceiveLines] = useState<Record<string, string>>(
    Object.fromEntries(
      purchaseOrder.items.map((item) => [
        item.id,
        String(Math.max(0, item.quantity - item.receivedQuantity)),
      ]),
    ),
  );

  const runAction = (action: () => Promise<unknown>, message: string) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(message);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  };

  const handleReceive = () => {
    runAction(
      () =>
        receivePurchaseOrderStockAction({
          branchId,
          purchaseOrderId: purchaseOrder.id,
          lines: purchaseOrder.items.map((item) => ({
            purchaseOrderItemId: item.id,
            receivedQuantity: Number(receiveLines[item.id] ?? 0),
          })),
        }),
      "Stock received",
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-semibold">{purchaseOrder.purchaseOrderNumber}</h2>
        <PurchaseOrderStatusBadge status={purchaseOrder.status} />
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Detail label="Supplier" value={purchaseOrder.supplierName} />
          <Detail label="Status" value={purchaseOrder.status.replace("_", " ")} />
          <Detail label="Subtotal" value={`£${purchaseOrder.subtotal.toFixed(2)}`} />
          <Detail label="Tax" value={`£${purchaseOrder.taxAmount.toFixed(2)}`} />
          <Detail label="Total" value={`£${purchaseOrder.totalAmount.toFixed(2)}`} />
          <Detail label="Expected delivery" value={purchaseOrder.expectedDeliveryDate ?? "—"} />
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {purchaseOrder.items.map((item) => (
            <div key={item.id} className="grid gap-3 border-b pb-4 last:border-0 md:grid-cols-4">
              <div className="md:col-span-2">
                <p className="font-medium">{item.inventoryItemName}</p>
                <p className="text-muted-foreground text-sm">
                  {item.inventoryItemSku} · ordered {item.quantity} · received{" "}
                  {item.receivedQuantity}
                </p>
              </div>
              <p className="text-sm">£{item.unitCost.toFixed(2)} each</p>
              {permissionsFlags.canReceivePurchaseOrder &&
              ["SENT", "PARTIALLY_RECEIVED"].includes(purchaseOrder.status) ? (
                <div className="space-y-1">
                  <Label htmlFor={`receive-${item.id}`}>Receive qty</Label>
                  <Input
                    id={`receive-${item.id}`}
                    type="number"
                    step="0.0001"
                    value={receiveLines[item.id] ?? ""}
                    onChange={(e) =>
                      setReceiveLines((current) => ({ ...current, [item.id]: e.target.value }))
                    }
                  />
                </div>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {purchaseOrder.status === "DRAFT" && permissionsFlags.canCreatePurchaseOrder ? (
          <Button
            disabled={isPending}
            onClick={() =>
              runAction(
                () => sendPurchaseOrderAction(branchId, purchaseOrder.id),
                "Purchase order sent",
              )
            }
          >
            Send PO
          </Button>
        ) : null}
        {["SENT", "PARTIALLY_RECEIVED"].includes(purchaseOrder.status) &&
        permissionsFlags.canReceivePurchaseOrder ? (
          <Button disabled={isPending} onClick={handleReceive}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Receive stock
          </Button>
        ) : null}
        {purchaseOrder.status !== "RECEIVED" &&
        purchaseOrder.status !== "CANCELLED" &&
        permissionsFlags.canCreatePurchaseOrder ? (
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() =>
              runAction(
                () => cancelPurchaseOrderAction(branchId, purchaseOrder.id),
                "Purchase order cancelled",
              )
            }
          >
            Cancel
          </Button>
        ) : null}
      </div>
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
