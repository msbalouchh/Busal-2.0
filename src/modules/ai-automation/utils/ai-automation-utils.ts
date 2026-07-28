import type {
  AutomationApprovalRequest,
  AutomationEvent,
  AutomationWorkflow,
  AutomationWorkflowExecution,
  AutomationWorkflowVersion,
} from "@prisma/client";

export interface AutomationDashboardView {
  totalExecutions: number;
  failures: number;
  pendingApprovals: number;
  totalEvents: number;
  successRate: number;
  averageDurationMs: number;
  totalAiTokens: number;
  retries: number;
  aiDecisions: number;
}

export interface AutomationWorkflowView {
  id: string;
  name: string;
  description: string | null;
  isTemplate: boolean;
  status: string | null;
  versionNumber: number | null;
  triggerType: string | null;
}

export interface AutomationExecutionView {
  id: string;
  workflowName: string;
  status: string;
  triggerType: string;
  durationMs: number | null;
  retryCount: number;
  aiDecisionCount: number;
  aiCostTokens: number;
  createdAt: string;
}

export function serializeAutomationDashboard(
  input: AutomationDashboardView,
): AutomationDashboardView {
  return input;
}

export function serializeAutomationWorkflow(
  workflow: AutomationWorkflow & { currentVersion: AutomationWorkflowVersion | null },
): AutomationWorkflowView {
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    isTemplate: workflow.isTemplate,
    status: workflow.currentVersion?.status ?? null,
    versionNumber: workflow.currentVersion?.versionNumber ?? null,
    triggerType: workflow.currentVersion?.triggerType ?? null,
  };
}

export function serializeAutomationExecution(
  execution: AutomationWorkflowExecution & { workflow: { name: string } },
): AutomationExecutionView {
  return {
    id: execution.id,
    workflowName: execution.workflow.name,
    status: execution.status,
    triggerType: execution.triggerType,
    durationMs: execution.durationMs,
    retryCount: execution.retryCount,
    aiDecisionCount: execution.aiDecisionCount,
    aiCostTokens: execution.aiCostTokens,
    createdAt: execution.createdAt.toISOString(),
  };
}

export function serializeAutomationEvent(event: AutomationEvent) {
  return {
    id: event.id,
    category: event.category,
    eventType: event.eventType,
    sourceModule: event.sourceModule,
    createdAt: event.createdAt.toISOString(),
  };
}

export function serializeAutomationApproval(
  approval: AutomationApprovalRequest & {
    execution: { workflow: { name: string } };
  },
) {
  return {
    id: approval.id,
    workflowName: approval.execution.workflow.name,
    approvalType: approval.approvalType,
    status: approval.status,
    requestedAt: approval.requestedAt.toISOString(),
  };
}
