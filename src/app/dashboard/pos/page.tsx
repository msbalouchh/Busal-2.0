import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { BRANCH_ROUTES } from "@/modules/branches/constants/routes";
import { PosManagementError } from "@/modules/pos/components/pos-management-error";
import { PosPageHeader } from "@/modules/pos/components/pos-page-header";
import { PosTerminal } from "@/modules/pos/components/pos-terminal";
import { getPosTerminalContext } from "@/modules/pos/lib/get-pos-context";

export const metadata: Metadata = {
  title: "POS",
};

export default async function PosPage() {
  const data = await getPosTerminalContext();

  if (data.status === "forbidden") {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <PosPageHeader
          title="Point of Sale"
          description="Take orders quickly, assign tables, hold tickets, and send orders to the kitchen."
        />
        <PosManagementError message={data.message} />
      </div>
    );
  }

  if (data.status === "setup") {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <PosPageHeader
          title="Point of Sale"
          description="Take orders quickly, assign tables, hold tickets, and send orders to the kitchen."
        />
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground max-w-lg text-sm">{data.message}</p>
          <Button asChild>
            <Link href={BRANCH_ROUTES.overview}>Configure branches</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (data.status === "error") {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <PosPageHeader
          title="Point of Sale"
          description="Take orders quickly, assign tables, hold tickets, and send orders to the kitchen."
        />
        <PosManagementError message={data.message} />
      </div>
    );
  }

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
