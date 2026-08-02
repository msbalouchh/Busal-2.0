import type { AuthorizationContext } from "@/modules/authorization/types/authorization";

export function hasRole(context: AuthorizationContext, roleSlug: string): boolean {
  if (context.isOwner && roleSlug === "owner") {
    return true;
  }

  return context.roleSlug === roleSlug;
}

export function hasAnyRole(context: AuthorizationContext, roleSlugs: string[]): boolean {
  if (context.isOwner) {
    return true;
  }

  if (!context.roleSlug) {
    return false;
  }

  return roleSlugs.includes(context.roleSlug);
}
