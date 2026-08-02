"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CUSTOMER_PORTAL_ROUTES } from "@/modules/customer-portal/constants/routes";
import { formatPortalDate } from "@/modules/customer-portal/components/customer-portal-format";

import type { CustomerInvoiceList } from "@/modules/customer-portal/types/customer-portal";

interface CustomerPortalInvoicesPanelProps {
  invoices: CustomerInvoiceList;
}

export function CustomerPortalInvoicesPanel({ invoices }: CustomerPortalInvoicesPanelProps) {
  if (invoices.length === 0) {
    return (
      <EmptyState
        title="No invoices"
        description="Invoices issued to you will appear here."
        icon={<FileText className="text-muted-foreground h-6 w-6" />}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {invoices.map((invoice) => (
        <Card key={invoice.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <Link
                href={CUSTOMER_PORTAL_ROUTES.invoiceDetail(invoice.id)}
                className="hover:underline"
              >
                {invoice.invoiceNumber}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-semibold">{invoice.totalFormatted}</p>
            <p className="text-muted-foreground text-xs">Paid {invoice.amountPaidFormatted}</p>
            <Badge variant="secondary">{invoice.status}</Badge>
            {invoice.issuedAt ? (
              <p className="text-muted-foreground text-xs">
                Issued {formatPortalDate(invoice.issuedAt)}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
