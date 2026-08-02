import "server-only";

import type { WorkflowExecutionRecord } from "@/modules/ai-orchestrator-management/types/ai-orchestrator-types";
import {
  cancelWorkflowExecution,
  getWorkflowExecution,
  listWorkflowExecutions,
  pauseWorkflowExecution,
  resumeWorkflowExecution,
} from "@/services/ai-workflow-executor.service";

export async function getExecutionManagerSnapshot(ownerId: string, workflowId?: string) {
  const executions = await listWorkflowExecutions(ownerId, workflowId, 100);
  return {
    total: executions.length,
    running: executions.filter((entry) => entry.status === "RUNNING").length,
    waiting: executions.filter((entry) => entry.status === "WAITING").length,
    failed: executions.filter((entry) => entry.status === "FAILED").length,
    completed: executions.filter((entry) => entry.status === "COMPLETED").length,
    executions,
  };
}

export async function pauseExecution(ownerId: string, executionId: string) {
  return pauseWorkflowExecution(ownerId, executionId);
}

export async function resumeExecution(ownerId: string, executionId: string) {
  return resumeWorkflowExecution(ownerId, executionId);
}

export async function cancelExecution(ownerId: string, executionId: string) {
  return cancelWorkflowExecution(ownerId, executionId);
}

export async function fetchExecutionDetail(ownerId: string, executionId: string) {
  return getWorkflowExecution(ownerId, executionId);
}

export function summarizeExecutions(executions: WorkflowExecutionRecord[]) {
  return executions.map((execution) => ({
    id: execution.id,
    workflowName: execution.workflowName ?? execution.workflowId,
    status: execution.status,
    duration: execution.duration,
    createdAt: execution.createdAt,
  }));
}
