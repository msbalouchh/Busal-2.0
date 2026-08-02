"use client";

import Link from "next/link";
import { Receipt } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CUSTOMER_PORTAL_ROUTES } from "@/modules/customer-portal/constants/routes";
import { formatPortalDate } from "@/modules/customer-portal/components/customer-portal-format";

import type { CustomerReceiptList } from "@/modules/customer-portal/types/customer-portal";

interface CustomerPortalReceiptsPanelProps {
  receipts: CustomerReceiptList;
}

export function CustomerPortalReceiptsPanel({ receipts }: CustomerPortalReceiptsPanelProps) {
  if (receipts.length === 0) {
    return (
      <EmptyState
        title="No receipts"
        description="Receipts from your orders will appear here."
        icon={<Receipt className="text-muted-foreground h-6 w-6" />}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {receipts.map((receipt) => (
        <Card key={receipt.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <Link
                href={CUSTOMER_PORTAL_ROUTES.receiptDetail(receipt.id)}
                className="hover:underline"
              >
                {receipt.receiptNumber}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Order {receipt.orderNumber}</p>
            <p className="font-semibold">{receipt.amountFormatted}</p>
            <p className="text-muted-foreground text-xs">{formatPortalDate(receipt.paidAt)}</p>
            <Button asChild size="sm" variant="outline">
              <a href={`/api/portal/receipts/${receipt.id}/download`}>Download</a>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
