import type {
  AutomationPlatformAction,
  AutomationPlatformCondition,
  AutomationPlatformExecution,
  AutomationPlatformTrigger,
  AutomationPlatformWorkflow,
} from "@prisma/client";

import type {
  AutomationActionRecord,
  AutomationConditionRecord,
  AutomationExecutionRecord,
  AutomationLogRecord,
  AutomationTriggerRecord,
  AutomationWorkflowDetailRecord,
  AutomationWorkflowRecord,
} from "@/modules/automation-platform-management/types/automation-platform-types";

export function serializeAutomationWorkflow(
  workflow: AutomationPlatformWorkflow & {
    _count?: { executions: number };
    triggers?: AutomationPlatformTrigger[];
    conditions?: AutomationPlatformCondition[];
    actions?: AutomationPlatformAction[];
  },
): AutomationWorkflowRecord {
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    status: workflow.status,
    enabled: workflow.enabled,
    triggerType: workflow.triggerType,
    triggerCount: workflow.triggers?.length ?? 0,
    conditionCount: workflow.conditions?.length ?? 0,
    actionCount: workflow.actions?.length ?? 0,
    executionCount: workflow._count?.executions ?? 0,
    createdAt: workflow.createdAt.toISOString(),
    updatedAt: workflow.updatedAt.toISOString(),
  };
}

export function serializeAutomationWorkflowDetail(
  workflow: AutomationPlatformWorkflow & {
    triggers: AutomationPlatformTrigger[];
    conditions: AutomationPlatformCondition[];
    actions: AutomationPlatformAction[];
    _count?: { executions: number };
  },
): AutomationWorkflowDetailRecord {
  const base = serializeAutomationWorkflow(workflow);
  return {
    ...base,
    triggerCount: workflow.triggers.length,
    conditionCount: workflow.conditions.length,
    actionCount: workflow.actions.length,
    triggers: workflow.triggers.map(serializeAutomationTrigger),
    conditions: workflow.conditions.map(serializeAutomationCondition),
    actions: workflow.actions.map(serializeAutomationAction),
  };
}

export function serializeAutomationTrigger(
  trigger: AutomationPlatformTrigger,
): AutomationTriggerRecord {
  return {
    id: trigger.id,
    type: trigger.type,
    event: trigger.event,
    configuration: trigger.configuration as Record<string, unknown>,
    createdAt: trigger.createdAt.toISOString(),
  };
}

export function serializeAutomationCondition(
  condition: AutomationPlatformCondition,
): AutomationConditionRecord {
  return {
    id: condition.id,
    operator: condition.operator,
    field: condition.field,
    value: condition.value,
    configuration: condition.configuration as Record<string, unknown>,
    createdAt: condition.createdAt.toISOString(),
  };
}

export function serializeAutomationAction(
  action: AutomationPlatformAction,
): AutomationActionRecord {
  return {
    id: action.id,
    type: action.type,
    order: action.order,
    configuration: action.configuration as Record<string, unknown>,
    createdAt: action.createdAt.toISOString(),
  };
}

export function serializeAutomationExecution(
  execution: AutomationPlatformExecution & { workflow: { name: string } },
): AutomationExecutionRecord {
  return {
    id: execution.id,
    workflowId: execution.workflowId,
    workflowName: execution.workflow.name,
    status: execution.status,
    startedAt: execution.startedAt?.toISOString() ?? null,
    completedAt: execution.completedAt?.toISOString() ?? null,
    duration: execution.duration,
    error: execution.error,
  };
}

export function serializeAutomationLog(log: {
  id: string;
  workflowId: string;
  workflowName: string;
  executionId: string;
  level: string;
  message: string;
  timestamp: string;
}): AutomationLogRecord {
  return log;
}

export function validateWorkflowName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Workflow name is required");
  if (trimmed.length > 120) throw new Error("Workflow name is too long");
  return trimmed;
}
