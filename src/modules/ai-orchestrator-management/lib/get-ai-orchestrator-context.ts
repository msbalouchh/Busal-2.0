import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { resolveAuthorizationContext } from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import type { WorkflowListQuery } from "@/modules/ai-orchestrator-management/types/ai-orchestrator-types";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  getExecutionMonitorSnapshot,
  listExecutionTimeline,
} from "@/services/ai-execution-monitor.service";
import { getExecutionManagerSnapshot } from "@/services/ai-execution-manager.service";
import { getWorkflowTemplates } from "@/services/ai-workflow-builder.service";
import {
  getWorkflow,
  getWorkflowDashboardStats,
  listWorkflowSteps,
  listWorkflows,
  searchWorkflows,
} from "@/services/ai-workflow-manager.service";
import {
  getWorkflowExecution,
  listWorkflowExecutions,
} from "@/services/ai-workflow-executor.service";
import { resolveWorkflowPermissions } from "@/services/ai-workflow-permission.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";

export interface AiOrchestratorPermissions {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExecute: boolean;
}

export interface AiOrchestratorContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: AiOrchestratorPermissions;
}

async function resolveOrchestratorBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();
  const authorization = await resolveAuthorizationContext(user, business);
  return { business, authorization };
}

export const getAiOrchestratorContext = cache(async (): Promise<AiOrchestratorContext> => {
  const user = await requireApplicationAccess();
  const loaded = await resolveOrchestratorBusiness(user);
  const permissionsFlags = resolveWorkflowPermissions(
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

export async function requireAiOrchestratorActionContext(
  permission: string,
): Promise<AiOrchestratorContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolveOrchestratorBusiness(user);
  const permissionsFlags = resolveWorkflowPermissions(
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

export const getOrchestratorDashboardContext = cache(async () => {
  const context = await getAiOrchestratorContext();
  const [stats, recent, monitor, templates] = await Promise.all([
    getWorkflowDashboardStats(context.user.id),
    listWorkflows(context.user.id, { pageSize: 8 }),
    getExecutionMonitorSnapshot(context.user.id),
    Promise.resolve(getWorkflowTemplates()),
  ]);

  return { ...context, stats, recent, monitor, templates };
});

export const getWorkflowListContext = cache(async (query: WorkflowListQuery = {}) => {
  const context = await getAiOrchestratorContext();
  const list = await listWorkflows(context.user.id, query);
  return { ...context, list };
});

export const getWorkflowBuilderContext = cache(async () => {
  const context = await getAiOrchestratorContext();
  const templates = getWorkflowTemplates();
  return { ...context, templates };
});

export const getWorkflowDetailContext = cache(async (workflowId: string) => {
  const context = await getAiOrchestratorContext();
  const [workflow, steps, executions] = await Promise.all([
    getWorkflow(context.user.id, workflowId),
    listWorkflowSteps(context.user.id, workflowId),
    listWorkflowExecutions(context.user.id, workflowId, 20),
  ]);
  return { ...context, workflow, steps, executions };
});

export const getWorkflowExecutionsContext = cache(async (workflowId?: string) => {
  const context = await getAiOrchestratorContext();
  const executions = await listWorkflowExecutions(context.user.id, workflowId, 50);
  return { ...context, executions };
});

export const getWorkflowMonitorContext = cache(async () => {
  const context = await getAiOrchestratorContext();
  const monitor = await getExecutionMonitorSnapshot(context.user.id);
  const active = await getExecutionManagerSnapshot(context.user.id);
  return { ...context, monitor, active };
});

export const getWorkflowTimelineContext = cache(async () => {
  const context = await getAiOrchestratorContext();
  const timeline = await listExecutionTimeline(context.user.id, 100);
  return { ...context, timeline };
});

export const getWorkflowSearchContext = cache(async (query: WorkflowListQuery = {}) => {
  const context = await getAiOrchestratorContext();
  const results = await searchWorkflows(context.user.id, query);
  return { ...context, results, query };
});

export const getWorkflowExecutionDetailContext = cache(async (executionId: string) => {
  const context = await getAiOrchestratorContext();
  const execution = await getWorkflowExecution(context.user.id, executionId);
  return { ...context, execution };
});
