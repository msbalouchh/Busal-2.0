import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  hasPermission,
  resolveAuthorizationContext,
} from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import { AI_RESTAURANT_ASSISTANT_ROUTES } from "@/modules/ai-restaurant-assistant-management/constants/routes";
import type { ConversationListQuery } from "@/modules/ai-restaurant-assistant-management/types/ai-restaurant-assistant-types";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import { listManagedBranches } from "@/services/branch-management.service";
import {
  getBusinessHealth,
  getConversation,
  getPeriodSummaries,
  listConversations,
  listRecommendations,
} from "@/services/ai-restaurant-assistant.service";
import { getRestaurantFoundationBundle } from "@/services/restaurant-management.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";
import type { BranchManagementRecord } from "@/modules/branch-management/types/branch-management-types";

export interface AiRestaurantAssistantPermissions {
  canView: boolean;
  canChat: boolean;
  canViewRecommendations: boolean;
  canManageRecommendations: boolean;
}

export interface AiRestaurantAssistantContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: AiRestaurantAssistantPermissions;
  branches: BranchManagementRecord[];
  selectedBranchId: string | null;
  moduleEnabled: boolean;
}

function buildAssistantPermissions(
  authorization: AuthorizationContext,
): AiRestaurantAssistantPermissions {
  const { permissions, isOwner } = authorization;

  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_VIEW),
    canChat: isOwner || hasPermission(permissions, PERMISSION_CODES.AI_CHAT),
    canViewRecommendations:
      isOwner || hasPermission(permissions, PERMISSION_CODES.AI_RECOMMENDATION_VIEW),
    canManageRecommendations:
      isOwner || hasPermission(permissions, PERMISSION_CODES.AI_RECOMMENDATION_MANAGE),
  };
}

async function resolveAssistantBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();

  const authorization = await resolveAuthorizationContext(user, business);
  const bundle = await getRestaurantFoundationBundle(user.id);
  const branchResult = await listManagedBranches(business.id, { pageSize: 200, status: "ACTIVE" });

  return {
    business,
    authorization,
    branches: branchResult.items,
    moduleEnabled: bundle.moduleEnabled,
  };
}

function resolveSelectedBranch(
  branches: BranchManagementRecord[],
  branchId?: string,
): string | null {
  if (branchId && branches.some((branch) => branch.id === branchId)) return branchId;
  return branches.find((branch) => branch.isPrimary)?.id ?? branches[0]?.id ?? null;
}

export const getAiRestaurantAssistantContext = cache(
  async (branchId?: string): Promise<AiRestaurantAssistantContext> => {
    const user = await requireApplicationAccess();
    const loaded = await resolveAssistantBusiness(user);
    const permissionsFlags = buildAssistantPermissions(loaded.authorization);

    if (!permissionsFlags.canView) redirect(ROUTES.application);
    if (!loaded.moduleEnabled) redirect("/app/modules/restaurant");

    return {
      user,
      business: loaded.business,
      authorization: loaded.authorization,
      permissionsFlags,
      branches: loaded.branches,
      selectedBranchId: resolveSelectedBranch(loaded.branches, branchId),
      moduleEnabled: loaded.moduleEnabled,
    };
  },
);

export async function requireAiRestaurantAssistantActionContext(
  permission: string,
): Promise<AiRestaurantAssistantContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolveAssistantBusiness(user);
  const permissionsFlags = buildAssistantPermissions(loaded.authorization);
  const allowed =
    loaded.authorization.isOwner || hasPermission(loaded.authorization.permissions, permission);

  if (!allowed) throw permissionDenied();

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags,
    branches: loaded.branches,
    selectedBranchId: resolveSelectedBranch(loaded.branches),
    moduleEnabled: loaded.moduleEnabled,
  };
}

export const getAssistantDashboardContext = cache(async (branchId?: string) => {
  const context = await getAiRestaurantAssistantContext(branchId);
  const [health, summaries, recommendations, conversations] = await Promise.all([
    getBusinessHealth(context.user.id, context.selectedBranchId),
    getPeriodSummaries(context.user.id, context.selectedBranchId),
    context.permissionsFlags.canViewRecommendations
      ? listRecommendations(context.user.id)
      : Promise.resolve([]),
    listConversations(context.user.id, { pageSize: 5 }),
  ]);

  return {
    ...context,
    health,
    summaries,
    recommendations,
    recentConversations: conversations.items,
  };
});

export const getAssistantChatContext = cache(
  async (branchId?: string, conversationId?: string, search?: string) => {
    const context = await getAiRestaurantAssistantContext(branchId);
    if (!context.permissionsFlags.canChat) {
      redirect(AI_RESTAURANT_ASSISTANT_ROUTES.dashboard());
    }

    const query: ConversationListQuery = { search, pageSize: 30 };
    const [conversations, activeConversation] = await Promise.all([
      listConversations(context.user.id, query),
      conversationId ? getConversation(context.user.id, conversationId) : Promise.resolve(null),
    ]);

    return {
      ...context,
      conversations,
      activeConversation,
    };
  },
);

export const getAssistantRecommendationsContext = cache(async () => {
  const context = await getAiRestaurantAssistantContext();
  if (!context.permissionsFlags.canViewRecommendations) {
    redirect(AI_RESTAURANT_ASSISTANT_ROUTES.dashboard());
  }

  const recommendations = await listRecommendations(context.user.id);
  return { ...context, recommendations };
});

export const getAssistantInsightsContext = cache(async (branchId?: string) => {
  const context = await getAiRestaurantAssistantContext(branchId);
  const [health, summaries] = await Promise.all([
    getBusinessHealth(context.user.id, context.selectedBranchId),
    getPeriodSummaries(context.user.id, context.selectedBranchId),
  ]);

  return { ...context, health, summaries };
});
