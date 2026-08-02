import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { resolveAuthorizationContext } from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import type {
  SupportInsightListQuery,
  SupportRecommendationListQuery,
} from "@/modules/ai-support-agent-management/types/ai-support-agent-types";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import { getSupportAnalysisSummary } from "@/services/ai-support-analysis.service";
import {
  analyzeOpenConversations,
  getConversationMessages,
} from "@/services/ai-support-conversation-analysis.service";
import { detectEscalations } from "@/services/ai-support-escalation-detection.service";
import { listKnowledgeSuggestionsForTicket } from "@/services/ai-support-knowledge-recommendation.service";
import {
  getSatisfactionSnapshot,
  identifyDissatisfiedCustomers,
} from "@/services/ai-support-satisfaction.service";
import {
  listOpenTickets,
  getTicketAnalysisSnapshot,
} from "@/services/ai-support-ticket-analysis.service";
import {
  listSupportInsights,
  listSupportRecommendations,
  searchSupportContent,
} from "@/services/ai-support-response-recommendation.service";
import { resolveSupportAgentPermissions } from "@/services/ai-support-agent-permission.service";
import type { AuthUser } from "@/types/auth";
import type { BusinessProfileData } from "@/types/business-profile";

export interface AiSupportAgentContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: ReturnType<typeof resolveSupportAgentPermissions>;
}

async function resolveSupportAgentBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();
  const authorization = await resolveAuthorizationContext(user, business);
  return { business, authorization };
}

export const getAiSupportAgentContext = cache(async (): Promise<AiSupportAgentContext> => {
  const user = await requireApplicationAccess();
  const loaded = await resolveSupportAgentBusiness(user);
  const permissionsFlags = resolveSupportAgentPermissions(
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

export async function requireAiSupportAgentActionContext(
  permission: string,
): Promise<AiSupportAgentContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolveSupportAgentBusiness(user);
  const permissionsFlags = resolveSupportAgentPermissions(
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

export const getSupportAgentDashboardContext = cache(async () => {
  const context = await getAiSupportAgentContext();
  const summary = await getSupportAnalysisSummary(context.user.id);
  return { ...context, ...summary };
});

export const getSupportInsightsContext = cache(async (query: SupportInsightListQuery = {}) => {
  const context = await getAiSupportAgentContext();
  const insights = await listSupportInsights(context.user.id, query);
  return { ...context, insights };
});

export const getSupportConversationsContext = cache(async (ticketId?: string) => {
  const context = await getAiSupportAgentContext();
  const [summaries, tickets] = await Promise.all([
    analyzeOpenConversations(context.user.id),
    listOpenTickets(context.user.id),
  ]);
  const messages = ticketId ? await getConversationMessages(context.user.id, ticketId) : [];
  return { ...context, summaries, tickets, messages, selectedTicketId: ticketId ?? null };
});

export const getSupportRecommendationsContext = cache(
  async (query: SupportRecommendationListQuery = {}) => {
    const context = await getAiSupportAgentContext();
    const recommendations = await listSupportRecommendations(context.user.id, query);
    return { ...context, recommendations };
  },
);

export const getSupportEscalationsContext = cache(async () => {
  const context = await getAiSupportAgentContext();
  const escalations = await detectEscalations(context.user.id);
  return { ...context, escalations };
});

export const getSupportKnowledgeContext = cache(async (ticketId?: string) => {
  const context = await getAiSupportAgentContext();
  const suggestions = ticketId
    ? await listKnowledgeSuggestionsForTicket(context.user.id, ticketId)
    : [];
  const tickets = await listOpenTickets(context.user.id);
  return { ...context, suggestions, tickets, selectedTicketId: ticketId ?? null };
});

export const getSupportAnalyticsContext = cache(async () => {
  const context = await getAiSupportAgentContext();
  const [satisfaction, tickets, dissatisfied] = await Promise.all([
    getSatisfactionSnapshot(context.user.id),
    getTicketAnalysisSnapshot(context.user.id),
    identifyDissatisfiedCustomers(context.user.id),
  ]);
  return { ...context, satisfaction, tickets, dissatisfied };
});

export const getSupportSearchContext = cache(async (search = "") => {
  const context = await getAiSupportAgentContext();
  const results = search.trim()
    ? await searchSupportContent(context.user.id, search.trim())
    : { insights: [], recommendations: [] };
  return { ...context, search: search.trim(), results };
});
