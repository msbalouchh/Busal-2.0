import type { Metadata } from "next";

import { KitchenDisplayManager } from "@/modules/kitchen/components/kitchen-display-manager";
import { KitchenPageHeader } from "@/modules/kitchen/components/kitchen-page-header";
import { getRestaurantKitchenContext } from "@/modules/restaurant-operations/lib/get-restaurant-operations-context";

export const metadata: Metadata = {
  title: "Kitchen Display",
};

export default async function RestaurantKitchenPage() {
  const { orders } = await getRestaurantKitchenContext();

  return (
    <div className="space-y-6">
      <KitchenPageHeader
        title="Kitchen Display System"
        description="Kitchen queue, priorities, preparation status, ready tickets, and filters."
      />
      <KitchenDisplayManager initialOrders={orders} />
    </div>
  );
}
