"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeveloperPlatformNav } from "@/modules/developer-platform-management/components/developer-platform-nav";
import type { ApiRequestLogRecord } from "@/modules/developer-platform-management/types/developer-platform-types";

interface DeveloperLogsPanelProps {
  logs: ApiRequestLogRecord[];
}

export function DeveloperLogsPanel({ logs }: DeveloperLogsPanelProps) {
  return (
    <div className="space-y-8">
      <DeveloperPlatformNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request logs</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No request logs yet.</p>
          ) : (
            <ul className="space-y-3">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {log.method} {log.path}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {log.applicationName ?? "Unknown app"} · {log.ipAddress || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={log.statusCode < 400 ? "default" : "destructive"}>
                      {log.statusCode}
                    </Badge>
                    <span className="text-muted-foreground text-xs">{log.duration}ms</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
