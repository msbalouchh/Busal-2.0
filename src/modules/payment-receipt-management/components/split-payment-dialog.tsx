"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { recordSplitOrderPaymentAction } from "@/modules/payment-receipt-management/actions/payment-receipt-actions";
import { ORDER_PAYMENT_METHOD_OPTIONS } from "@/modules/payment-receipt-management/constants/routes";
import type {
  OrderPaymentSummary,
  SplitPaymentLineInput,
} from "@/modules/payment-receipt-management/types/payment-receipt-types";

interface SplitPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  summary: OrderPaymentSummary | null;
  onComplete: () => void;
}

function createLine(remaining: number): SplitPaymentLineInput {
  return {
    paymentMethod: "CASH",
    amountPaid: remaining,
    amountTendered: remaining,
  };
}

export function SplitPaymentDialog({
  open,
  onOpenChange,
  branchId,
  summary,
  onComplete,
}: SplitPaymentDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [lines, setLines] = useState<SplitPaymentLineInput[]>([createLine(0)]);

  const remaining = summary?.remainingBalance ?? 0;
  const allocated = lines.reduce((sum, line) => sum + (line.amountPaid || 0), 0);

  const handleOpen = (nextOpen: boolean) => {
    if (nextOpen && summary) {
      setLines([createLine(summary.remainingBalance)]);
    }
    onOpenChange(nextOpen);
  };

  const updateLine = (index: number, patch: Partial<SplitPaymentLineInput>) => {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const handleSubmit = () => {
    if (!summary) return;

    startTransition(async () => {
      try {
        await recordSplitOrderPaymentAction({
          branchId,
          orderId: summary.orderId,
          lines,
        });
        toast.success("Split payment recorded");
        onComplete();
        onOpenChange(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Split payment failed");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Split payment</DialogTitle>
        </DialogHeader>

        {summary ? (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              {summary.orderNumber} · Remaining £{remaining.toFixed(2)} · Allocated £
              {allocated.toFixed(2)}
            </p>

            {lines.map((line, index) => (
              <div key={index} className="grid gap-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Line {index + 1}</p>
                  {lines.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
                <select
                  className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm"
                  value={line.paymentMethod}
                  onChange={(event) =>
                    updateLine(index, {
                      paymentMethod: event.target.value as SplitPaymentLineInput["paymentMethod"],
                    })
                  }
                >
                  {ORDER_PAYMENT_METHOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.amountPaid}
                  onChange={(event) =>
                    updateLine(index, { amountPaid: Number(event.target.value) })
                  }
                  placeholder="Amount"
                />
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLines((current) => [...current, createLine(0)])}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add split line
            </Button>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending || !summary}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Record split
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
