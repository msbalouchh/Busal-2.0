"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PAYMENT_METHOD_LABELS } from "@/modules/payments/constants/routes";
import { reprintReceiptAction } from "@/modules/receipts/actions/receipt-actions";
import {
  RECEIPT_PAPER_SIZE_LABELS,
  RECEIPT_PAPER_SIZES,
  RECEIPT_ROUTES,
  RECEIPT_TEMPLATE_LABELS,
  RECEIPT_TEMPLATE_TYPES,
  type ReceiptPaperSizeOption,
  type ReceiptTemplateTypeOption,
} from "@/modules/receipts/constants/routes";
import type { ReceiptPrintLogView, ReceiptView } from "@/modules/receipts/types/receipts";
import { formatReceiptMoney } from "@/modules/receipts/utils/receipt-utils";

interface ReceiptDetailViewProps {
  initialReceipt: ReceiptView;
  initialPrintLogs: ReceiptPrintLogView[];
}

export function ReceiptDetailView({ initialReceipt, initialPrintLogs }: ReceiptDetailViewProps) {
  const [receipt, setReceipt] = useState(initialReceipt);
  const [printLogs, setPrintLogs] = useState(initialPrintLogs);
  const [templateType, setTemplateType] = useState<ReceiptTemplateTypeOption>("CUSTOMER");
  const [paperSize, setPaperSize] = useState<ReceiptPaperSizeOption>("A4");
  const [isPending, startTransition] = useTransition();

  const printUrl = `${RECEIPT_ROUTES.printApi(receipt.id)}?template=${templateType}&paper=${paperSize}`;

  const handleReprint = () => {
    startTransition(async () => {
      try {
        const result = await reprintReceiptAction({
          receiptId: receipt.id,
          templateType,
          paperSize,
        });
        setReceipt(result.receipt);
        setPrintLogs((current) => [
          {
            id: `temp-${Date.now()}`,
            templateType,
            paperSize,
            status: "PRINTED",
            isReprint: true,
            createdAt: new Date().toISOString(),
          },
          ...current,
        ]);
        toast.success("Receipt reprinted");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Reprint failed");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-card rounded-xl border p-4 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{receipt.receiptNumber}</h2>
          <p className="text-muted-foreground text-sm">
            {receipt.businessName} · {new Date(receipt.createdAt).toLocaleString("en-GB")}
          </p>
        </div>

        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <p>Order: {receipt.orderNumber}</p>
          <p>Payment: {PAYMENT_METHOD_LABELS[receipt.paymentMethod]}</p>
          <p>Customer: {receipt.customerName ?? "Walk-in"}</p>
          <p>Staff: {receipt.staffName ?? "—"}</p>
          <p>Print Count: {receipt.printCount}</p>
          <p>Status: {receipt.lastPrintStatus ?? "Not printed"}</p>
        </div>
      </section>

      <section className="bg-card rounded-xl border p-4 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold">Items</h3>
        <ul className="divide-y">
          {receipt.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {item.quantity}x {item.name}
              </span>
              <span>{formatReceiptMoney(item.lineTotalPence)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatReceiptMoney(receipt.subtotalPence)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span>{formatReceiptMoney(receipt.discountPence)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatReceiptMoney(receipt.taxPence)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Grand Total</span>
            <span>{formatReceiptMoney(receipt.totalPence)}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment Amount</span>
            <span>{formatReceiptMoney(receipt.paymentAmountPence)}</span>
          </div>
          {receipt.amountTenderedPence != null ? (
            <div className="flex justify-between">
              <span>Amount Tendered</span>
              <span>{formatReceiptMoney(receipt.amountTenderedPence)}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span>Change Due</span>
            <span>{formatReceiptMoney(receipt.changeDuePence)}</span>
          </div>
        </div>
      </section>

      <section className="bg-card space-y-4 rounded-xl border p-4 shadow-sm">
        <h3 className="text-lg font-semibold">Print</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Template</span>
            <select
              className="border-input bg-background h-11 w-full rounded-md border px-3"
              value={templateType}
              onChange={(event) => setTemplateType(event.target.value as ReceiptTemplateTypeOption)}
            >
              {RECEIPT_TEMPLATE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {RECEIPT_TEMPLATE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Paper Size</span>
            <select
              className="border-input bg-background h-11 w-full rounded-md border px-3"
              value={paperSize}
              onChange={(event) => setPaperSize(event.target.value as ReceiptPaperSizeOption)}
            >
              {RECEIPT_PAPER_SIZES.map((size) => (
                <option key={size} value={size}>
                  {RECEIPT_PAPER_SIZE_LABELS[size]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="min-h-11">
            <a href={printUrl} target="_blank" rel="noreferrer">
              Print PDF
            </a>
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-11"
            disabled={isPending}
            onClick={handleReprint}
          >
            Reprint
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Reprint History</h3>
        {printLogs.length === 0 ? (
          <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
            No print history yet.
          </div>
        ) : (
          <ul className="divide-y rounded-lg border">
            {printLogs.map((log) => (
              <li key={log.id} className="p-4 text-sm">
                <p className="font-medium">
                  {RECEIPT_TEMPLATE_LABELS[log.templateType]} ·{" "}
                  {RECEIPT_PAPER_SIZE_LABELS[log.paperSize]}
                </p>
                <p className="text-muted-foreground text-xs">
                  {log.status} · {log.isReprint ? "Reprint" : "Print"} ·{" "}
                  {new Date(log.createdAt).toLocaleString("en-GB")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
