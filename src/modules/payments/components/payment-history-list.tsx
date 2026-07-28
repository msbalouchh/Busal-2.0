"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/modules/payments/constants/routes";
import type { PaymentView } from "@/modules/payments/types/payments";
import { formatPaymentMoney } from "@/modules/payments/utils/payment-utils";

interface PaymentHistoryListProps {
  payments: PaymentView[];
  isPending: boolean;
  onVoid: (paymentId: string) => void;
}

export function PaymentHistoryList({ payments, isPending, onVoid }: PaymentHistoryListProps) {
  if (payments.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
        No payments recorded yet.
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {payments.map((payment) => (
        <li key={payment.id} className="flex items-start justify-between gap-3 p-4">
          <div className="space-y-1">
            <p className="font-medium">
              {PAYMENT_METHOD_LABELS[payment.method]} · {formatPaymentMoney(payment.amount)}
            </p>
            <p className="text-muted-foreground text-xs">
              {PAYMENT_STATUS_LABELS[payment.status]} ·{" "}
              {new Date(payment.createdAt).toLocaleString()}
            </p>
            {payment.method === "CASH" && payment.amountTendered != null ? (
              <p className="text-muted-foreground text-xs">
                Tendered {formatPaymentMoney(payment.amountTendered)}
              </p>
            ) : null}
          </div>
          {payment.status === "COMPLETED" ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9"
              disabled={isPending}
              onClick={() => onVoid(payment.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
