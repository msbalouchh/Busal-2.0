import type { Metadata } from "next";

import { RestaurantMenuPanel } from "@/modules/restaurant-operations/components/restaurant-menu-panel";
import { getRestaurantMenuContext } from "@/modules/restaurant-operations/lib/get-restaurant-operations-context";

export const metadata: Metadata = {
  title: "Menu Management",
};

export default async function RestaurantMenuPage() {
  const { categories, menuItems, modifierGroups, permissions } = await getRestaurantMenuContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Menu Management</h1>
        <p className="text-muted-foreground text-sm">
          Manage categories, items, modifiers, pricing, availability, and bulk updates.
        </p>
      </div>
      <RestaurantMenuPanel
        categories={categories}
        menuItems={menuItems}
        modifierGroups={modifierGroups}
        permissions={permissions}
      />
    </div>
  );
}
