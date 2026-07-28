import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ReceiptDetailView } from "@/modules/receipts/components/receipt-detail-view";
import { RECEIPT_ROUTES } from "@/modules/receipts/constants/routes";
import { getReceiptDetailPageContext } from "@/modules/receipts/lib/get-receipt-context";

export const metadata: Metadata = {
  title: "Receipt Detail",
};

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ receiptId: string }>;
}) {
  const { receiptId } = await params;
  const data = await getReceiptDetailPageContext(receiptId);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Receipt Detail</h1>
          <p className="text-muted-foreground text-sm">{data.receipt.receiptNumber}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={RECEIPT_ROUTES.overview}>Back to Receipts</Link>
        </Button>
      </div>
      <ReceiptDetailView initialReceipt={data.receipt} initialPrintLogs={data.printLogs} />
    </div>
  );
}
