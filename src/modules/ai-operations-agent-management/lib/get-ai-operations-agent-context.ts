import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { resolveAuthorizationContext } from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import type {
  OperationInsightListQuery,
  OperationRecommendationListQuery,
} from "@/modules/ai-operations-agent-management/types/ai-operations-agent-types";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import { getOperationsAnalysisSummary } from "@/services/ai-operations-analysis.service";
import { getWorkflowSnapshot } from "@/services/ai-operations-workflow-analysis.service";
import { getResourceUtilizationSnapshot } from "@/services/ai-operations-resource-optimization.service";
import { getOperationalHealthSnapshot } from "@/services/ai-operations-operational-health.service";
import { detectOperationalBottlenecks } from "@/services/ai-operations-bottleneck-detection.service";
import { detectOperationalRisks } from "@/services/ai-operations-risk-detection.service";
import { getOperationalTrendSnapshot } from "@/services/ai-operations-trend-analysis.service";
import { getInventoryHealthSnapshot } from "@/services/ai-operations-inventory-health.service";
import {
  listOperationInsights,
  listOperationRecommendations,
  searchOperationContent,
} from "@/services/ai-operations-efficiency-recommendation.service";
import { resolveOperationsAgentPermissions } from "@/services/ai-operations-agent-permission.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

export interface AiOperationsAgentContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: ReturnType<typeof resolveOperationsAgentPermissions>;
}

async function resolveOperationsAgentBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();
  const authorization = await resolveAuthorizationContext(user, business);
  return { business, authorization };
}

export const getAiOperationsAgentContext = cache(async (): Promise<AiOperationsAgentContext> => {
  const user = await requireApplicationAccess();
  const loaded = await resolveOperationsAgentBusiness(user);
  const permissionsFlags = resolveOperationsAgentPermissions(
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

export async function requireAiOperationsAgentActionContext(
  permission: string,
): Promise<AiOperationsAgentContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolveOperationsAgentBusiness(user);
  const permissionsFlags = resolveOperationsAgentPermissions(
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

export const getOperationsAgentDashboardContext = cache(async () => {
  const context = await getAiOperationsAgentContext();
  const summary = await getOperationsAnalysisSummary(context.user.id);
  return { ...context, ...summary };
});

export const getOperationsHealthContext = cache(async () => {
  const context = await getAiOperationsAgentContext();
  const [health, bottlenecks, risks] = await Promise.all([
    getOperationalHealthSnapshot(context.user.id),
    detectOperationalBottlenecks(context.user.id),
    detectOperationalRisks(context.user.id),
  ]);
  return { ...context, health, bottlenecks, risks };
});

export const getOperationsWorkflowsContext = cache(async () => {
  const context = await getAiOperationsAgentContext();
  const workflow = await getWorkflowSnapshot(context.user.id);
  return { ...context, workflow };
});

export const getOperationsResourcesContext = cache(async () => {
  const context = await getAiOperationsAgentContext();
  const [resources, inventory] = await Promise.all([
    getResourceUtilizationSnapshot(context.user.id),
    getInventoryHealthSnapshot(context.user.id),
  ]);
  return { ...context, resources, inventory };
});

export const getOperationsEfficiencyContext = cache(async () => {
  const context = await getAiOperationsAgentContext();
  const [trends, bottlenecks] = await Promise.all([
    getOperationalTrendSnapshot(context.user.id),
    detectOperationalBottlenecks(context.user.id),
  ]);
  return { ...context, trends, bottlenecks };
});

export const getOperationsRisksContext = cache(async () => {
  const context = await getAiOperationsAgentContext();
  const risks = await detectOperationalRisks(context.user.id);
  return { ...context, risks };
});

export const getOperationsRecommendationsContext = cache(
  async (query: OperationRecommendationListQuery = {}) => {
    const context = await getAiOperationsAgentContext();
    const recommendations = await listOperationRecommendations(context.user.id, query);
    const bottlenecks = await detectOperationalBottlenecks(context.user.id);
    return { ...context, recommendations, bottlenecks };
  },
);

export const getOperationsInsightsContext = cache(async (query: OperationInsightListQuery = {}) => {
  const context = await getAiOperationsAgentContext();
  const insights = await listOperationInsights(context.user.id, query);
  return { ...context, insights };
});

export const getOperationsSearchContext = cache(async (search = "") => {
  const context = await getAiOperationsAgentContext();
  const results = search.trim()
    ? await searchOperationContent(context.user.id, search.trim())
    : { insights: [], recommendations: [] };
  return { ...context, search: search.trim(), results };
});
