"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { activateSubscriptionAction } from "@/modules/cloud-platform-management/actions/cloud-platform-actions";
import { CloudPlatformNav } from "@/modules/cloud-platform-management/components/cloud-platform-nav";
import type { CloudPlatformContext } from "@/modules/cloud-platform-management/lib/get-cloud-platform-context";
import type { SubscriptionRecord } from "@/modules/cloud-platform-management/types/cloud-platform-types";

interface CloudSubscriptionsPanelProps {
  context: CloudPlatformContext;
  subscriptions: SubscriptionRecord[];
}

export function CloudSubscriptionsPanel({ context, subscriptions }: CloudSubscriptionsPanelProps) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="space-y-8">
      <CloudPlatformNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No subscriptions.</p>
          ) : (
            <ul className="space-y-3">
              {subscriptions.map((s) => (
                <li key={s.id} className="rounded-md border p-3 text-sm">
                  <div className="mb-2 flex gap-2">
                    <span className="font-medium">{s.planName}</span>
                    <Badge>{s.status}</Badge>
                  </div>
                  {context.permissionsFlags.canManageSubscriptions && s.status === "TRIAL" && (
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => startTransition(() => activateSubscriptionAction(s.id))}
                    >
                      Activate (framework)
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
