"use client";

import { Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { recordOrderPaymentAction } from "@/modules/payment-receipt-management/actions/payment-receipt-actions";
import { ORDER_PAYMENT_METHOD_OPTIONS } from "@/modules/payment-receipt-management/constants/routes";
import type { OrderPaymentSummary } from "@/modules/payment-receipt-management/types/payment-receipt-types";

interface TakePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  summary: OrderPaymentSummary | null;
  onComplete: () => void;
}

export function TakePaymentDialog({
  open,
  onOpenChange,
  branchId,
  summary,
  onComplete,
}: TakePaymentDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [method, setMethod] = useState("CASH");
  const [amount, setAmount] = useState("");
  const [amountTendered, setAmountTendered] = useState("");
  const [tipAmount, setTipAmount] = useState("0");

  const remaining = summary?.remainingBalance ?? 0;

  const handleOpen = (nextOpen: boolean) => {
    if (nextOpen && summary) {
      setAmount(summary.remainingBalance.toFixed(2));
      setAmountTendered(summary.remainingBalance.toFixed(2));
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = () => {
    if (!summary) return;

    const parsedAmount = Number(amount);
    const parsedTendered = Number(amountTendered);
    const parsedTip = Number(tipAmount);

    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    startTransition(async () => {
      try {
        await recordOrderPaymentAction({
          branchId,
          orderId: summary.orderId,
          paymentMethod: method as OrderPaymentSummary["payments"][number]["paymentMethod"],
          amountPaid: parsedAmount,
          amountTendered: method === "CASH" ? parsedTendered : parsedAmount,
          tipAmount: parsedTip,
        });
        toast.success("Payment recorded");
        onComplete();
        onOpenChange(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Payment failed");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Take payment</DialogTitle>
        </DialogHeader>

        {summary ? (
          <div className="space-y-4">
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium">{summary.orderNumber}</p>
              <p className="text-muted-foreground">Remaining balance: £{remaining.toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Method</Label>
              <select
                id="payment-method"
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm"
                value={method}
                onChange={(event) => setMethod(event.target.value)}
                disabled={isPending}
              >
                {ORDER_PAYMENT_METHOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-amount">Amount</Label>
              <Input
                id="payment-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={isPending}
              />
            </div>

            {method === "CASH" ? (
              <div className="space-y-2">
                <Label htmlFor="amount-tendered">Amount tendered</Label>
                <Input
                  id="amount-tendered"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountTendered}
                  onChange={(event) => setAmountTendered(event.target.value)}
                  disabled={isPending}
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="tip-amount">Tip</Label>
              <Input
                id="tip-amount"
                type="number"
                min="0"
                step="0.01"
                value={tipAmount}
                onChange={(event) => setTipAmount(event.target.value)}
                disabled={isPending}
              />
            </div>
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
            Record payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
