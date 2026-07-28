"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PAYMENT_ROUTES } from "@/modules/payments/constants/routes";
import type { UnpaidOrderView } from "@/modules/payments/types/payments";
import { formatPaymentMoney } from "@/modules/payments/utils/payment-utils";

interface PaymentOrderListProps {
  orders: UnpaidOrderView[];
}

export function PaymentOrderList({ orders }: PaymentOrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="text-muted-foreground flex min-h-48 items-center justify-center rounded-xl border border-dashed p-8 text-sm">
        No orders awaiting payment.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {orders.map((order) => (
        <div
          key={order.orderId}
          className="bg-card flex flex-col gap-4 rounded-xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-1">
            <p className="font-semibold">{order.orderNumber}</p>
            <p className="text-muted-foreground text-sm">
              {order.tableName ? `Table ${order.tableName}` : "Walk-in"}
              {order.customerName ? ` · ${order.customerName}` : ""}
            </p>
            <p className="text-sm">
              Paid {formatPaymentMoney(order.amountPaid)} · Remaining{" "}
              <span className="font-semibold">{formatPaymentMoney(order.remainingBalance)}</span>
            </p>
          </div>
          <Button asChild className="min-h-11 touch-manipulation">
            <Link href={PAYMENT_ROUTES.order(order.orderId)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Take Payment
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
