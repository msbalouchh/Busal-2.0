"use client";

import type { RoleSlug } from "@/modules/rbac/types/role";
import { useRbac } from "@/modules/rbac/hooks/use-rbac";

export function useRole(role: RoleSlug): boolean {
  const { hasRole } = useRbac();
  return hasRole(role);
}

export function useRoles(): RoleSlug[] {
  const {
    snapshot: {
      context: { roleSlugs },
    },
  } = useRbac();

  return roleSlugs;
}
