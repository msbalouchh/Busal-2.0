"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CUSTOMER_PORTAL_ROUTES } from "@/modules/customer-portal/constants/routes";
import { formatPortalDate } from "@/modules/customer-portal/components/customer-portal-format";

import type { CustomerOrderDetail } from "@/modules/customer-portal/types/customer-portal";

interface CustomerPortalOrderDetailPanelProps {
  order: CustomerOrderDetail;
}

export function CustomerPortalOrderDetailPanel({ order }: CustomerPortalOrderDetailPanelProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {order.items.map((item) => (
              <li key={item.id} className="py-3 text-sm">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {item.quantity}× {item.productName}
                    </p>
                    {item.modifiers.length > 0 ? (
                      <ul className="text-muted-foreground mt-1 text-xs">
                        {item.modifiers.map((modifier) => (
                          <li key={modifier.id}>+ {modifier.name}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <p className="font-medium">{item.totalAmount.toFixed(2)}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Branch:</span> {order.branchName}
            </p>
            <p>
              <span className="text-muted-foreground">Placed:</span>{" "}
              {formatPortalDate(order.placedAt)}
            </p>
            {order.completedAt ? (
              <p>
                <span className="text-muted-foreground">Completed:</span>{" "}
                {formatPortalDate(order.completedAt)}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-1 pt-1">
              <Badge variant="secondary">{order.status}</Badge>
              <Badge variant="outline">{order.paymentStatus}</Badge>
            </div>
            {order.notes ? <p className="text-muted-foreground pt-2">{order.notes}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="flex justify-between">
              <span>Subtotal</span>
              <span>{order.subtotal.toFixed(2)}</span>
            </p>
            <p className="flex justify-between">
              <span>Discount</span>
              <span>{order.discountAmount.toFixed(2)}</span>
            </p>
            <p className="flex justify-between">
              <span>Tax</span>
              <span>{order.taxAmount.toFixed(2)}</span>
            </p>
            <p className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{order.totalAmountFormatted}</span>
            </p>
          </CardContent>
        </Card>

        {order.payments.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {order.payments.map((payment) => (
                  <li key={payment.id} className="rounded border p-3">
                    <p className="font-medium">{payment.amountPaidFormatted}</p>
                    <p className="text-muted-foreground text-xs">
                      {payment.paymentMethod} · {formatPortalDate(payment.paidAt)}
                    </p>
                    {payment.receiptId ? (
                      <Link
                        href={CUSTOMER_PORTAL_ROUTES.receiptDetail(payment.receiptId)}
                        className="text-primary text-xs hover:underline"
                      >
                        View receipt
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
