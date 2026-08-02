import type { Metadata } from "next";

import { RestaurantTablesPanel } from "@/modules/restaurant-operations/components/restaurant-tables-panel";
import { getRestaurantTablesContext } from "@/modules/restaurant-operations/lib/get-restaurant-operations-context";

export const metadata: Metadata = {
  title: "Table Management",
};

export default async function RestaurantTablesPage() {
  const { tables, floor, permissions } = await getRestaurantTablesContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Table Management</h1>
        <p className="text-muted-foreground text-sm">
          Floor layout, table status, capacity, merge/split, and QR assignment visibility.
        </p>
      </div>
      <RestaurantTablesPanel tables={tables} floor={floor} permissions={permissions} />
    </div>
  );
}
