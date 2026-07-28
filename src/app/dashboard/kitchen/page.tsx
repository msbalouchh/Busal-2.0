import type { Metadata } from "next";

import { KitchenDisplayManager } from "@/modules/kitchen/components/kitchen-display-manager";
import { KitchenPageHeader } from "@/modules/kitchen/components/kitchen-page-header";
import { getKitchenDisplayContext } from "@/modules/kitchen/lib/get-kitchen-display-context";

export const metadata: Metadata = {
  title: "Kitchen Display",
};

export default async function KitchenPage() {
  const orders = await getKitchenDisplayContext();

  return (
    <div className="flex min-h-full flex-col gap-4">
      <KitchenPageHeader
        title="Kitchen Display"
        description="Monitor active orders, move tickets through prep stages, and keep service flowing."
      />
      <KitchenDisplayManager initialOrders={orders} />
    </div>
  );
}
