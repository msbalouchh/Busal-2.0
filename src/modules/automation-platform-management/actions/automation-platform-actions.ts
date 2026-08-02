"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { AUTOMATION_PLATFORM_ROUTES } from "@/modules/automation-platform-management/constants/routes";
import { requireAutomationPlatformActionContext } from "@/modules/automation-platform-management/lib/get-automation-platform-context";
import { validateWorkflowName } from "@/modules/automation-platform-management/lib/automation-platform-validation";
import { createWorkflowFromTemplate } from "@/modules/automation-platform-management/plugins/bootstrap-automation-templates";
import { executeAutomationWorkflow } from "@/services/automation-execution-engine.service";
import {
  retryAutomationExecution,
  retryFailedExecutions,
} from "@/services/automation-retry-manager.service";
import {
  createAutomationWorkflow,
  deleteAutomationWorkflow,
  pauseAutomationWorkflow,
  resumeAutomationWorkflow,
  saveWorkflowBuilder,
  updateAutomationWorkflow,
} from "@/services/automation-workflow-manager.service";

function revalidateAutomationPages(workflowId?: string): void {
  const routes = [
    AUTOMATION_PLATFORM_ROUTES.dashboard(),
    AUTOMATION_PLATFORM_ROUTES.workflows(),
    AUTOMATION_PLATFORM_ROUTES.workflowNew(),
    AUTOMATION_PLATFORM_ROUTES.executions(),
    AUTOMATION_PLATFORM_ROUTES.triggers(),
    AUTOMATION_PLATFORM_ROUTES.actions(),
    AUTOMATION_PLATFORM_ROUTES.templates(),
    AUTOMATION_PLATFORM_ROUTES.logs(),
    AUTOMATION_PLATFORM_ROUTES.search(),
  ];
  for (const route of routes) revalidatePath(route);
  if (workflowId) revalidatePath(AUTOMATION_PLATFORM_ROUTES.workflowDetail(workflowId));
}

export async function createAutomationWorkflowAction(input: {
  name: string;
  description?: string;
  triggerType: "EVENT" | "SCHEDULE" | "MANUAL" | "WEBHOOK" | "API";
}) {
  const context = await requireAutomationPlatformActionContext(PERMISSION_CODES.AUTOMATION_CREATE);
  const workflow = await createAutomationWorkflow(context.user.id, {
    name: validateWorkflowName(input.name),
    description: input.description,
    triggerType: input.triggerType,
  });
  revalidateAutomationPages(workflow.id);
  return { id: workflow.id, name: workflow.name };
}

export async function updateAutomationWorkflowAction(
  workflowId: string,
  input: {
    name?: string;
    description?: string;
    status?: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
    enabled?: boolean;
  },
) {
  const context = await requireAutomationPlatformActionContext(PERMISSION_CODES.AUTOMATION_UPDATE);
  const workflow = await updateAutomationWorkflow(context.user.id, workflowId, input);
  revalidateAutomationPages(workflowId);
  return workflow ? { id: workflow.id, name: workflow.name } : null;
}

export async function deleteAutomationWorkflowAction(workflowId: string) {
  const context = await requireAutomationPlatformActionContext(PERMISSION_CODES.AUTOMATION_DELETE);
  await deleteAutomationWorkflow(context.user.id, workflowId);
  revalidateAutomationPages(workflowId);
}

export async function saveWorkflowBuilderAction(
  workflowId: string,
  input: {
    triggers: Array<{ type: string; event: string; configuration?: Record<string, unknown> }>;
    conditions: Array<{
      operator: string;
      field: string;
      value: string;
      configuration?: Record<string, unknown>;
    }>;
    actions: Array<{ type: string; order: number; configuration?: Record<string, unknown> }>;
  },
) {
  const context = await requireAutomationPlatformActionContext(PERMISSION_CODES.AUTOMATION_UPDATE);
  await saveWorkflowBuilder(context.user.id, workflowId, input);
  revalidateAutomationPages(workflowId);
}

export async function executeAutomationWorkflowAction(
  workflowId: string,
  input?: Record<string, unknown>,
) {
  const context = await requireAutomationPlatformActionContext(PERMISSION_CODES.AUTOMATION_EXECUTE);
  const execution = await executeAutomationWorkflow(context.user.id, workflowId, input ?? {});
  revalidateAutomationPages(workflowId);
  return { id: execution.id, status: execution.status };
}

export async function pauseAutomationWorkflowAction(workflowId: string) {
  const context = await requireAutomationPlatformActionContext(PERMISSION_CODES.AUTOMATION_EXECUTE);
  await pauseAutomationWorkflow(context.user.id, workflowId);
  revalidateAutomationPages(workflowId);
}

export async function resumeAutomationWorkflowAction(workflowId: string) {
  const context = await requireAutomationPlatformActionContext(PERMISSION_CODES.AUTOMATION_EXECUTE);
  await resumeAutomationWorkflow(context.user.id, workflowId);
  revalidateAutomationPages(workflowId);
}

export async function retryFailedExecutionsAction() {
  const context = await requireAutomationPlatformActionContext(PERMISSION_CODES.AUTOMATION_EXECUTE);
  const retried = await retryFailedExecutions(context.user.id);
  revalidateAutomationPages();
  return { retried };
}

export async function retryAutomationExecutionAction(executionId: string) {
  const context = await requireAutomationPlatformActionContext(PERMISSION_CODES.AUTOMATION_EXECUTE);
  const execution = await retryAutomationExecution(context.user.id, executionId);
  revalidateAutomationPages(execution.workflowId);
  return { id: execution.id, status: execution.status };
}

export async function createWorkflowFromTemplateAction(templateSlug: string) {
  const context = await requireAutomationPlatformActionContext(PERMISSION_CODES.AUTOMATION_CREATE);
  const workflow = await createWorkflowFromTemplate(context.user.id, templateSlug);
  revalidateAutomationPages(workflow.id);
  return { id: workflow.id, name: workflow.name };
}
