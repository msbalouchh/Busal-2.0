import type { Metadata } from "next";

import { PosPageHeader } from "@/modules/pos/components/pos-page-header";
import { PosTerminal } from "@/modules/pos/components/pos-terminal";
import { getRestaurantPosContext } from "@/modules/restaurant-operations/lib/get-restaurant-operations-context";

export const metadata: Metadata = {
  title: "POS",
};

export default async function RestaurantPosPage() {
  const data = await getRestaurantPosContext();

  return (
    <div className="space-y-6">
      <PosPageHeader
        title="Point of Sale"
        description="New sales, existing orders, discounts, taxes, split bills, payments, and receipts."
      />
      <PosTerminal
        posSessionId={data.posSessionId}
        initialCart={data.cart}
        initialHeldOrders={data.heldOrders}
        categories={data.categories}
        menuItems={data.menuItems}
        tables={data.tables}
      />
    </div>
  );
}
