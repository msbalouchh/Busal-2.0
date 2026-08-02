import Link from "next/link";

import type { InventoryDashboardView } from "@/modules/inventory/types/inventory";

interface RestaurantInventoryPanelProps {
  dashboard: InventoryDashboardView;
}

export function RestaurantInventoryPanel({ dashboard }: RestaurantInventoryPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Ingredients</p>
          <p className="text-2xl font-semibold">{dashboard.totalIngredients}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Active ingredients</p>
          <p className="text-2xl font-semibold">{dashboard.activeIngredients}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Low stock alerts</p>
          <p className="text-2xl font-semibold">{dashboard.lowStock.length}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Out of stock</p>
          <p className="text-2xl font-semibold">{dashboard.outOfStock.length}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Low stock</h2>
          {dashboard.lowStock.length === 0 ? (
            <p className="text-muted-foreground text-sm">No low stock alerts.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {dashboard.lowStock.slice(0, 8).map((item) => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Recent movements</h2>
          {dashboard.recentMovements.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent stock movements.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {dashboard.recentMovements.slice(0, 8).map((movement) => (
                <li key={movement.id}>
                  {movement.ingredientName} · {movement.quantityChange}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/inventory/ingredients"
          className="text-primary text-sm hover:underline"
        >
          Ingredients
        </Link>
        <Link href="/dashboard/inventory/recipes" className="text-primary text-sm hover:underline">
          Recipes
        </Link>
        <Link
          href="/dashboard/inventory/suppliers"
          className="text-primary text-sm hover:underline"
        >
          Suppliers
        </Link>
        <Link
          href="/dashboard/inventory/movements"
          className="text-primary text-sm hover:underline"
        >
          Purchase records
        </Link>
      </div>
    </div>
  );
}
