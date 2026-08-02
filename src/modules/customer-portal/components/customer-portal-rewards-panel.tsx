"use client";

import { useTransition } from "react";
import { Gift } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redeemCustomerRewardAction } from "@/modules/customer-portal/actions/customer-portal-actions";

import type { CustomerRewardList } from "@/modules/customer-portal/types/customer-portal";

interface CustomerPortalRewardsPanelProps {
  rewards: CustomerRewardList;
  pointsBalance: number;
}

export function CustomerPortalRewardsPanel({
  rewards,
  pointsBalance,
}: CustomerPortalRewardsPanelProps) {
  const [isPending, startTransition] = useTransition();

  if (rewards.length === 0) {
    return (
      <EmptyState
        title="No rewards available"
        description="Check back later for new rewards."
        icon={<Gift className="text-muted-foreground h-6 w-6" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        You have{" "}
        <span className="text-foreground font-medium">{pointsBalance.toLocaleString()}</span> points
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rewards.map((reward) => (
          <Card key={reward.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{reward.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Badge variant="outline">{reward.type}</Badge>
              <p>{reward.pointsCost.toLocaleString()} points</p>
              <Button
                size="sm"
                disabled={!reward.canRedeem || isPending}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      await redeemCustomerRewardAction(reward.id);
                      toast.success("Reward redeemed!");
                    } catch (error) {
                      toast.error(
                        error instanceof Error ? error.message : "Unable to redeem reward.",
                      );
                    }
                  })
                }
              >
                Redeem
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
