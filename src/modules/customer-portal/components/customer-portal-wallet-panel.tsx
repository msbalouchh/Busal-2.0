"use client";

import { Wallet } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPortalDate } from "@/modules/customer-portal/components/customer-portal-format";

import type { CustomerWalletData } from "@/modules/customer-portal/types/customer-portal";

interface CustomerPortalWalletPanelProps {
  wallet: CustomerWalletData;
}

export function CustomerPortalWalletPanel({ wallet }: CustomerPortalWalletPanelProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Points balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{wallet.pointsBalance.toLocaleString()}</p>
          <p className="text-muted-foreground text-sm">
            Est. value: {wallet.estimatedValueFormatted}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Voucher balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{wallet.voucherBalanceFormatted}</p>
        </CardContent>
      </Card>
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {wallet.recentActivity.length === 0 ? (
            <EmptyState
              title="No wallet activity"
              description="Redemptions and rewards will show here."
              icon={<Wallet className="text-muted-foreground h-6 w-6" />}
            />
          ) : (
            <ul className="divide-y">
              {wallet.recentActivity.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{entry.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatPortalDate(entry.createdAt)}
                    </p>
                  </div>
                  <Badge variant="outline">{entry.type}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
