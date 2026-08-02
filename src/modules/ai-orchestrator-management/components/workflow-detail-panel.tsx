"use client";

import { useTransition } from "react";
import { Loader2, Pause, Play, RotateCcw, Square, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  activateWorkflowAction,
  cancelWorkflowExecutionAction,
  pauseWorkflowExecutionAction,
  resumeWorkflowExecutionAction,
  retryWorkflowExecutionAction,
  runWorkflowAction,
} from "@/modules/ai-orchestrator-management/actions/ai-orchestrator-actions";
import { OrchestratorNav } from "@/modules/ai-orchestrator-management/components/orchestrator-nav";
import type { AiOrchestratorContext } from "@/modules/ai-orchestrator-management/lib/get-ai-orchestrator-context";
import type {
  WorkflowExecutionRecord,
  WorkflowRecord,
  WorkflowStepRecord,
} from "@/modules/ai-orchestrator-management/types/ai-orchestrator-types";

interface WorkflowDetailPanelProps {
  context: AiOrchestratorContext;
  workflow: WorkflowRecord;
  steps: WorkflowStepRecord[];
  executions: WorkflowExecutionRecord[];
}

export function WorkflowDetailPanel({
  context,
  workflow,
  steps,
  executions,
}: WorkflowDetailPanelProps) {
  const [isPending, startTransition] = useTransition();

  const runAction = (action: () => Promise<unknown>) => {
    startTransition(async () => {
      await action();
    });
  };

  return (
    <div className="space-y-8">
      <OrchestratorNav />

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{workflow.name}</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              {workflow.status} · v{workflow.version} · {steps.length} steps
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {context.permissionsFlags.canUpdate && workflow.status !== "ACTIVE" ? (
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => runAction(() => activateWorkflowAction(workflow.id))}
              >
                Activate
              </Button>
            ) : null}
            {context.permissionsFlags.canExecute ? (
              <Button
                size="sm"
                disabled={isPending}
                onClick={() =>
                  runAction(() => runWorkflowAction({ workflowId: workflow.id, input: {} }))
                }
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Run
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-sm">
            {workflow.description ?? "No description"}
          </p>

          <div>
            <h3 className="text-sm font-medium">Workflow steps</h3>
            <ol className="mt-2 space-y-2">
              {steps.map((step) => (
                <li key={step.id} className="rounded-md border px-3 py-2 text-sm">
                  Step {step.order}
                  {step.condition ? ` · condition: ${step.condition}` : ""}
                  {step.skillId ? ` · skill: ${step.skillId}` : ""}
                  {step.agentId ? ` · agent: ${step.agentId}` : ""}
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className="text-sm font-medium">Recent executions</h3>
            {executions.length === 0 ? (
              <p className="text-muted-foreground mt-2 text-sm">No executions yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {executions.map((execution) => (
                  <li
                    key={execution.id}
                    className="flex flex-col gap-2 rounded-md border px-3 py-2 text-sm lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div>
                      <p>{execution.status}</p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(execution.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {context.permissionsFlags.canUpdate && execution.status === "RUNNING" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() =>
                            runAction(() => pauseWorkflowExecutionAction(execution.id))
                          }
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {context.permissionsFlags.canUpdate && execution.status === "WAITING" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() =>
                            runAction(() => resumeWorkflowExecutionAction(execution.id))
                          }
                        >
                          <Zap className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {context.permissionsFlags.canUpdate &&
                      ["RUNNING", "WAITING", "PENDING"].includes(execution.status) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() =>
                            runAction(() => cancelWorkflowExecutionAction(execution.id))
                          }
                        >
                          <Square className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {context.permissionsFlags.canExecute && execution.status === "FAILED" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() =>
                            runAction(() => retryWorkflowExecutionAction(execution.id))
                          }
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
