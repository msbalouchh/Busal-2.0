import type { PermissionCategorySlug } from "@/modules/rbac/constants/permission-categories";
import type { PermissionTypeSlug } from "@/modules/rbac/constants/permission-types";

/** Canonical permission key: `{category}.{type}` */
export type PermissionKey = `${PermissionCategorySlug}.${PermissionTypeSlug}` | (string & {});

export interface Permission {
  id: string;
  key: PermissionKey;
  label: string;
  description: string;
  category: PermissionCategorySlug;
  type: PermissionTypeSlug;
  module: PermissionCategorySlug;
}

export interface PermissionGroup {
  id: string;
  slug: string;
  name: string;
  description: string;
  permissionKeys: PermissionKey[];
  category: PermissionCategorySlug;
}
