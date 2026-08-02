"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { AI_ORCHESTRATOR_ROUTES } from "@/modules/ai-orchestrator-management/constants/routes";
import { requireAiOrchestratorActionContext } from "@/modules/ai-orchestrator-management/lib/get-ai-orchestrator-context";
import type {
  WorkflowExecutionInput,
  WorkflowInput,
  WorkflowUpdateInput,
} from "@/modules/ai-orchestrator-management/types/ai-orchestrator-types";
import {
  cancelExecution,
  pauseExecution,
  resumeExecution,
} from "@/services/ai-execution-manager.service";
import { buildWorkflowFromTemplate } from "@/services/ai-workflow-builder.service";
import {
  createWorkflow,
  deleteWorkflow,
  updateWorkflow,
} from "@/services/ai-workflow-manager.service";
import { retryFailedWorkflowExecution, runWorkflow } from "@/services/ai-workflow-executor.service";
import { scheduleWorkflowRun } from "@/services/ai-workflow-scheduler.service";

function revalidateOrchestratorPages(workflowId?: string, executionId?: string) {
  revalidatePath(AI_ORCHESTRATOR_ROUTES.dashboard());
  revalidatePath(AI_ORCHESTRATOR_ROUTES.list());
  revalidatePath(AI_ORCHESTRATOR_ROUTES.builder());
  revalidatePath(AI_ORCHESTRATOR_ROUTES.monitor());
  revalidatePath(AI_ORCHESTRATOR_ROUTES.executions());
  revalidatePath(AI_ORCHESTRATOR_ROUTES.timeline());
  revalidatePath(AI_ORCHESTRATOR_ROUTES.search());
  if (workflowId) revalidatePath(AI_ORCHESTRATOR_ROUTES.workflow(workflowId));
  if (executionId) revalidatePath(AI_ORCHESTRATOR_ROUTES.execution(executionId));
}

export async function createWorkflowAction(input: WorkflowInput) {
  const context = await requireAiOrchestratorActionContext(PERMISSION_CODES.AI_WORKFLOW_CREATE);
  const workflow = await createWorkflow(context.user.id, input);
  revalidateOrchestratorPages(workflow.id);
  return workflow;
}

export async function updateWorkflowAction(workflowId: string, input: WorkflowUpdateInput) {
  const context = await requireAiOrchestratorActionContext(PERMISSION_CODES.AI_WORKFLOW_UPDATE);
  const workflow = await updateWorkflow(context.user.id, workflowId, input);
  revalidateOrchestratorPages(workflowId);
  return workflow;
}

export async function deleteWorkflowAction(workflowId: string) {
  const context = await requireAiOrchestratorActionContext(PERMISSION_CODES.AI_WORKFLOW_DELETE);
  await deleteWorkflow(context.user.id, workflowId);
  revalidateOrchestratorPages(workflowId);
  return { success: true };
}

export async function runWorkflowAction(payload: WorkflowExecutionInput) {
  const context = await requireAiOrchestratorActionContext(PERMISSION_CODES.AI_WORKFLOW_EXECUTE);
  const execution = await runWorkflow(context.user.id, payload);
  revalidateOrchestratorPages(payload.workflowId, execution.id);
  return execution;
}

export async function scheduleWorkflowAction(payload: WorkflowExecutionInput) {
  const context = await requireAiOrchestratorActionContext(PERMISSION_CODES.AI_WORKFLOW_EXECUTE);
  const execution = await scheduleWorkflowRun(context.user.id, payload);
  revalidateOrchestratorPages(payload.workflowId, execution.id);
  return execution;
}

export async function pauseWorkflowExecutionAction(executionId: string) {
  const context = await requireAiOrchestratorActionContext(PERMISSION_CODES.AI_WORKFLOW_UPDATE);
  const execution = await pauseExecution(context.user.id, executionId);
  revalidateOrchestratorPages(execution.workflowId, executionId);
  return execution;
}

export async function resumeWorkflowExecutionAction(executionId: string) {
  const context = await requireAiOrchestratorActionContext(PERMISSION_CODES.AI_WORKFLOW_UPDATE);
  const execution = await resumeExecution(context.user.id, executionId);
  revalidateOrchestratorPages(execution.workflowId, executionId);
  return execution;
}

export async function cancelWorkflowExecutionAction(executionId: string) {
  const context = await requireAiOrchestratorActionContext(PERMISSION_CODES.AI_WORKFLOW_UPDATE);
  const execution = await cancelExecution(context.user.id, executionId);
  revalidateOrchestratorPages(execution.workflowId, executionId);
  return execution;
}

export async function retryWorkflowExecutionAction(executionId: string) {
  const context = await requireAiOrchestratorActionContext(PERMISSION_CODES.AI_WORKFLOW_EXECUTE);
  const execution = await retryFailedWorkflowExecution(context.user.id, executionId);
  revalidateOrchestratorPages(execution.workflowId, execution.id);
  return execution;
}

export async function buildWorkflowTemplateAction(templateKey: string) {
  const context = await requireAiOrchestratorActionContext(PERMISSION_CODES.AI_WORKFLOW_CREATE);
  const result = await buildWorkflowFromTemplate(context.user.id, templateKey);
  revalidateOrchestratorPages(result.workflowId);
  return result;
}

export async function activateWorkflowAction(workflowId: string) {
  const context = await requireAiOrchestratorActionContext(PERMISSION_CODES.AI_WORKFLOW_UPDATE);
  const workflow = await updateWorkflow(context.user.id, workflowId, { status: "ACTIVE" });
  revalidateOrchestratorPages(workflowId);
  return workflow;
}
