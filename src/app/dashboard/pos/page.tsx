import type { Metadata } from "next";

import { PosPageHeader } from "@/modules/pos/components/pos-page-header";
import { PosTerminal } from "@/modules/pos/components/pos-terminal";
import { getPosModuleContext } from "@/modules/pos/lib/get-pos-context";

export const metadata: Metadata = {
  title: "POS",
};

export default async function PosPage() {
  const data = await getPosModuleContext();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PosPageHeader
        title="Point of Sale"
        description="Take orders quickly, assign tables, hold tickets, and send orders to the kitchen."
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
