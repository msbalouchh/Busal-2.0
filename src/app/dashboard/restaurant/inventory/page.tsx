import type { Metadata } from "next";

import { RestaurantInventoryPanel } from "@/modules/restaurant-operations/components/restaurant-inventory-panel";
import { getRestaurantInventoryContext } from "@/modules/restaurant-operations/lib/get-restaurant-operations-context";

export const metadata: Metadata = {
  title: "Inventory",
};

export default async function RestaurantInventoryPage() {
  const { dashboard } = await getRestaurantInventoryContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground text-sm">
          Ingredients, stock levels, low stock alerts, recipe usage, purchases, and suppliers.
        </p>
      </div>
      <RestaurantInventoryPanel dashboard={dashboard} />
    </div>
  );
}
