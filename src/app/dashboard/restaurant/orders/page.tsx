import type { Metadata } from "next";

import { RestaurantOrdersPanel } from "@/modules/restaurant-operations/components/restaurant-orders-panel";
import { getRestaurantOrdersContext } from "@/modules/restaurant-operations/lib/get-restaurant-operations-context";

export const metadata: Metadata = {
  title: "Orders",
};

export default async function RestaurantOrdersPage() {
  const { queue, permissions } = await getRestaurantOrdersContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-muted-foreground text-sm">
          Dine-in, takeaway, and delivery order queue with status, payment, and kitchen tracking.
        </p>
      </div>
      <RestaurantOrdersPanel initialQueue={queue} permissions={permissions} />
    </div>
  );
}
