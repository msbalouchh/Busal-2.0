"use client";

import { INVENTORY_STOCK_STATUSES } from "@/modules/inventory/constants/inventory-status";
import { InventoryManagementEmpty } from "@/modules/inventory/components/inventory-management-empty";
import { InventoryManagementError } from "@/modules/inventory/components/inventory-management-error";
import { InventoryManagementLoading } from "@/modules/inventory/components/inventory-management-loading";
import { InventoryStockStatusBadge } from "@/modules/inventory/components/inventory-stock-status-badge";
import { useInventory } from "@/modules/inventory/hooks/use-inventory";

export function InventoryOverview() {
  const { records, refresh, isRefreshing, error } = useInventory();
  const lowStockCount = records.filter(
    (record) => record.item.status === INVENTORY_STOCK_STATUSES.LOW_STOCK,
  ).length;
  const outOfStockCount = records.filter(
    (record) => record.item.status === INVENTORY_STOCK_STATUSES.OUT_OF_STOCK,
  ).length;

  if (isRefreshing && records.length === 0) {
    return <InventoryManagementLoading />;
  }

  if (error && records.length === 0) {
    return <InventoryManagementError message={error} onRetry={refresh} />;
  }

  if (records.length === 0) {
    return <InventoryManagementEmpty />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Total Items</p>
          <p className="text-2xl font-semibold">{records.length}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Low Stock</p>
          <p className="text-2xl font-semibold">{lowStockCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Out of Stock</p>
          <p className="text-2xl font-semibold">{outOfStockCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <button
            type="button"
            className="text-primary text-sm font-medium"
            onClick={refresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Inventory Items</h3>
        <ul className="space-y-3">
          {records.slice(0, 20).map((record) => (
            <li key={record.item.id} className="flex items-center justify-between gap-4 text-sm">
              <div>
                <p className="font-medium">{record.item.name}</p>
                <p className="text-muted-foreground text-xs">
                  {record.item.sku} · {record.stocks[0]?.quantityOnHand ?? 0} {record.unit.abbreviation}
                </p>
              </div>
              <InventoryStockStatusBadge status={record.item.status} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
