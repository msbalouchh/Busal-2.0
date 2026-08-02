"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudPlatformNav } from "@/modules/cloud-platform-management/components/cloud-platform-nav";
import type { UsageMetricRecord } from "@/modules/cloud-platform-management/types/cloud-platform-types";

interface CloudUsagePanelProps {
  usage: UsageMetricRecord[];
}

export function CloudUsagePanel({ usage }: CloudUsagePanelProps) {
  return (
    <div className="space-y-8">
      <CloudPlatformNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage analytics</CardTitle>
        </CardHeader>
        <CardContent>
          {usage.length === 0 ? (
            <p className="text-muted-foreground text-sm">No usage data.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {usage.map((m) => (
                <li key={m.resource} className="flex justify-between">
                  <span>{m.resource}</span>
                  <span>
                    {m.value} / {m.limit || "∞"} <Badge variant="outline">{m.utilization}%</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
