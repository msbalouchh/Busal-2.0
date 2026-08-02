"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrchestratorNav } from "@/modules/ai-orchestrator-management/components/orchestrator-nav";
import type { AiOrchestratorContext } from "@/modules/ai-orchestrator-management/lib/get-ai-orchestrator-context";
import type { WorkflowExecutionRecord } from "@/modules/ai-orchestrator-management/types/ai-orchestrator-types";

interface ExecutionMonitorPanelProps {
  context: AiOrchestratorContext;
  monitor: {
    health: string;
    running: number;
    waiting: number;
    failed: number;
    completed: number;
    total: number;
  };
  active: {
    executions: WorkflowExecutionRecord[];
  };
}

export function ExecutionMonitorPanel({ monitor, active }: ExecutionMonitorPanelProps) {
  const activeExecutions = active.executions.filter((entry) =>
    ["RUNNING", "WAITING", "PENDING"].includes(entry.status),
  );

  return (
    <div className="space-y-8">
      <OrchestratorNav />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Health</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold capitalize">{monitor.health}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Running</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{monitor.running}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Waiting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{monitor.waiting}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{monitor.failed}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active executions</CardTitle>
        </CardHeader>
        <CardContent>
          {activeExecutions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active executions.</p>
          ) : (
            <ul className="space-y-2">
              {activeExecutions.map((execution) => (
                <li key={execution.id} className="rounded-md border px-3 py-2 text-sm">
                  {execution.workflowName ?? execution.workflowId} · {execution.status}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
