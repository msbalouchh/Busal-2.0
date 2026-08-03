import type { PermissionKey } from "@/modules/rbac/types/permission";
import type { SystemRoleSlug } from "@/modules/rbac/constants/system-roles";

export type RoleSlug = SystemRoleSlug | (string & {});

export interface Role {
  id: string;
  slug: RoleSlug;
  name: string;
  description: string;
  permissionKeys: PermissionKey[];
  isSystem: boolean;
  priority: number;
  tenantId: string | null;
  workspaceId: string | null;
  businessId: string | null;
}

export interface RoleGroup {
  id: string;
  slug: string;
  name: string;
  description: string;
  roleSlugs: RoleSlug[];
  tenantId: string | null;
}
