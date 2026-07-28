"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PAYMENT_METHOD_LABELS } from "@/modules/payments/constants/routes";
import { RECEIPT_ROUTES } from "@/modules/receipts/constants/routes";
import type { ReceiptListItemView } from "@/modules/receipts/types/receipts";
import { formatReceiptMoney } from "@/modules/receipts/utils/receipt-utils";

interface ReceiptHistoryListProps {
  receipts: ReceiptListItemView[];
}

export function ReceiptHistoryList({ receipts }: ReceiptHistoryListProps) {
  if (receipts.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
        No receipts yet. Receipts are created automatically after successful payments.
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {receipts.map((receipt) => (
        <li key={receipt.id} className="flex items-start justify-between gap-3 p-4">
          <div className="space-y-1">
            <p className="font-medium">
              {receipt.receiptNumber} · {receipt.orderNumber}
            </p>
            <p className="text-muted-foreground text-xs">
              {PAYMENT_METHOD_LABELS[receipt.paymentMethod]} ·{" "}
              {formatReceiptMoney(receipt.paymentAmountPence)} ·{" "}
              {new Date(receipt.createdAt).toLocaleString("en-GB")}
            </p>
            {receipt.customerName ? (
              <p className="text-muted-foreground text-xs">{receipt.customerName}</p>
            ) : null}
            <p className="text-muted-foreground text-xs">
              Prints: {receipt.printCount}
              {receipt.lastPrintStatus ? ` · ${receipt.lastPrintStatus}` : ""}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={RECEIPT_ROUTES.detail(receipt.id)}>View</Link>
          </Button>
        </li>
      ))}
    </ul>
  );
}
