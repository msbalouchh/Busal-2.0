"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InventoryHistoryResult } from "@/modules/inventory-supplier-management/types/inventory-supplier-types";

interface InventoryHistoryPanelProps {
  history: InventoryHistoryResult;
}

export function InventoryHistoryPanel({ history }: InventoryHistoryPanelProps) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle>Inventory history</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {history.items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No transactions found.</p>
        ) : (
          history.items.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between border-b py-3 last:border-0"
            >
              <div>
                <p className="font-medium">
                  {tx.inventoryItemName} · {tx.transactionType}
                </p>
                <p className="text-muted-foreground text-sm">
                  {tx.notes ?? tx.referenceType ?? "—"} · {new Date(tx.createdAt).toLocaleString()}
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
  );
}
