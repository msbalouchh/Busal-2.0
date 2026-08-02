"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudPlatformNav } from "@/modules/cloud-platform-management/components/cloud-platform-nav";
import type { SubscriptionPlanRecord } from "@/modules/cloud-platform-management/types/cloud-platform-types";

interface CloudPlansPanelProps {
  plans: SubscriptionPlanRecord[];
}

export function CloudPlansPanel({ plans }: CloudPlansPanelProps) {
  return (
    <div className="space-y-8">
      <CloudPlatformNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscription plans</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {plans.map((plan) => (
              <li key={plan.id} className="rounded-md border p-3 text-sm">
                <div className="mb-1 flex flex-wrap gap-2">
                  <span className="font-medium">{plan.name}</span>
                  <Badge variant="outline">{plan.slug}</Badge>
                  <Badge>{plan.billingCycle}</Badge>
                </div>
                <p className="text-muted-foreground">{plan.description}</p>
                <p className="mt-1 font-medium">£{plan.price}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
