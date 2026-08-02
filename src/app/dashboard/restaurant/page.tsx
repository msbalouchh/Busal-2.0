import type { Metadata } from "next";

import { RestaurantOverview } from "@/modules/restaurant-operations/components/restaurant-overview";
import { getRestaurantOperationsContext } from "@/modules/restaurant-operations/lib/get-restaurant-operations-context";

export const metadata: Metadata = {
  title: "Restaurant Operations",
};

export default async function RestaurantOperationsPage() {
  const { widgets, permissions, recentOrders } = await getRestaurantOperationsContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Restaurant Operations</h1>
        <p className="text-muted-foreground text-sm">
          Monitor sales, orders, kitchen flow, reservations, tables, and inventory from one hub.
        </p>
      </div>
      <RestaurantOverview widgets={widgets} permissions={permissions} recentOrders={recentOrders} />
    </div>
  );
}
