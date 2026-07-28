import type { InventoryDashboardView } from "@/modules/inventory/types/inventory";
import { formatInventoryMoney } from "@/modules/inventory/utils/inventory-utils";
import { INGREDIENT_UNIT_LABELS } from "@/modules/inventory/constants/inventory";
import type { IngredientUnitOption } from "@/modules/inventory/constants/inventory";

interface InventoryDashboardProps {
  dashboard: InventoryDashboardView;
}

export function InventoryDashboard({ dashboard }: InventoryDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Total Ingredients</p>
          <p className="text-2xl font-semibold">{dashboard.totalIngredients}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Active Ingredients</p>
          <p className="text-2xl font-semibold">{dashboard.activeIngredients}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Low / Out of Stock</p>
          <p className="text-2xl font-semibold">
            {dashboard.lowStock.length} / {dashboard.outOfStock.length}
          </p>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">Low Stock</h3>
          {dashboard.lowStock.length === 0 ? (
            <p className="text-muted-foreground text-sm">No low stock items.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {dashboard.lowStock.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span>{item.name}</span>
                  <span>
                    {item.currentStock} {INGREDIENT_UNIT_LABELS[item.unit as IngredientUnitOption]}{" "}
                    (min {item.minimumStock})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">Out of Stock</h3>
          {dashboard.outOfStock.length === 0 ? (
            <p className="text-muted-foreground text-sm">No out of stock items.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {dashboard.outOfStock.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span>{item.name}</span>
                  <span>{formatInventoryMoney(item.costPricePence)} cost</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">Recent Adjustments</h3>
          {dashboard.recentAdjustments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No adjustments yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {dashboard.recentAdjustments.map((adjustment) => (
                <li key={adjustment.id}>
                  <p className="font-medium">{adjustment.ingredientName}</p>
                  <p className="text-muted-foreground text-xs">
                    {adjustment.direction} {adjustment.quantity} · {adjustment.reason} ·{" "}
                    {new Date(adjustment.createdAt).toLocaleString("en-GB")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">Recent Movements</h3>
          {dashboard.recentMovements.length === 0 ? (
            <p className="text-muted-foreground text-sm">No stock movements yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {dashboard.recentMovements.map((movement) => (
                <li key={movement.id}>
                  <p className="font-medium">{movement.ingredientName}</p>
                  <p className="text-muted-foreground text-xs">
                    {movement.movementType} {movement.quantityChange} · balance{" "}
                    {movement.balanceAfter} · {new Date(movement.createdAt).toLocaleString("en-GB")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
