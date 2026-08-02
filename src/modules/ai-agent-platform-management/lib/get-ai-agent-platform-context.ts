import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { resolveAuthorizationContext } from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import { AI_AGENT_PLATFORM_ROUTES } from "@/modules/ai-agent-platform-management/constants/routes";
import type { AgentListQuery } from "@/modules/ai-agent-platform-management/types/ai-agent-platform-types";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  getPlatformAgent,
  getPlatformAgentDashboardStats,
  listAgentCapabilities,
  listAgentTools,
  listPlatformAgents,
} from "@/services/ai-agent-platform-manager.service";
import { listPlatformAgentExecutions } from "@/services/ai-agent-platform-executor.service";
import { discoverPlatformAgents } from "@/services/ai-agent-platform-discovery.service";
import { resolveAgentPlatformPermissions } from "@/services/ai-agent-platform-permission.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";

export interface AiAgentPlatformPermissions {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExecute: boolean;
}

export interface AiAgentPlatformContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: AiAgentPlatformPermissions;
}

async function resolvePlatformBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();
  const authorization = await resolveAuthorizationContext(user, business);
  return { business, authorization };
}

export const getAiAgentPlatformContext = cache(async (): Promise<AiAgentPlatformContext> => {
  const user = await requireApplicationAccess();
  const loaded = await resolvePlatformBusiness(user);
  const permissionsFlags = resolveAgentPlatformPermissions(
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

export async function requireAiAgentPlatformActionContext(
  permission: string,
): Promise<AiAgentPlatformContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolvePlatformBusiness(user);
  const permissionsFlags = resolveAgentPlatformPermissions(
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

export const getAgentPlatformDashboardContext = cache(
  async (
    search?: string,
    status?: AgentListQuery["status"],
    category?: AgentListQuery["category"],
  ) => {
    const context = await getAiAgentPlatformContext();
    const [list, stats, discovery] = await Promise.all([
      listPlatformAgents(context.user.id, { search, status, category, pageSize: 24 }),
      getPlatformAgentDashboardStats(context.user.id),
      discoverPlatformAgents(context.user.id, { search }),
    ]);

    return { ...context, list, stats, discovery };
  },
);

export const getAgentDetailsContext = cache(async (agentId: string) => {
  const context = await getAiAgentPlatformContext();
  const [agent, tools, capabilities, executions] = await Promise.all([
    getPlatformAgent(context.user.id, agentId),
    listAgentTools(context.user.id, agentId),
    listAgentCapabilities(context.user.id, agentId),
    listPlatformAgentExecutions(context.user.id, agentId, 20),
  ]);

  return { ...context, agent, tools, capabilities, executions };
});

export const getAgentExecutionsContext = cache(async (agentId?: string) => {
  const context = await getAiAgentPlatformContext();
  const executions = await listPlatformAgentExecutions(context.user.id, agentId, 50);
  return { ...context, executions };
});

export const getCreateAgentContext = cache(async () => {
  const context = await getAiAgentPlatformContext();
  if (!context.permissionsFlags.canCreate) {
    redirect(AI_AGENT_PLATFORM_ROUTES.dashboard());
  }
  return context;
});
