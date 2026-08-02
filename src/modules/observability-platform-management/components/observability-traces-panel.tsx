"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ObservabilityPlatformNav } from "@/modules/observability-platform-management/components/observability-platform-nav";
import type { TraceRecord } from "@/modules/observability-platform-management/types/observability-platform-types";

interface ObservabilityTracesPanelProps {
  traces: TraceRecord[];
  serviceFilter: string;
}

export function ObservabilityTracesPanel({ traces, serviceFilter }: ObservabilityTracesPanelProps) {
  return (
    <div className="space-y-8">
      <ObservabilityPlatformNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Trace explorer{serviceFilter ? ` — ${serviceFilter}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {traces.length === 0 ? (
            <p className="text-muted-foreground text-sm">No traces recorded.</p>
          ) : (
            <ul className="space-y-3">
              {traces.map((trace) => (
                <li key={trace.id} className="rounded-md border p-3 text-sm">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{trace.service}</Badge>
                    <Badge variant={trace.status === "error" ? "destructive" : "secondary"}>
                      {trace.status}
                    </Badge>
                    <span className="text-muted-foreground ml-auto text-xs">
                      {trace.durationMs}ms
                    </span>
                  </div>
                  <p className="font-medium">{trace.operation}</p>
                  <p className="text-muted-foreground text-xs">
                    trace {trace.traceId} · span {trace.spanId}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
