import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { BRANCH_ROUTES } from "@/modules/branches/constants/routes";
import { PosManagementError } from "@/modules/pos/components/pos-management-error";
import { PosPageHeader } from "@/modules/pos/components/pos-page-header";
import { PosTerminal } from "@/modules/pos/components/pos-terminal";
import { getRestaurantPosContext } from "@/modules/restaurant-operations/lib/get-restaurant-operations-context";

export const metadata: Metadata = {
  title: "POS",
};

export default async function RestaurantPosPage() {
  const { terminal } = await getRestaurantPosContext();

  if (terminal.status === "forbidden" || terminal.status === "error") {
    return (
      <div className="space-y-6">
        <PosPageHeader
          title="Point of Sale"
          description="New sales, existing orders, discounts, taxes, split bills, payments, and receipts."
        />
        <PosManagementError message={terminal.message} />
      </div>
    );
  }

  if (terminal.status === "setup") {
    return (
      <div className="space-y-6">
        <PosPageHeader
          title="Point of Sale"
          description="New sales, existing orders, discounts, taxes, split bills, payments, and receipts."
        />
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground max-w-lg text-sm">{terminal.message}</p>
          <Button asChild>
            <Link href={BRANCH_ROUTES.overview}>Configure branches</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PosPageHeader
        title="Point of Sale"
        description="New sales, existing orders, discounts, taxes, split bills, payments, and receipts."
      />
      <PosTerminal
        posSessionId={terminal.posSessionId}
        initialCart={terminal.cart}
        initialHeldOrders={terminal.heldOrders}
        categories={terminal.categories}
        menuItems={terminal.menuItems}
        tables={terminal.tables}
      />
    </div>
  );
}
