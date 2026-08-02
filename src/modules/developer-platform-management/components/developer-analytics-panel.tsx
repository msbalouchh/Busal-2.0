"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeveloperPlatformNav } from "@/modules/developer-platform-management/components/developer-platform-nav";
import type { UsageAnalyticsRecord } from "@/modules/developer-platform-management/types/developer-platform-types";

interface DeveloperAnalyticsPanelProps {
  analytics: UsageAnalyticsRecord;
}

export function DeveloperAnalyticsPanel({ analytics }: DeveloperAnalyticsPanelProps) {
  return (
    <div className="space-y-8">
      <DeveloperPlatformNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage (7 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{analytics.totalRequests7d}</p>
          <p className="text-muted-foreground text-sm">Total API requests</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By method</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.byMethod.length === 0 ? (
            <p className="text-muted-foreground text-sm">No usage data yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {analytics.byMethod.map((row) => (
                <li key={row.method} className="flex justify-between">
                  <span>{row.method}</span>
                  <span className="text-muted-foreground">
                    {row.count} · {row.avgDuration}ms avg
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
