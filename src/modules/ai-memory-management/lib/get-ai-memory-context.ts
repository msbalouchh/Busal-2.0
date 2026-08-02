import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { resolveAuthorizationContext } from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import { AI_MEMORY_ROUTES } from "@/modules/ai-memory-management/constants/routes";
import type {
  MemoryListQuery,
  MemorySearchQuery,
} from "@/modules/ai-memory-management/types/ai-memory-types";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import { getMemoryAnalyticsSnapshot } from "@/services/ai-memory-context-builder.service";
import {
  getMemoryDashboardStats,
  listMemories,
  listMemoryCollections,
  listMemoryTimeline,
} from "@/services/ai-memory-manager.service";
import { listMemoryReferences, getMemory } from "@/services/ai-memory.service";
import { searchMemories } from "@/services/ai-memory-search.service";
import { resolveMemoryPermissions } from "@/services/ai-memory-permission.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";

export interface AiMemoryPermissions {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface AiMemoryContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: AiMemoryPermissions;
}

async function resolveMemoryBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();
  const authorization = await resolveAuthorizationContext(user, business);
  return { business, authorization };
}

export const getAiMemoryContext = cache(async (): Promise<AiMemoryContext> => {
  const user = await requireApplicationAccess();
  const loaded = await resolveMemoryBusiness(user);
  const permissionsFlags = resolveMemoryPermissions(
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

export async function requireAiMemoryActionContext(permission: string): Promise<AiMemoryContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolveMemoryBusiness(user);
  const permissionsFlags = resolveMemoryPermissions(
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

export const getMemoryDashboardContext = cache(async () => {
  const context = await getAiMemoryContext();
  const [stats, recent, timeline, collections] = await Promise.all([
    getMemoryDashboardStats(context.user.id),
    listMemories(context.user.id, { pageSize: 8 }),
    listMemoryTimeline(context.user.id, 12),
    listMemoryCollections(context.user.id),
  ]);

  return { ...context, stats, recent, timeline, collections };
});

export const getMemoryExplorerContext = cache(async (query: MemoryListQuery = {}) => {
  const context = await getAiMemoryContext();
  const list = await listMemories(context.user.id, query);
  return { ...context, list };
});

export const getMemorySearchContext = cache(async (query: MemorySearchQuery = {}) => {
  const context = await getAiMemoryContext();
  const results = await searchMemories(context.user.id, query);
  return { ...context, results, query };
});

export const getMemoryTimelineContext = cache(async () => {
  const context = await getAiMemoryContext();
  const timeline = await listMemoryTimeline(context.user.id, 100);
  return { ...context, timeline };
});

export const getMemoryCollectionsContext = cache(async () => {
  const context = await getAiMemoryContext();
  const collections = await listMemoryCollections(context.user.id);
  return { ...context, collections };
});

export const getMemoryAnalyticsContext = cache(async () => {
  const context = await getAiMemoryContext();
  const analytics = await getMemoryAnalyticsSnapshot(context.user.id);
  return { ...context, analytics };
});

export const getMemoryDetailContext = cache(async (memoryId: string) => {
  const context = await getAiMemoryContext();
  const [memory, references] = await Promise.all([
    getMemory(context.user.id, memoryId),
    listMemoryReferences(context.user.id, memoryId),
  ]);

  return { ...context, memory, references };
});

export const getCreateMemoryContext = cache(async () => {
  const context = await getAiMemoryContext();
  if (!context.permissionsFlags.canCreate) {
    redirect(AI_MEMORY_ROUTES.dashboard());
  }
  return context;
});
