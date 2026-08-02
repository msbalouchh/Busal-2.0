import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { resolveAuthorizationContext } from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import { AUTOMATION_PLATFORM_ROUTES } from "@/modules/automation-platform-management/constants/routes";
import {
  serializeAutomationExecution,
  serializeAutomationLog,
  serializeAutomationWorkflow,
  serializeAutomationWorkflowDetail,
} from "@/modules/automation-platform-management/lib/automation-platform-validation";
import {
  ensureAutomationTemplatesAvailable,
  listAutomationTemplates,
} from "@/modules/automation-platform-management/plugins/bootstrap-automation-templates";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import { listActionLibrary } from "@/services/automation-action-engine.service";
import {
  getAutomationDashboardSummary,
  getAutomationWorkflow,
  listAutomationWorkflows,
} from "@/services/automation-workflow-manager.service";
import {
  getExecutionHistorySummary,
  listAutomationExecutions,
  searchAutomationExecutions,
} from "@/services/automation-execution-history.service";
import { listAutomationLogs } from "@/services/automation-logger.service";
import { listTriggerLibrary } from "@/services/automation-trigger-engine.service";
import { resolveAutomationPlatformPermissions } from "@/services/automation-platform-permission.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

export interface AutomationPlatformContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: ReturnType<typeof resolveAutomationPlatformPermissions>;
}

async function resolveAutomationBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();
  const authorization = await resolveAuthorizationContext(user, business);
  return { business, authorization };
}

export const getAutomationPlatformContext = cache(async (): Promise<AutomationPlatformContext> => {
  const user = await requireApplicationAccess();
  const loaded = await resolveAutomationBusiness(user);
  const permissionsFlags = resolveAutomationPlatformPermissions(
    loaded.authorization.permissions,
    loaded.authorization.isOwner,
  );

  if (!permissionsFlags.canView) redirect(ROUTES.application);

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags,
  };
});

export async function requireAutomationPlatformActionContext(
  permission: string,
): Promise<AutomationPlatformContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolveAutomationBusiness(user);
  const permissionsFlags = resolveAutomationPlatformPermissions(
    loaded.authorization.permissions,
    loaded.authorization.isOwner,
  );

  const allowed = loaded.authorization.isOwner || loaded.authorization.permissions.has(permission);
  if (!allowed) throw permissionDenied();

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags,
  };
}

export const getAutomationDashboardContext = cache(async () => {
  const context = await getAutomationPlatformContext();
  const [summary, history, workflows, logs] = await Promise.all([
    getAutomationDashboardSummary(context.user.id),
    getExecutionHistorySummary(context.user.id),
    listAutomationWorkflows(context.user.id),
    listAutomationLogs(context.user.id, 10),
  ]);

  return {
    ...context,
    summary,
    history,
    workflows: workflows.map(serializeAutomationWorkflow),
    logs: logs.map(serializeAutomationLog),
  };
});

export const getAutomationWorkflowsContext = cache(async () => {
  const context = await getAutomationPlatformContext();
  const workflows = await listAutomationWorkflows(context.user.id);
  return { ...context, workflows: workflows.map(serializeAutomationWorkflow) };
});

export const getAutomationWorkflowDetailContext = cache(async (workflowId: string) => {
  const context = await getAutomationPlatformContext();
  const workflow = await getAutomationWorkflow(context.user.id, workflowId);
  if (!workflow) redirect(AUTOMATION_PLATFORM_ROUTES.workflows());

  return {
    ...context,
    workflow: serializeAutomationWorkflowDetail(workflow),
  };
});

export const getAutomationWorkflowBuilderContext = cache(async () => {
  const context = await getAutomationPlatformContext();
  return context;
});

export const getAutomationExecutionsContext = cache(async () => {
  const context = await getAutomationPlatformContext();
  const [executions, history] = await Promise.all([
    listAutomationExecutions(context.user.id),
    getExecutionHistorySummary(context.user.id),
  ]);
  return {
    ...context,
    executions: executions.map(serializeAutomationExecution),
    history,
  };
});

export const getAutomationTriggersContext = cache(async () => {
  const context = await getAutomationPlatformContext();
  return { ...context, triggers: listTriggerLibrary() };
});

export const getAutomationActionsContext = cache(async () => {
  const context = await getAutomationPlatformContext();
  return { ...context, actions: listActionLibrary() };
});

export const getAutomationTemplatesContext = cache(async () => {
  const context = await getAutomationPlatformContext();
  await ensureAutomationTemplatesAvailable(context.user.id);
  return { ...context, templates: listAutomationTemplates() };
});

export const getAutomationLogsContext = cache(async () => {
  const context = await getAutomationPlatformContext();
  const logs = await listAutomationLogs(context.user.id, 100);
  return { ...context, logs: logs.map(serializeAutomationLog) };
});

export const getAutomationSearchContext = cache(async (query?: string) => {
  const context = await getAutomationPlatformContext();
  const trimmed = query?.trim() ?? "";
  if (!trimmed) {
    return { ...context, search: "", results: { workflows: [], executions: [] } };
  }

  const [workflows, executions] = await Promise.all([
    listAutomationWorkflows(context.user.id),
    searchAutomationExecutions(context.user.id, trimmed),
  ]);

  const workflowMatches = workflows
    .filter(
      (workflow) =>
        workflow.name.toLowerCase().includes(trimmed.toLowerCase()) ||
        workflow.description.toLowerCase().includes(trimmed.toLowerCase()),
    )
    .map(serializeAutomationWorkflow);

  return {
    ...context,
    search: trimmed,
    results: {
      workflows: workflowMatches,
      executions: executions.map(serializeAutomationExecution),
    },
  };
});
