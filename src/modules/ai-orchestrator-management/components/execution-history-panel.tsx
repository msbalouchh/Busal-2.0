"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrchestratorNav } from "@/modules/ai-orchestrator-management/components/orchestrator-nav";
import type { AiOrchestratorContext } from "@/modules/ai-orchestrator-management/lib/get-ai-orchestrator-context";
import type { WorkflowExecutionRecord } from "@/modules/ai-orchestrator-management/types/ai-orchestrator-types";

interface ExecutionHistoryPanelProps {
  context: AiOrchestratorContext;
  executions: WorkflowExecutionRecord[];
}

export function ExecutionHistoryPanel({ executions }: ExecutionHistoryPanelProps) {
  return (
    <div className="space-y-8">
      <OrchestratorNav />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Execution History</CardTitle>
        </CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No workflow executions yet.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {executions.map((execution) => (
                <li key={execution.id} className="p-4">
                  <p className="font-medium">{execution.workflowName ?? execution.workflowId}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {execution.status}
                    {execution.duration ? ` · ${execution.duration}ms` : ""}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {new Date(execution.createdAt).toLocaleString()}
                  </p>
                  {execution.error ? (
                    <p className="text-destructive mt-2 text-xs">{execution.error}</p>
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
