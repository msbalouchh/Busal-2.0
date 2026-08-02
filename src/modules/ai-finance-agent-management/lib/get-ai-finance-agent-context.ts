import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { resolveAuthorizationContext } from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import type {
  FinanceInsightListQuery,
  FinanceRecommendationListQuery,
} from "@/modules/ai-finance-agent-management/types/ai-finance-agent-types";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import { getFinanceAnalysisSummary } from "@/services/ai-finance-analysis.service";
import { getRevenueSnapshot } from "@/services/ai-finance-revenue-analysis.service";
import { getExpenseSnapshot } from "@/services/ai-finance-expense-analysis.service";
import { getProfitabilitySnapshot } from "@/services/ai-finance-profitability.service";
import { getCashFlowSnapshot } from "@/services/ai-finance-cash-flow.service";
import { getBusinessHealthSnapshot } from "@/services/ai-finance-business-health.service";
import { detectFinancialRisks } from "@/services/ai-finance-risk.service";
import { getFinancialForecastFramework } from "@/services/ai-finance-forecast.service";
import { identifyCostOptimizations } from "@/services/ai-finance-cost-optimization.service";
import {
  listFinanceInsights,
  listFinanceRecommendations,
  searchFinanceContent,
} from "@/services/ai-finance-recommendation.service";
import { resolveFinanceAgentPermissions } from "@/services/ai-finance-agent-permission.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

export interface AiFinanceAgentContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: ReturnType<typeof resolveFinanceAgentPermissions>;
}

async function resolveFinanceAgentBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();
  const authorization = await resolveAuthorizationContext(user, business);
  return { business, authorization };
}

export const getAiFinanceAgentContext = cache(async (): Promise<AiFinanceAgentContext> => {
  const user = await requireApplicationAccess();
  const loaded = await resolveFinanceAgentBusiness(user);
  const permissionsFlags = resolveFinanceAgentPermissions(
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

export async function requireAiFinanceAgentActionContext(
  permission: string,
): Promise<AiFinanceAgentContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolveFinanceAgentBusiness(user);
  const permissionsFlags = resolveFinanceAgentPermissions(
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

export const getFinanceAgentDashboardContext = cache(async () => {
  const context = await getAiFinanceAgentContext();
  const summary = await getFinanceAnalysisSummary(context.user.id);
  return { ...context, ...summary };
});

export const getFinanceInsightsContext = cache(async (query: FinanceInsightListQuery = {}) => {
  const context = await getAiFinanceAgentContext();
  const insights = await listFinanceInsights(context.user.id, query);
  return { ...context, insights };
});

export const getFinanceRevenueContext = cache(async () => {
  const context = await getAiFinanceAgentContext();
  const revenue = await getRevenueSnapshot(context.user.id);
  return { ...context, revenue };
});

export const getFinanceExpensesContext = cache(async () => {
  const context = await getAiFinanceAgentContext();
  const expenses = await getExpenseSnapshot(context.user.id);
  const costOptimizations = await identifyCostOptimizations(context.user.id);
  return { ...context, expenses, costOptimizations };
});

export const getFinanceProfitabilityContext = cache(async () => {
  const context = await getAiFinanceAgentContext();
  const profitability = await getProfitabilitySnapshot(context.user.id);
  return { ...context, profitability };
});

export const getFinanceCashFlowContext = cache(async () => {
  const context = await getAiFinanceAgentContext();
  const cashFlow = await getCashFlowSnapshot(context.user.id);
  const forecast = await getFinancialForecastFramework(context.user.id);
  return { ...context, cashFlow, forecast };
});

export const getFinanceHealthContext = cache(async () => {
  const context = await getAiFinanceAgentContext();
  const [health, risks] = await Promise.all([
    getBusinessHealthSnapshot(context.user.id),
    detectFinancialRisks(context.user.id),
  ]);
  return { ...context, health, risks };
});

export const getFinanceRecommendationsContext = cache(
  async (query: FinanceRecommendationListQuery = {}) => {
    const context = await getAiFinanceAgentContext();
    const recommendations = await listFinanceRecommendations(context.user.id, query);
    const risks = await detectFinancialRisks(context.user.id);
    return { ...context, recommendations, risks };
  },
);

export const getFinanceSearchContext = cache(async (search = "") => {
  const context = await getAiFinanceAgentContext();
  const results = search.trim()
    ? await searchFinanceContent(context.user.id, search.trim())
    : { insights: [], recommendations: [] };
  return { ...context, search: search.trim(), results };
});
