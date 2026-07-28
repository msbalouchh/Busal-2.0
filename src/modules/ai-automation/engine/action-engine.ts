import type { AutomationActionType } from "@prisma/client";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { getAutomationAction } from "@/modules/ai-automation/registry/automation-registry";
import type {
  WorkflowExecutionContext,
  WorkflowNode,
} from "@/modules/ai-automation/types/automation-types";

function assertPermissions(platform: BusinessContext, required: string[]): void {
  for (const permission of required) {
    if (!platform.permissions.includes(permission)) {
      throw new Error(`Permission denied: ${permission} required`);
    }
  }
}

export async function executeAutomationAction(
  platform: BusinessContext,
  node: WorkflowNode,
  context: WorkflowExecutionContext,
): Promise<Record<string, unknown>> {
  const actionType = node.config.actionType as AutomationActionType;
  const definition = getAutomationAction(actionType);

  if (!definition) {
    throw new Error(`Unregistered automation action: ${actionType}`);
  }

  assertPermissions(platform, definition.requiredPermissions);
  assertPermissions(platform, [PERMISSION_CODES.AI_AUTOMATION_EXECUTE]);

  switch (actionType) {
    case "CREATE_TASK":
      return {
        actionType,
        taskTitle: node.config.title ?? "Automation task",
        businessId: context.businessId,
        simulated: true,
      };
    case "NOTIFY_STAFF":
      return {
        actionType,
        message: node.config.message ?? "Automation notification",
        branchId: context.branchId,
        simulated: true,
      };
    case "SEND_EMAIL":
      return {
        actionType,
        to: node.config.to ?? context.eventPayload.email ?? null,
        subject: node.config.subject ?? "Automation email",
        simulated: true,
      };
    case "SEND_WHATSAPP":
      return {
        actionType,
        to: node.config.to ?? null,
        simulated: true,
      };
    case "GENERATE_INVOICE":
    case "GENERATE_PROPOSAL":
      return {
        actionType,
        businessId: context.businessId,
        simulated: true,
      };
    case "CALL_AI_AGENT":
      return {
        actionType,
        agentId: node.config.agentId ?? "automation-agent",
        prompt: node.config.prompt ?? "Process automation context",
        simulated: true,
      };
    case "RUN_WORKFLOW":
      return {
        actionType,
        targetWorkflowId: node.config.workflowId ?? null,
        simulated: true,
      };
    case "CREATE_RECORD":
    case "UPDATE_RECORD":
    case "DELETE_RECORD":
    default:
      return {
        actionType,
        recordType: node.config.recordType ?? "generic",
        payload: context.eventPayload,
        simulated: true,
      };
  }
}
