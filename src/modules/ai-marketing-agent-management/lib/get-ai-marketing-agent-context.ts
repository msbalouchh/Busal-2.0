import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { resolveAuthorizationContext } from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import type { MarketingInsightListQuery } from "@/modules/ai-marketing-agent-management/types/ai-marketing-agent-types";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  getMarketingAgentDashboardStats,
  getMarketingAnalysisSummary,
} from "@/services/ai-marketing-analysis.service";
import { getAudienceSnapshot } from "@/services/ai-marketing-audience-analysis.service";
import { getCampaignAnalysisSnapshot } from "@/services/ai-marketing-campaign-analysis.service";
import {
  getEngagementSnapshot,
  getEngagementTimeline,
} from "@/services/ai-marketing-engagement-analysis.service";
import {
  listCustomerSegments,
  getLoyaltyCampaignTargets,
} from "@/services/ai-marketing-segmentation.service";
import { getRetentionSnapshot } from "@/services/ai-marketing-retention-analysis.service";
import {
  listMarketingInsights,
  searchMarketingContent,
} from "@/services/ai-marketing-recommendation.service";
import { getMarketingTrendSnapshot } from "@/services/ai-marketing-trend-analysis.service";
import { resolveMarketingAgentPermissions } from "@/services/ai-marketing-agent-permission.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

export interface AiMarketingAgentPermissions {
  canView: boolean;
  canExecute: boolean;
  canManage: boolean;
}

export interface AiMarketingAgentContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: AiMarketingAgentPermissions;
}

async function resolveMarketingAgentBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();
  const authorization = await resolveAuthorizationContext(user, business);
  return { business, authorization };
}

export const getAiMarketingAgentContext = cache(async (): Promise<AiMarketingAgentContext> => {
  const user = await requireApplicationAccess();
  const loaded = await resolveMarketingAgentBusiness(user);
  const permissionsFlags = resolveMarketingAgentPermissions(
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

export async function requireAiMarketingAgentActionContext(
  permission: string,
): Promise<AiMarketingAgentContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolveMarketingAgentBusiness(user);
  const permissionsFlags = resolveMarketingAgentPermissions(
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

export const getMarketingAgentDashboardContext = cache(async () => {
  const context = await getAiMarketingAgentContext();
  const summary = await getMarketingAnalysisSummary(context.user.id);
  return { ...context, ...summary };
});

export const getMarketingInsightsContext = cache(async (query: MarketingInsightListQuery = {}) => {
  const context = await getAiMarketingAgentContext();
  const insights = await listMarketingInsights(context.user.id, query);
  return { ...context, insights };
});

export const getMarketingAudienceContext = cache(async () => {
  const context = await getAiMarketingAgentContext();
  const [audience, loyaltyTargets] = await Promise.all([
    getAudienceSnapshot(context.user.id),
    getLoyaltyCampaignTargets(context.user.id),
  ]);
  return { ...context, audience, loyaltyTargets };
});

export const getMarketingSegmentsContext = cache(async () => {
  const context = await getAiMarketingAgentContext();
  const segments = await listCustomerSegments(context.user.id);
  return { ...context, segments };
});

export const getMarketingRecommendationsContext = cache(async () => {
  const context = await getAiMarketingAgentContext();
  const recommendations = await listMarketingInsights(context.user.id, {
    category: "promotion",
    status: "ACTIVE",
  });
  return { ...context, recommendations };
});

export const getMarketingPerformanceContext = cache(async () => {
  const context = await getAiMarketingAgentContext();
  const [campaigns, trends, retention, engagement] = await Promise.all([
    getCampaignAnalysisSnapshot(context.user.id),
    getMarketingTrendSnapshot(context.user.id),
    getRetentionSnapshot(context.user.id),
    getEngagementSnapshot(context.user.id),
  ]);
  return { ...context, campaigns, trends, retention, engagement };
});

export const getMarketingTimelineContext = cache(async () => {
  const context = await getAiMarketingAgentContext();
  const timeline = await getEngagementTimeline(context.user.id);
  return { ...context, timeline };
});

export const getMarketingSearchContext = cache(async (search = "") => {
  const context = await getAiMarketingAgentContext();
  const results = search.trim()
    ? await searchMarketingContent(context.user.id, search.trim())
    : { insights: [] };
  return { ...context, search: search.trim(), results };
});

export async function getMarketingAgentStatsContext() {
  const context = await getAiMarketingAgentContext();
  const stats = await getMarketingAgentDashboardStats(context.user.id);
  return { ...context, stats };
}
