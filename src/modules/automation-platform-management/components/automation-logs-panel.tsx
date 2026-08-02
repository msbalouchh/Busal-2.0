"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AutomationPlatformNav } from "@/modules/automation-platform-management/components/automation-platform-nav";
import type { AutomationLogRecord } from "@/modules/automation-platform-management/types/automation-platform-types";

interface AutomationLogsPanelProps {
  logs: AutomationLogRecord[];
}

export function AutomationLogsPanel({ logs }: AutomationLogsPanelProps) {
  return (
    <div className="space-y-8">
      <AutomationPlatformNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Execution logs ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No logs yet.</p>
          ) : (
            <ul className="space-y-2">
              {logs.map((log) => (
                <li key={log.id} className="rounded border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{log.workflowName}</span>
                    <span className="text-muted-foreground text-xs">{log.level}</span>
                  </div>
                  <p className="mt-1">{log.message}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {new Date(log.timestamp).toLocaleString()}
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
