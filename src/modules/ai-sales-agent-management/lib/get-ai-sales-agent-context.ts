import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { resolveAuthorizationContext } from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import type {
  SalesInsightListQuery,
  SalesRecommendationListQuery,
} from "@/modules/ai-sales-agent-management/types/ai-sales-agent-types";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  getSalesAgentDashboardStats,
  getSalesAnalysisSummary,
} from "@/services/ai-sales-analysis.service";
import {
  detectSalesOpportunities,
  getFollowUpSuggestions,
} from "@/services/ai-sales-opportunity-detection.service";
import {
  getPipelineAnalysisSnapshot,
  listPipelineOpportunities,
} from "@/services/ai-sales-pipeline-analysis.service";
import { getLikelyToCloseQuotes } from "@/services/ai-sales-quote-analysis.service";
import {
  listSalesInsights,
  listSalesRecommendations,
  searchSalesContent,
} from "@/services/ai-sales-recommendation.service";
import {
  getRevenueInsightSnapshot,
  getRevenueTrendPoints,
} from "@/services/ai-sales-revenue-insight.service";
import { generateSalesForecast } from "@/services/ai-sales-forecast.service";
import { resolveSalesAgentPermissions } from "@/services/ai-sales-agent-permission.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

export interface AiSalesAgentPermissions {
  canView: boolean;
  canExecute: boolean;
  canManage: boolean;
}

export interface AiSalesAgentContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: AiSalesAgentPermissions;
}

async function resolveSalesAgentBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();
  const authorization = await resolveAuthorizationContext(user, business);
  return { business, authorization };
}

export const getAiSalesAgentContext = cache(async (): Promise<AiSalesAgentContext> => {
  const user = await requireApplicationAccess();
  const loaded = await resolveSalesAgentBusiness(user);
  const permissionsFlags = resolveSalesAgentPermissions(
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

export async function requireAiSalesAgentActionContext(
  permission: string,
): Promise<AiSalesAgentContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolveSalesAgentBusiness(user);
  const permissionsFlags = resolveSalesAgentPermissions(
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

export const getSalesAgentDashboardContext = cache(async () => {
  const context = await getAiSalesAgentContext();
  const summary = await getSalesAnalysisSummary(context.user.id);
  return { ...context, ...summary };
});

export const getSalesInsightsContext = cache(async (query: SalesInsightListQuery = {}) => {
  const context = await getAiSalesAgentContext();
  const insights = await listSalesInsights(context.user.id, query);
  return { ...context, insights };
});

export const getSalesRecommendationsContext = cache(
  async (query: SalesRecommendationListQuery = {}) => {
    const context = await getAiSalesAgentContext();
    const recommendations = await listSalesRecommendations(context.user.id, query);
    return { ...context, recommendations };
  },
);

export const getSalesOpportunitiesContext = cache(async () => {
  const context = await getAiSalesAgentContext();
  const [opportunities, pipeline, followUps] = await Promise.all([
    detectSalesOpportunities(context.user.id),
    listPipelineOpportunities(context.user.id),
    getFollowUpSuggestions(context.user.id),
  ]);
  return { ...context, opportunities, pipeline, followUps };
});

export const getSalesRevenueContext = cache(async () => {
  const context = await getAiSalesAgentContext();
  const [revenue, trend, forecast, quotes] = await Promise.all([
    getRevenueInsightSnapshot(context.user.id),
    getRevenueTrendPoints(context.user.id),
    generateSalesForecast(context.user.id),
    getLikelyToCloseQuotes(context.user.id),
  ]);
  return { ...context, revenue, trend, forecast, quotes };
});

export const getSalesSearchContext = cache(async (search = "") => {
  const context = await getAiSalesAgentContext();
  const results = search.trim()
    ? await searchSalesContent(context.user.id, search.trim())
    : { insights: [], recommendations: [] };
  return { ...context, search: search.trim(), results };
});

export async function getSalesAgentStatsContext() {
  const context = await getAiSalesAgentContext();
  const stats = await getSalesAgentDashboardStats(context.user.id);
  const pipeline = await getPipelineAnalysisSnapshot(context.user.id);
  return { ...context, stats, pipeline };
}
