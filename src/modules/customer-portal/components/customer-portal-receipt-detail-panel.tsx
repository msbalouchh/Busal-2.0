"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPortalDate } from "@/modules/customer-portal/components/customer-portal-format";

export interface CustomerPortalReceiptDetail {
  id: string;
  receiptNumber: string;
  orderNumber: string;
  paymentNumber: string;
  amountFormatted: string;
  paidAt: string;
  items: Array<{ name: string; quantity: number; total: number }>;
}

interface CustomerPortalReceiptDetailPanelProps {
  receipt: CustomerPortalReceiptDetail;
}

export function CustomerPortalReceiptDetailPanel({
  receipt,
}: CustomerPortalReceiptDetailPanelProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{receipt.receiptNumber}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Order:</span> {receipt.orderNumber}
          </p>
          <p>
            <span className="text-muted-foreground">Payment:</span> {receipt.paymentNumber}
          </p>
          <p>
            <span className="text-muted-foreground">Paid:</span> {formatPortalDate(receipt.paidAt)}
          </p>
          <p className="text-lg font-semibold">{receipt.amountFormatted}</p>
          <Button asChild size="sm" variant="outline">
            <a href={`/api/portal/receipts/${receipt.id}/download`}>Download receipt</a>
          </Button>
        </CardContent>
      </Card>

      {receipt.items.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {receipt.items.map((item, index) => (
                <li key={index} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <Badge variant="outline">Qty {item.quantity}</Badge>
                  </div>
                  <p>{item.total.toFixed(2)}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
