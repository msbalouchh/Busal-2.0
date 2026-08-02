"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntegrationPlatformNav } from "@/modules/integration-platform-management/components/integration-platform-nav";
import type { IntegrationLogRecord } from "@/modules/integration-platform-management/types/integration-platform-types";

interface IntegrationLogsPanelProps {
  logs: IntegrationLogRecord[];
}

export function IntegrationLogsPanel({ logs }: IntegrationLogsPanelProps) {
  return (
    <div className="space-y-8">
      <IntegrationPlatformNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Integration logs ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No logs recorded.</p>
          ) : (
            <ul className="space-y-2">
              {logs.map((log) => (
                <li key={log.id} className="rounded border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{log.level}</Badge>
                    {log.connectionName ? (
                      <span className="text-muted-foreground">{log.connectionName}</span>
                    ) : null}
                    <span className="text-muted-foreground text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1">{log.message}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
