"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ObservabilityPlatformNav } from "@/modules/observability-platform-management/components/observability-platform-nav";
import type { LogRecord } from "@/modules/observability-platform-management/types/observability-platform-types";

interface ObservabilityLogsPanelProps {
  logs: LogRecord[];
  filters: { service?: string; level?: string; search?: string };
}

function levelVariant(level: string): "default" | "secondary" | "destructive" | "outline" {
  if (level === "CRITICAL" || level === "ERROR") return "destructive";
  if (level === "WARNING") return "secondary";
  return "outline";
}

export function ObservabilityLogsPanel({ logs, filters }: ObservabilityLogsPanelProps) {
  return (
    <div className="space-y-8">
      <ObservabilityPlatformNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log explorer</CardTitle>
        </CardHeader>
        <CardContent>
          {(filters.service || filters.level || filters.search) && (
            <p className="text-muted-foreground mb-4 text-sm">
              Filters:{" "}
              {[filters.service, filters.level, filters.search].filter(Boolean).join(" · ")}
            </p>
          )}
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No logs found.</p>
          ) : (
            <ul className="space-y-3">
              {logs.map((log) => (
                <li key={log.id} className="rounded-md border p-3 text-sm">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant={levelVariant(log.level)}>{log.level}</Badge>
                    <Badge variant="outline">{log.service}</Badge>
                    <Badge variant="secondary">{log.category}</Badge>
                    <span className="text-muted-foreground ml-auto text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p>{log.message}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
