"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toggleFeatureFlagAction } from "@/modules/cloud-platform-management/actions/cloud-platform-actions";
import { CloudPlatformNav } from "@/modules/cloud-platform-management/components/cloud-platform-nav";
import type { CloudPlatformContext } from "@/modules/cloud-platform-management/lib/get-cloud-platform-context";
import type { FeatureFlagRecord } from "@/modules/cloud-platform-management/types/cloud-platform-types";

interface CloudFeatureFlagsPanelProps {
  context: CloudPlatformContext;
  flags: FeatureFlagRecord[];
}

export function CloudFeatureFlagsPanel({ context, flags }: CloudFeatureFlagsPanelProps) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="space-y-8">
      <CloudPlatformNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tenant feature flags</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {flags.map((flag) => (
              <li key={flag.id} className="flex items-center justify-between rounded-md border p-2">
                <span>{flag.key}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={flag.enabled ? "default" : "secondary"}>
                    {flag.enabled ? "On" : "Off"}
                  </Badge>
                  {context.permissionsFlags.canManage && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        startTransition(() => toggleFeatureFlagAction(flag.id, !flag.enabled))
                      }
                    >
                      Toggle
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
