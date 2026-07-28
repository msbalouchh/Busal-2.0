import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeAutomationApproval,
  serializeAutomationDashboard,
  serializeAutomationEvent,
  serializeAutomationExecution,
  serializeAutomationWorkflow,
} from "@/modules/ai-automation/utils/ai-automation-utils";
import {
  getAutomationMonitoringDashboard,
  listAutomationApprovalRequests,
  listAutomationEvents,
  listAutomationExecutions,
  listAutomationWorkflows,
} from "@/services/ai-automation.service";

export const getAiAutomationOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_AUTOMATION_VIEW });
  const dashboard = await getAutomationMonitoringDashboard(context.business.id);

  return {
    context,
    dashboard: serializeAutomationDashboard(dashboard),
  };
});

export const getAiAutomationWorkflowsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_AUTOMATION_VIEW });
  const workflows = await listAutomationWorkflows(context.business.id, false);

  return {
    context,
    workflows: workflows.map(serializeAutomationWorkflow),
  };
});

export const getAiAutomationTemplatesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_AUTOMATION_VIEW });
  const templates = await listAutomationWorkflows(context.business.id, true);

  return {
    context,
    templates: templates.map(serializeAutomationWorkflow),
  };
});

export const getAiAutomationExecutionsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_AUTOMATION_VIEW });
  const executions = await listAutomationExecutions(context.business.id, 100);

  return {
    context,
    executions: executions.map(serializeAutomationExecution),
  };
});

export const getAiAutomationApprovalsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_AUTOMATION_VIEW });
  const approvals = await listAutomationApprovalRequests(context.business.id);

  return {
    context,
    approvals: approvals.map(serializeAutomationApproval),
  };
});

export const getAiAutomationEventsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_AUTOMATION_VIEW });
  const events = await listAutomationEvents(context.business.id, 100);

  return {
    context,
    events: events.map(serializeAutomationEvent),
  };
});

export const getAiAutomationMonitoringContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_AUTOMATION_VIEW });
  const dashboard = await getAutomationMonitoringDashboard(context.business.id);
  const executions = await listAutomationExecutions(context.business.id, 20);

  return {
    context,
    dashboard: serializeAutomationDashboard(dashboard),
    executions: executions.map(serializeAutomationExecution),
  };
});
