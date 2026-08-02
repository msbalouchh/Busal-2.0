"use client";

import type { LoyaltyAccountRecord } from "@/modules/customer-crm-management/types/customer-crm-types";
import { LoyaltyTierBadge } from "@/modules/customer-crm-management/components/loyalty-tier-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MembershipCardProps {
  customerName: string;
  customerCode: string | null;
  account: LoyaltyAccountRecord;
}

export function MembershipCard({ customerName, customerCode, account }: MembershipCardProps) {
  return (
    <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-300">Loyalty Membership</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-2xl font-semibold">{customerName}</p>
          <p className="text-sm text-slate-300">{customerCode ?? account.membershipNumber}</p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-wide text-slate-400 uppercase">Points balance</p>
            <p className="text-3xl font-bold">{account.pointsBalance.toLocaleString()}</p>
          </div>
          <LoyaltyTierBadge tier={account.tier} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
          <div>
            <p className="text-xs tracking-wide text-slate-400 uppercase">Lifetime</p>
            <p>{account.lifetimePoints.toLocaleString()} pts</p>
          </div>
          <div>
            <p className="text-xs tracking-wide text-slate-400 uppercase">Redeemed</p>
            <p>{account.totalRedeemedPoints.toLocaleString()} pts</p>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Member since {new Date(account.joinedAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
