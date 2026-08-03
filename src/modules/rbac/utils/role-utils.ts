import { SYSTEM_ROLE_PRIORITY, type SystemRoleSlug } from "@/modules/rbac/constants/system-roles";
import type { RbacEngineContext } from "@/modules/rbac/types/context";
import type { RoleSlug } from "@/modules/rbac/types/role";

export function hasRole(context: Pick<RbacEngineContext, "roleSlugs">, role: RoleSlug): boolean {
  return context.roleSlugs.includes(role);
}

export function hasAnyRole(
  context: Pick<RbacEngineContext, "roleSlugs">,
  roles: RoleSlug[],
): boolean {
  return roles.some((role) => context.roleSlugs.includes(role));
}

export function resolveHighestRolePriority(roleSlugs: RoleSlug[]): number {
  return roleSlugs.reduce((highest, slug) => {
    const priority = SYSTEM_ROLE_PRIORITY[slug as SystemRoleSlug] ?? 0;
    return Math.max(highest, priority);
  }, 0);
}

export function compareRoleAuthority(actorRoles: RoleSlug[], targetRoles: RoleSlug[]): boolean {
  return resolveHighestRolePriority(actorRoles) > resolveHighestRolePriority(targetRoles);
}
