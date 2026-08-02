"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CUSTOMER_PORTAL_ROUTES } from "@/modules/customer-portal/constants/routes";
import { formatPortalDate } from "@/modules/customer-portal/components/customer-portal-format";

import type { CustomerOrderList } from "@/modules/customer-portal/types/customer-portal";

interface CustomerPortalOrdersPanelProps {
  orders: CustomerOrderList;
}

export function CustomerPortalOrdersPanel({ orders }: CustomerPortalOrdersPanelProps) {
  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="When you place orders, they will show up here."
        icon={<ShoppingBag className="text-muted-foreground h-6 w-6" />}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <Link href={CUSTOMER_PORTAL_ROUTES.orderDetail(order.id)} className="hover:underline">
                {order.orderNumber}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">{formatPortalDate(order.placedAt)}</p>
            <p className="font-semibold">{order.totalAmountFormatted}</p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary">{order.status}</Badge>
              <Badge variant="outline">{order.orderType}</Badge>
              <Badge variant="outline">{order.paymentStatus}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
