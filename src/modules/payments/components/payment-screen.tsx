"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recordPaymentAction, voidPaymentAction } from "@/modules/payments/actions/payment-actions";
import { PaymentHistoryList } from "@/modules/payments/components/payment-history-list";
import { PaymentMethodSelector } from "@/modules/payments/components/payment-method-selector";
import { PaymentSummaryPanel } from "@/modules/payments/components/payment-summary-panel";
import { PAYMENT_ROUTES, type PaymentMethodOption } from "@/modules/payments/constants/routes";
import type { PaymentOrderContextView } from "@/modules/payments/types/payments";
import {
  calculateCashChange,
  formatPaymentAmountInput,
  formatPaymentMoney,
  parsePaymentAmount,
} from "@/modules/payments/utils/payment-utils";

interface PaymentScreenProps {
  initialContext: PaymentOrderContextView;
}

export function PaymentScreen({ initialContext }: PaymentScreenProps) {
  const [context, setContext] = useState(initialContext);
  const [method, setMethod] = useState<PaymentMethodOption>("CASH");
  const [amount, setAmount] = useState(formatPaymentAmountInput(context.summary.remainingBalance));
  const [amountTendered, setAmountTendered] = useState("");
  const [isPending, startTransition] = useTransition();

  const parsedAmount = useMemo(() => parsePaymentAmount(amount), [amount]);
  const parsedTendered = useMemo(() => parsePaymentAmount(amountTendered), [amountTendered]);
  const previewChange = useMemo(() => {
    if (method !== "CASH" || parsedAmount == null || parsedTendered == null) {
      return 0;
    }

    return calculateCashChange(parsedAmount, parsedTendered);
  }, [method, parsedAmount, parsedTendered]);

  const runAction = (action: () => Promise<void>) => {
    startTransition(async () => {
      try {
        await action();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Payment action failed");
      }
    });
  };

  const payRemaining = () => {
    setAmount(formatPaymentAmountInput(context.summary.remainingBalance));
    if (method === "CASH") {
      setAmountTendered(formatPaymentAmountInput(context.summary.remainingBalance));
    }
  };

  const recordPayment = () => {
    if (parsedAmount == null || parsedAmount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }

    if (parsedAmount > context.summary.remainingBalance) {
      toast.error("Payment amount exceeds remaining balance");
      return;
    }

    runAction(async () => {
      const result = await recordPaymentAction({
        orderId: context.orderId,
        method,
        amountPence: parsedAmount,
        amountTenderedPence: method === "CASH" ? (parsedTendered ?? parsedAmount) : parsedAmount,
      });

      setContext((current) => ({
        ...current,
        summary: result.summary,
      }));
      setAmount(formatPaymentAmountInput(result.summary.remainingBalance));
      setAmountTendered("");
      toast.success(
        result.summary.isFullyPaid
          ? "Payment complete. Order is ready for receipt."
          : "Partial payment recorded",
      );
    });
  };

  const voidPayment = (paymentId: string) => {
    runAction(async () => {
      const result = await voidPaymentAction({
        paymentId,
        orderId: context.orderId,
      });

      setContext((current) => ({
        ...current,
        summary: result.summary,
      }));
      setAmount(formatPaymentAmountInput(result.summary.remainingBalance));
      toast.success("Payment voided");
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{context.orderNumber}</h2>
          <p className="text-muted-foreground text-sm">
            {context.tableName ? `Table ${context.tableName}` : "Walk-in"}
            {context.customerName ? ` · ${context.customerName}` : ""} · {context.itemCount} items
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={PAYMENT_ROUTES.overview}>Back to Payments</Link>
        </Button>
      </div>

      <PaymentSummaryPanel summary={context.summary} />

      {context.summary.isFullyPaid ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          Payment complete. This order is ready for receipt.
        </div>
      ) : (
        <section className="bg-card grid gap-4 rounded-xl border p-4 shadow-sm lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">Payment Method</p>
              <PaymentMethodSelector
                value={method}
                disabled={isPending}
                onChange={(nextMethod) => {
                  setMethod(nextMethod);
                  if (nextMethod === "CARD") {
                    setAmountTendered("");
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="payment-amount">
                Payment Amount
              </label>
              <Input
                id="payment-amount"
                inputMode="decimal"
                value={amount}
                disabled={isPending}
                onChange={(event) => setAmount(event.target.value)}
                className="h-11"
              />
              <Button type="button" variant="secondary" disabled={isPending} onClick={payRemaining}>
                Pay Remaining ({formatPaymentMoney(context.summary.remainingBalance)})
              </Button>
            </div>

            {method === "CASH" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="amount-tendered">
                  Cash Tendered
                </label>
                <Input
                  id="amount-tendered"
                  inputMode="decimal"
                  value={amountTendered}
                  disabled={isPending}
                  onChange={(event) => setAmountTendered(event.target.value)}
                  className="h-11"
                />
                <p className="text-muted-foreground text-sm">
                  Change due: {formatPaymentMoney(previewChange)}
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col justify-end gap-3">
            <p className="text-muted-foreground text-sm">
              Split payments are supported by recording multiple cash or card payments until the
              remaining balance reaches zero.
            </p>
            <Button
              type="button"
              className="min-h-12 touch-manipulation"
              disabled={isPending}
              onClick={recordPayment}
            >
              Record Payment
            </Button>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Payment History</h3>
        <PaymentHistoryList
          payments={context.summary.payments}
          isPending={isPending}
          onVoid={voidPayment}
        />
      </section>
    </div>
  );
}
