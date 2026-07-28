"use server";

import { revalidatePath } from "next/cache";

import type { AutomationEventCategory, AutomationTriggerType } from "@prisma/client";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { AI_AUTOMATION_ROUTES } from "@/modules/ai-automation/constants/routes";
import type { WorkflowNode } from "@/modules/ai-automation/types/automation-types";
import {
  approveAutomationExecution,
  createAutomationWorkflow,
  publishAutomationEvent,
  triggerAutomationWorkflowManually,
} from "@/services/ai-automation.service";

function revalidateAutomationPaths() {
  Object.values(AI_AUTOMATION_ROUTES).forEach((path) => {
    revalidatePath(path);
  });
}

export async function publishAutomationEventAction(input: {
  eventType: string;
  category: AutomationEventCategory;
  payload: Record<string, unknown>;
  sourceModule: string;
}) {
  return protectedAction(PERMISSION_CODES.AI_AUTOMATION_EXECUTE, async ({ platform }) => {
    const event = await publishAutomationEvent({
      businessId: platform.business.id,
      branchId: platform.branchId,
      category: input.category,
      eventType: input.eventType,
      payload: input.payload,
      sourceModule: input.sourceModule,
    });
    revalidateAutomationPaths();
    return { success: true as const, eventId: event.id };
  });
}

export async function triggerAutomationWorkflowAction(
  workflowId: string,
  input: Record<string, unknown> = {},
) {
  return protectedAction(PERMISSION_CODES.AI_AUTOMATION_EXECUTE, async ({ platform }) => {
    const result = await triggerAutomationWorkflowManually(platform, workflowId, input);
    revalidateAutomationPaths();
    return { success: true as const, result };
  });
}

export async function approveAutomationExecutionAction(approvalRequestId: string, notes?: string) {
  return protectedAction(PERMISSION_CODES.AI_AUTOMATION_APPROVE, async ({ platform }) => {
    const result = await approveAutomationExecution(platform, approvalRequestId, notes);
    revalidateAutomationPaths();
    return { success: true as const, result };
  });
}

export async function createAutomationWorkflowAction(input: {
  name: string;
  description?: string | null;
  triggerType: AutomationTriggerType;
  triggerConfig: Record<string, unknown>;
  nodes: WorkflowNode[];
}) {
  return protectedAction(PERMISSION_CODES.AI_AUTOMATION_CREATE, async ({ platform }) => {
    const created = await createAutomationWorkflow(platform, input);
    revalidateAutomationPaths();
    return { success: true as const, workflowId: created.workflow.id };
  });
}
