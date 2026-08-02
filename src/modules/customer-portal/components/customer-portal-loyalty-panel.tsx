"use client";

import { Star } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPortalDate } from "@/modules/customer-portal/components/customer-portal-format";

import type { CustomerLoyaltyDashboard } from "@/modules/customer-portal/types/customer-portal";

interface CustomerPortalLoyaltyPanelProps {
  loyalty: CustomerLoyaltyDashboard;
}

export function CustomerPortalLoyaltyPanel({ loyalty }: CustomerPortalLoyaltyPanelProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Membership</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-3xl font-bold">{loyalty.pointsBalance.toLocaleString()}</p>
          <p className="text-muted-foreground">Points balance</p>
          <Badge>{loyalty.tier}</Badge>
          {loyalty.membershipNumber ? (
            <p className="text-muted-foreground pt-2">Member #{loyalty.membershipNumber}</p>
          ) : null}
          <p>Lifetime: {loyalty.lifetimePoints.toLocaleString()} pts</p>
          <p>Redeemed: {loyalty.totalRedeemedPoints.toLocaleString()} pts</p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Recent transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loyalty.transactions.length === 0 ? (
            <EmptyState
              title="No transactions yet"
              description="Points activity will appear here."
              icon={<Star className="text-muted-foreground h-6 w-6" />}
            />
          ) : (
            <ul className="divide-y">
              {loyalty.transactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{tx.reason ?? tx.type}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatPortalDate(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={tx.pointsChange >= 0 ? "text-green-600" : "text-red-600"}>
                      {tx.pointsChange >= 0 ? "+" : ""}
                      {tx.pointsChange}
                    </p>
                    <p className="text-muted-foreground text-xs">Balance: {tx.balanceAfter}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-base">Redemptions</CardTitle>
        </CardHeader>
        <CardContent>
          {loyalty.redemptions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No redemptions yet.</p>
          ) : (
            <ul className="divide-y">
              {loyalty.redemptions.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{entry.rewardName}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatPortalDate(entry.createdAt)}
                    </p>
                  </div>
                  <Badge variant="outline">{entry.rewardType}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
