"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPortalDate } from "@/modules/customer-portal/components/customer-portal-format";

import type { CustomerInvoiceDetail } from "@/modules/customer-portal/types/customer-portal";

interface CustomerPortalInvoiceDetailPanelProps {
  invoice: CustomerInvoiceDetail;
}

export function CustomerPortalInvoiceDetailPanel({
  invoice,
}: CustomerPortalInvoiceDetailPanelProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Line items</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {invoice.lineItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{item.description}</p>
                  <p className="text-muted-foreground text-xs">
                    {item.quantity} × {item.unitPriceFormatted}
                  </p>
                </div>
                <p className="font-medium">{item.totalFormatted}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{invoice.invoiceNumber}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Badge variant="secondary">{invoice.status}</Badge>
          {invoice.issuedAt ? (
            <p>
              <span className="text-muted-foreground">Issued:</span>{" "}
              {formatPortalDate(invoice.issuedAt)}
            </p>
          ) : null}
          {invoice.dueAt ? (
            <p>
              <span className="text-muted-foreground">Due:</span> {formatPortalDate(invoice.dueAt)}
            </p>
          ) : null}
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span>{invoice.subtotalFormatted}</span>
          </p>
          <p className="flex justify-between">
            <span>Tax</span>
            <span>{invoice.taxFormatted}</span>
          </p>
          <p className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{invoice.totalFormatted}</span>
          </p>
          <p className="flex justify-between">
            <span>Paid</span>
            <span>{invoice.amountPaidFormatted}</span>
          </p>
          {invoice.notes ? <p className="text-muted-foreground pt-2">{invoice.notes}</p> : null}
          <Button asChild size="sm" variant="outline" className="mt-2">
            <a href={`/api/portal/invoices/${invoice.id}/download`}>Download invoice</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
