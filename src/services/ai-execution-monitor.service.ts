import "server-only";

import type { WorkflowTimelineEntry } from "@/modules/ai-orchestrator-management/types/ai-orchestrator-types";
import { getExecutionManagerSnapshot } from "@/services/ai-execution-manager.service";

export async function getExecutionMonitorSnapshot(ownerId: string) {
  const snapshot = await getExecutionManagerSnapshot(ownerId);
  return {
    ...snapshot,
    health: snapshot.failed > 0 ? "degraded" : snapshot.running > 0 ? "active" : "idle",
  };
}

export async function listExecutionTimeline(
  ownerId: string,
  limit = 50,
): Promise<WorkflowTimelineEntry[]> {
  const snapshot = await getExecutionManagerSnapshot(ownerId);
  return snapshot.executions.slice(0, limit).map((execution) => ({
    id: execution.id,
    workflowName: execution.workflowName ?? execution.workflowId,
    status: execution.status,
    createdAt: execution.createdAt,
    duration: execution.duration,
  }));
}

export async function getActiveExecutions(ownerId: string) {
  const snapshot = await getExecutionManagerSnapshot(ownerId);
  return snapshot.executions.filter((entry) =>
    ["RUNNING", "WAITING", "PENDING"].includes(entry.status),
  );
}
