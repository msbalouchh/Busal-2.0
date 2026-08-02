"use client";

import { Banknote } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPortalDate } from "@/modules/customer-portal/components/customer-portal-format";

import type { CustomerPaymentMethodsData } from "@/modules/customer-portal/types/customer-portal";

interface CustomerPortalPaymentsPanelProps {
  payments: CustomerPaymentMethodsData;
}

export function CustomerPortalPaymentsPanel({ payments }: CustomerPortalPaymentsPanelProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment methods used</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.savedMethods.length === 0 ? (
            <EmptyState
              title="No payment methods"
              description="Payment methods from your orders will appear here."
              icon={<Banknote className="text-muted-foreground h-6 w-6" />}
            />
          ) : (
            <ul className="divide-y">
              {payments.savedMethods.map((method) => (
                <li key={method.method} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{method.method}</p>
                    <p className="text-muted-foreground text-xs">
                      Last used {formatPortalDate(method.lastUsedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p>{method.lastAmountFormatted}</p>
                    <p className="text-muted-foreground text-xs">{method.usageCount} uses</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent payments</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.recentPayments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent payments.</p>
          ) : (
            <ul className="divide-y">
              {payments.recentPayments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{payment.paymentNumber}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatPortalDate(payment.paidAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{payment.amountPaidFormatted}</p>
                    <Badge variant="outline">{payment.paymentMethod}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
