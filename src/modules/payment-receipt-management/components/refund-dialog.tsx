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
import { refundOrderPaymentAction } from "@/modules/payment-receipt-management/actions/payment-receipt-actions";
import type { OrderPaymentRecord } from "@/modules/payment-receipt-management/types/payment-receipt-types";

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  payment: OrderPaymentRecord | null;
  onComplete: () => void;
}

export function RefundDialog({
  open,
  onOpenChange,
  branchId,
  payment,
  onComplete,
}: RefundDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");

  const handleOpen = (nextOpen: boolean) => {
    if (nextOpen && payment) {
      setAmount(payment.amountPaid.toFixed(2));
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = () => {
    if (!payment) return;
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) {
      toast.error("Enter a valid refund amount");
      return;
    }

    startTransition(async () => {
      try {
        await refundOrderPaymentAction({
          branchId,
          paymentId: payment.id,
          amount: parsed,
          reference,
        });
        toast.success("Refund recorded");
        onComplete();
        onOpenChange(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Refund failed");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refund payment</DialogTitle>
        </DialogHeader>
        {payment ? (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              {payment.paymentNumber} · Paid £{payment.amountPaid.toFixed(2)}
            </p>
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Refund amount</Label>
              <Input
                id="refund-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund-reference">Reference</Label>
              <Input
                id="refund-reference"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
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
          <Button type="button" onClick={handleSubmit} disabled={isPending || !payment}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
