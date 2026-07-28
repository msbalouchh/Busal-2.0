import type { Metadata } from "next";

import { ReceiptHistoryList } from "@/modules/receipts/components/receipt-history-list";
import { getReceiptsModuleContext } from "@/modules/receipts/lib/get-receipt-context";

export const metadata: Metadata = {
  title: "Receipts",
};

export default async function ReceiptsPage() {
  const data = await getReceiptsModuleContext();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Receipts</h1>
        <p className="text-muted-foreground text-sm">
          View receipt history, print customer receipts, and reprint kitchen tickets.
        </p>
      </div>
      <ReceiptHistoryList receipts={data.receipts} />
    </div>
  );
}
