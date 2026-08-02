"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ObservabilityPlatformNav } from "@/modules/observability-platform-management/components/observability-platform-nav";
import type { AuditTimelineRecord } from "@/modules/observability-platform-management/types/observability-platform-types";

interface ObservabilityAuditPanelProps {
  timeline: AuditTimelineRecord[];
}

export function ObservabilityAuditPanel({ timeline }: ObservabilityAuditPanelProps) {
  return (
    <div className="space-y-8">
      <ObservabilityPlatformNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-muted-foreground text-sm">No audit events aggregated yet.</p>
          ) : (
            <ul className="space-y-3">
              {timeline.map((entry) => (
                <li key={entry.id} className="rounded-md border p-3 text-sm">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{entry.source}</Badge>
                    <Badge variant="secondary">{entry.action}</Badge>
                    <span className="text-muted-foreground ml-auto text-xs">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p>{entry.message}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
