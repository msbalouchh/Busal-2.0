import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { resolveAuthorizationContext } from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import { AI_SKILLS_ROUTES } from "@/modules/ai-skills-management/constants/routes";
import type { SkillListQuery } from "@/modules/ai-skills-management/types/ai-skills-types";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import { discoverSkills } from "@/services/ai-skill-discovery.service";
import {
  getSkill,
  getSkillDashboardStats,
  listSkillCategories,
  listSkills,
  searchSkills,
} from "@/services/ai-skill-manager.service";
import { listSkillExecutions } from "@/services/ai-skill-executor.service";
import { resolveSkillPermissions } from "@/services/ai-skill-permission.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";

export interface AiSkillsPermissions {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExecute: boolean;
}

export interface AiSkillsContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: AiSkillsPermissions;
}

async function resolveSkillsBusiness(user: AuthUser) {
  const business = await getBusinessByOwnerId(user.id);
  if (!business?.id) throw permissionDenied();
  const authorization = await resolveAuthorizationContext(user, business);
  return { business, authorization };
}

export const getAiSkillsContext = cache(async (): Promise<AiSkillsContext> => {
  const user = await requireApplicationAccess();
  const loaded = await resolveSkillsBusiness(user);
  const permissionsFlags = resolveSkillPermissions(
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

export async function requireAiSkillsActionContext(permission: string): Promise<AiSkillsContext> {
  const user = await getCurrentUser();
  if (!user) throw permissionDenied();

  const loaded = await resolveSkillsBusiness(user);
  const permissionsFlags = resolveSkillPermissions(
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

export const getSkillsDashboardContext = cache(async () => {
  const context = await getAiSkillsContext();
  const [stats, recent, discovery] = await Promise.all([
    getSkillDashboardStats(context.user.id),
    listSkills(context.user.id, { pageSize: 8 }),
    discoverSkills(context.user.id),
  ]);

  return { ...context, stats, recent, discovery };
});

export const getSkillsRegistryContext = cache(async (query: SkillListQuery = {}) => {
  const context = await getAiSkillsContext();
  const [list, discovery] = await Promise.all([
    listSkills(context.user.id, query),
    discoverSkills(context.user.id, query.search),
  ]);
  return { ...context, list, discovery };
});

export const getSkillsCategoriesContext = cache(async () => {
  const context = await getAiSkillsContext();
  const categories = await listSkillCategories(context.user.id);
  return { ...context, categories };
});

export const getSkillsExecutionsContext = cache(async (skillId?: string) => {
  const context = await getAiSkillsContext();
  const executions = await listSkillExecutions(context.user.id, skillId, 50);
  return { ...context, executions };
});

export const getSkillsSearchContext = cache(async (query: SkillListQuery = {}) => {
  const context = await getAiSkillsContext();
  const results = await searchSkills(context.user.id, query);
  return { ...context, results, query };
});

export const getSkillDetailContext = cache(async (skillId: string) => {
  const context = await getAiSkillsContext();
  const [skill, executions] = await Promise.all([
    getSkill(context.user.id, skillId),
    listSkillExecutions(context.user.id, skillId, 20),
  ]);
  return { ...context, skill, executions };
});

export const getSkillsSettingsContext = cache(async () => {
  const context = await getAiSkillsContext();
  if (!context.permissionsFlags.canUpdate) {
    redirect(AI_SKILLS_ROUTES.dashboard());
  }
  const skills = await listSkills(context.user.id, { pageSize: 100 });
  return { ...context, skills };
});
