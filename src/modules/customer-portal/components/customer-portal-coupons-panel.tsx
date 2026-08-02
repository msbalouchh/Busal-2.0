"use client";

import { Ticket } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { CustomerCouponList } from "@/modules/customer-portal/types/customer-portal";

interface CustomerPortalCouponsPanelProps {
  coupons: CustomerCouponList;
}

export function CustomerPortalCouponsPanel({ coupons }: CustomerPortalCouponsPanelProps) {
  if (coupons.length === 0) {
    return (
      <EmptyState
        title="No coupons available"
        description="Available discounts and offers will show here."
        icon={<Ticket className="text-muted-foreground h-6 w-6" />}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {coupons.map((coupon) => (
        <Card key={coupon.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{coupon.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Badge variant="outline">{coupon.type}</Badge>
            {coupon.valueFormatted ? (
              <p className="font-semibold">{coupon.valueFormatted} off</p>
            ) : null}
            {coupon.percentage != null ? (
              <p className="font-semibold">{coupon.percentage}% off</p>
            ) : null}
            <p className="text-muted-foreground">
              {coupon.pointsCost.toLocaleString()} points to redeem
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
