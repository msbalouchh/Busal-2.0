import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { resolveAuthorizationContext } from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import type {
  HrInsightListQuery,
  HrRecommendationListQuery,
} from "@/modules/ai-hr-agent-management/types/ai-hr-agent-types";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import { getHrAnalysisSummary } from "@/services/ai-hr-analysis.service";
import { getPerformanceSnapshot } from "@/services/ai-hr-performance-analysis.service";
import {
  analyzeLeavePatterns,
  getAttendanceSnapshot,
} from "@/services/ai-hr-attendance-analysis.service";
import { analyzeShiftCoverage } from "@/services/ai-hr-shift-optimization.service";
import { getRecruitmentSnapshot } from "@/services/ai-hr-recruitment-analysis.service";
import { evaluatePendingCandidates } from "@/services/ai-hr-candidate-evaluation.service";
import { suggestTrainingPrograms } from "@/services/ai-hr-training-recommendation.service";
import { identifyAtRiskEmployees } from "@/services/ai-hr-retention-risk.service";
import {
  listHrInsights,
  listHrRecommendations,
  searchHrContent,
} from "@/services/ai-hr-insight.service";
import { resolveHrAgentPermissions } from "@/services/ai-hr-agent-permission.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

export interface AiHrAgentContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: ReturnType<typeof resolveHrAgentPermissions>;
}

async function resolveHrAgentBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();
  const authorization = await resolveAuthorizationContext(user, business);
  return { business, authorization };
}

export const getAiHrAgentContext = cache(async (): Promise<AiHrAgentContext> => {
  const user = await requireApplicationAccess();
  const loaded = await resolveHrAgentBusiness(user);
  const permissionsFlags = resolveHrAgentPermissions(
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

export async function requireAiHrAgentActionContext(permission: string): Promise<AiHrAgentContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolveHrAgentBusiness(user);
  const permissionsFlags = resolveHrAgentPermissions(
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

export const getHrAgentDashboardContext = cache(async () => {
  const context = await getAiHrAgentContext();
  const summary = await getHrAnalysisSummary(context.user.id);
  return { ...context, ...summary };
});

export const getHrInsightsContext = cache(async (query: HrInsightListQuery = {}) => {
  const context = await getAiHrAgentContext();
  const insights = await listHrInsights(context.user.id, query);
  return { ...context, insights };
});

export const getHrRecruitmentContext = cache(async () => {
  const context = await getAiHrAgentContext();
  const [recruitment, candidates] = await Promise.all([
    getRecruitmentSnapshot(context.user.id),
    evaluatePendingCandidates(context.user.id),
  ]);
  return { ...context, recruitment, candidates };
});

export const getHrPerformanceContext = cache(async () => {
  const context = await getAiHrAgentContext();
  const performance = await getPerformanceSnapshot(context.user.id);
  return { ...context, performance };
});

export const getHrAttendanceContext = cache(async () => {
  const context = await getAiHrAgentContext();
  const [attendance, leavePatterns, shiftCoverage] = await Promise.all([
    getAttendanceSnapshot(context.user.id),
    analyzeLeavePatterns(context.user.id),
    analyzeShiftCoverage(context.user.id),
  ]);
  return { ...context, attendance, leavePatterns, shiftCoverage };
});

export const getHrTrainingContext = cache(async () => {
  const context = await getAiHrAgentContext();
  const training = await suggestTrainingPrograms(context.user.id);
  return { ...context, training };
});

export const getHrRecommendationsContext = cache(async (query: HrRecommendationListQuery = {}) => {
  const context = await getAiHrAgentContext();
  const recommendations = await listHrRecommendations(context.user.id, query);
  const atRisk = await identifyAtRiskEmployees(context.user.id);
  return { ...context, recommendations, atRisk };
});

export const getHrSearchContext = cache(async (search = "") => {
  const context = await getAiHrAgentContext();
  const results = search.trim()
    ? await searchHrContent(context.user.id, search.trim())
    : { insights: [], recommendations: [] };
  return { ...context, search: search.trim(), results };
});
