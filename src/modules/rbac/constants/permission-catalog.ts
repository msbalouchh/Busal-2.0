import {
  ALL_PERMISSION_CATEGORIES,
  PERMISSION_CATEGORY_LABELS,
  type PermissionCategorySlug,
} from "@/modules/rbac/constants/permission-categories";
import {
  PERMISSION_TYPE_LABELS,
  PERMISSION_TYPES,
  type PermissionTypeSlug,
} from "@/modules/rbac/constants/permission-types";
import type { Permission, PermissionKey } from "@/modules/rbac/types/permission";

/** Maps each category to the permission types it supports. */
export const CATEGORY_PERMISSION_TYPE_MATRIX: Record<PermissionCategorySlug, PermissionTypeSlug[]> =
  {
    dashboard: [PERMISSION_TYPES.READ, PERMISSION_TYPES.CONFIGURE, PERMISSION_TYPES.MANAGE],
    business: [
      PERMISSION_TYPES.READ,
      PERMISSION_TYPES.UPDATE,
      PERMISSION_TYPES.MANAGE,
      PERMISSION_TYPES.CONFIGURE,
    ],
    branches: [
      PERMISSION_TYPES.READ,
      PERMISSION_TYPES.CREATE,
      PERMISSION_TYPES.UPDATE,
      PERMISSION_TYPES.DELETE,
      PERMISSION_TYPES.ASSIGN,
      PERMISSION_TYPES.MANAGE,
    ],
    staff: [
      PERMISSION_TYPES.READ,
      PERMISSION_TYPES.CREATE,
      PERMISSION_TYPES.UPDATE,
      PERMISSION_TYPES.DELETE,
      PERMISSION_TYPES.INVITE,
      PERMISSION_TYPES.ASSIGN,
      PERMISSION_TYPES.MANAGE,
    ],
    customers: [
      PERMISSION_TYPES.READ,
      PERMISSION_TYPES.CREATE,
      PERMISSION_TYPES.UPDATE,
      PERMISSION_TYPES.DELETE,
      PERMISSION_TYPES.EXPORT,
      PERMISSION_TYPES.MANAGE,
    ],
    reservations: [
      PERMISSION_TYPES.READ,
      PERMISSION_TYPES.CREATE,
      PERMISSION_TYPES.UPDATE,
      PERMISSION_TYPES.DELETE,
      PERMISSION_TYPES.APPROVE,
      PERMISSION_TYPES.MANAGE,
    ],
    menu: [
      PERMISSION_TYPES.READ,
      PERMISSION_TYPES.CREATE,
      PERMISSION_TYPES.UPDATE,
      PERMISSION_TYPES.DELETE,
      PERMISSION_TYPES.MANAGE,
    ],
    kitchen: [
      PERMISSION_TYPES.READ,
      PERMISSION_TYPES.UPDATE,
      PERMISSION_TYPES.MANAGE,
      PERMISSION_TYPES.CONFIGURE,
    ],
    pos: [PERMISSION_TYPES.READ, PERMISSION_TYPES.CREATE, PERMISSION_TYPES.MANAGE],
    orders: [
      PERMISSION_TYPES.READ,
      PERMISSION_TYPES.CREATE,
      PERMISSION_TYPES.UPDATE,
      PERMISSION_TYPES.DELETE,
      PERMISSION_TYPES.APPROVE,
      PERMISSION_TYPES.EXPORT,
      PERMISSION_TYPES.MANAGE,
    ],
    inventory: [
      PERMISSION_TYPES.READ,
      PERMISSION_TYPES.CREATE,
      PERMISSION_TYPES.UPDATE,
      PERMISSION_TYPES.DELETE,
      PERMISSION_TYPES.EXPORT,
      PERMISSION_TYPES.MANAGE,
    ],
    marketing: [
      PERMISSION_TYPES.READ,
      PERMISSION_TYPES.CREATE,
      PERMISSION_TYPES.UPDATE,
      PERMISSION_TYPES.DELETE,
      PERMISSION_TYPES.MANAGE,
    ],
    finance: [
      PERMISSION_TYPES.READ,
      PERMISSION_TYPES.CREATE,
      PERMISSION_TYPES.UPDATE,
      PERMISSION_TYPES.APPROVE,
      PERMISSION_TYPES.EXPORT,
      PERMISSION_TYPES.MANAGE,
    ],
    reports: [
      PERMISSION_TYPES.READ,
      PERMISSION_TYPES.EXPORT,
      PERMISSION_TYPES.CONFIGURE,
      PERMISSION_TYPES.MANAGE,
    ],
    analytics: [
      PERMISSION_TYPES.READ,
      PERMISSION_TYPES.EXPORT,
      PERMISSION_TYPES.CONFIGURE,
      PERMISSION_TYPES.MANAGE,
    ],
    ai: [
      PERMISSION_TYPES.READ,
      PERMISSION_TYPES.CREATE,
      PERMISSION_TYPES.UPDATE,
      PERMISSION_TYPES.DELETE,
      PERMISSION_TYPES.CONFIGURE,
      PERMISSION_TYPES.MANAGE,
    ],
    billing: [
      PERMISSION_TYPES.READ,
      PERMISSION_TYPES.UPDATE,
      PERMISSION_TYPES.APPROVE,
      PERMISSION_TYPES.MANAGE,
      PERMISSION_TYPES.CONFIGURE,
    ],
    settings: [
      PERMISSION_TYPES.READ,
      PERMISSION_TYPES.UPDATE,
      PERMISSION_TYPES.CONFIGURE,
      PERMISSION_TYPES.MANAGE,
    ],
    developer: [
      PERMISSION_TYPES.READ,
      PERMISSION_TYPES.CREATE,
      PERMISSION_TYPES.UPDATE,
      PERMISSION_TYPES.DELETE,
      PERMISSION_TYPES.CONFIGURE,
      PERMISSION_TYPES.MANAGE,
    ],
  };

export function buildPermissionKey(
  category: PermissionCategorySlug,
  type: PermissionTypeSlug,
): PermissionKey {
  return `${category}.${type}`;
}

function buildPermissionLabel(category: PermissionCategorySlug, type: PermissionTypeSlug): string {
  return `${PERMISSION_TYPE_LABELS[type]} ${PERMISSION_CATEGORY_LABELS[category]}`;
}

function buildPermissionDescription(
  category: PermissionCategorySlug,
  type: PermissionTypeSlug,
): string {
  return `${PERMISSION_TYPE_LABELS[type]} access for ${PERMISSION_CATEGORY_LABELS[category].toLowerCase()}.`;
}

export function buildPermissionCatalog(): Permission[] {
  const permissions: Permission[] = [];

  for (const category of ALL_PERMISSION_CATEGORIES) {
    const types = CATEGORY_PERMISSION_TYPE_MATRIX[category];

    for (const type of types) {
      const key = buildPermissionKey(category, type);

      permissions.push({
        id: `perm-${category}-${type}`,
        key,
        label: buildPermissionLabel(category, type),
        description: buildPermissionDescription(category, type),
        category,
        type,
        module: category,
      });
    }
  }

  return permissions;
}

export const RBAC_PERMISSION_CATALOG = buildPermissionCatalog();

export const ALL_RBAC_PERMISSION_KEYS = RBAC_PERMISSION_CATALOG.map((permission) => permission.key);

export const READ_ONLY_PERMISSION_KEYS = RBAC_PERMISSION_CATALOG.filter(
  (permission) => permission.type === PERMISSION_TYPES.READ,
).map((permission) => permission.key);
