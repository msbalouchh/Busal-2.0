import "server-only";

import type { WorkflowExecutionInput } from "@/modules/ai-orchestrator-management/types/ai-orchestrator-types";
import { getWorkflow } from "@/services/ai-workflow-manager.service";
import { runWorkflow } from "@/services/ai-workflow-executor.service";

export async function scheduleWorkflowRun(
  ownerId: string,
  payload: WorkflowExecutionInput,
  staffId?: string | null,
) {
  const workflow = await getWorkflow(ownerId, payload.workflowId);
  if (workflow.status === "DISABLED" || workflow.status === "ARCHIVED") {
    throw new Error(`Workflow cannot be scheduled in status ${workflow.status}`);
  }

  return runWorkflow(
    ownerId,
    {
      ...payload,
      metadata: {
        ...(payload.metadata ?? {}),
        scheduledAt: new Date().toISOString(),
      },
    },
    staffId,
  );
}

export function buildScheduleMetadata(cron?: string): Record<string, unknown> {
  return {
    scheduler: "framework-only",
    cron: cron ?? null,
    provider: "internal",
  };
}
