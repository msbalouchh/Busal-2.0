"use client";

import { HardDrive } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaPlatformNav } from "@/modules/media-platform-management/components/media-platform-nav";
import { formatBytes } from "@/modules/media-platform-management/lib/media-platform-validation";
import type { StorageAnalyticsRecord } from "@/modules/media-platform-management/types/media-platform-types";

interface MediaAnalyticsPanelProps {
  analytics: StorageAnalyticsRecord;
}

export function MediaAnalyticsPanel({ analytics }: MediaAnalyticsPanelProps) {
  return (
    <div className="space-y-8">
      <MediaPlatformNav />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Storage used</CardTitle>
            <HardDrive className="text-muted-foreground h-4 w-4" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatBytes(analytics.usedBytes)}</p>
            <p className="text-muted-foreground text-xs">
              of {formatBytes(analytics.quotaBytes)} ({analytics.percentUsed}%)
            </p>
            <Badge variant={analytics.withinQuota ? "default" : "destructive"} className="mt-2">
              {analytics.withinQuota ? "Within quota" : "Quota exceeded"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage by type</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.byType.length === 0 ? (
            <p className="text-muted-foreground text-sm">No storage data yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {analytics.byType.map((row) => (
                <li key={row.fileType} className="flex items-center justify-between">
                  <span className="font-medium">{row.fileType}</span>
                  <span className="text-muted-foreground">
                    {row.count} files · {formatBytes(row.bytes)}
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
