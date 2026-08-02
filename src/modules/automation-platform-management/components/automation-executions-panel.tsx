"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { retryFailedExecutionsAction } from "@/modules/automation-platform-management/actions/automation-platform-actions";
import { AutomationPlatformNav } from "@/modules/automation-platform-management/components/automation-platform-nav";
import type { AutomationPlatformContext } from "@/modules/automation-platform-management/lib/get-automation-platform-context";
import type { AutomationExecutionRecord } from "@/modules/automation-platform-management/types/automation-platform-types";

interface AutomationExecutionsPanelProps {
  context: AutomationPlatformContext;
  executions: AutomationExecutionRecord[];
  history: { total: number; completed: number; failed: number; running: number };
}

export function AutomationExecutionsPanel({
  context,
  executions,
  history,
}: AutomationExecutionsPanelProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <AutomationPlatformNav />

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {history.total} total · {history.completed} completed · {history.failed} failed
        </p>
        {context.permissionsFlags.canExecute ? (
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await retryFailedExecutionsAction();
              })
            }
          >
            Retry failed
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Execution history</CardTitle>
        </CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No executions yet.</p>
          ) : (
            <ul className="space-y-3">
              {executions.map((execution) => (
                <li key={execution.id} className="rounded border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{execution.workflowName}</span>
                    <Badge variant="secondary">{execution.status}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {execution.startedAt
                      ? new Date(execution.startedAt).toLocaleString()
                      : "Not started"}
                    {execution.duration != null ? ` · ${execution.duration}ms` : ""}
                  </p>
                  {execution.error ? (
                    <p className="text-destructive mt-1">{execution.error}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
