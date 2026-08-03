import { PERMISSION_CATEGORIES } from "@/modules/rbac/constants/permission-categories";
import {
  buildPermissionKey,
  RBAC_PERMISSION_CATALOG,
} from "@/modules/rbac/constants/permission-catalog";
import { PERMISSION_TYPES } from "@/modules/rbac/constants/permission-types";
import type { PermissionGroup } from "@/modules/rbac/types/permission";

function keysForCategory(
  category: (typeof PERMISSION_CATEGORIES)[keyof typeof PERMISSION_CATEGORIES],
) {
  return RBAC_PERMISSION_CATALOG.filter((permission) => permission.category === category).map(
    (permission) => permission.key,
  );
}

export const RBAC_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "pg-operations",
    slug: "operations",
    name: "Operations",
    description: "Day-to-day service and order workflows",
    category: PERMISSION_CATEGORIES.ORDERS,
    permissionKeys: [
      ...keysForCategory(PERMISSION_CATEGORIES.ORDERS),
      ...keysForCategory(PERMISSION_CATEGORIES.POS),
      ...keysForCategory(PERMISSION_CATEGORIES.KITCHEN),
      ...keysForCategory(PERMISSION_CATEGORIES.RESERVATIONS),
    ],
  },
  {
    id: "pg-catalog",
    slug: "catalog",
    name: "Catalog",
    description: "Menu and product management",
    category: PERMISSION_CATEGORIES.MENU,
    permissionKeys: keysForCategory(PERMISSION_CATEGORIES.MENU),
  },
  {
    id: "pg-people",
    slug: "people",
    name: "People",
    description: "Staff and customer management",
    category: PERMISSION_CATEGORIES.STAFF,
    permissionKeys: [
      ...keysForCategory(PERMISSION_CATEGORIES.STAFF),
      ...keysForCategory(PERMISSION_CATEGORIES.CUSTOMERS),
    ],
  },
  {
    id: "pg-growth",
    slug: "growth",
    name: "Growth",
    description: "Marketing and analytics",
    category: PERMISSION_CATEGORIES.MARKETING,
    permissionKeys: [
      ...keysForCategory(PERMISSION_CATEGORIES.MARKETING),
      ...keysForCategory(PERMISSION_CATEGORIES.ANALYTICS),
      ...keysForCategory(PERMISSION_CATEGORIES.REPORTS),
    ],
  },
  {
    id: "pg-finance",
    slug: "finance",
    name: "Finance",
    description: "Financial operations and billing",
    category: PERMISSION_CATEGORIES.FINANCE,
    permissionKeys: [
      ...keysForCategory(PERMISSION_CATEGORIES.FINANCE),
      ...keysForCategory(PERMISSION_CATEGORIES.BILLING),
    ],
  },
  {
    id: "pg-administration",
    slug: "administration",
    name: "Administration",
    description: "Platform configuration and developer access",
    category: PERMISSION_CATEGORIES.SETTINGS,
    permissionKeys: [
      ...keysForCategory(PERMISSION_CATEGORIES.SETTINGS),
      ...keysForCategory(PERMISSION_CATEGORIES.DEVELOPER),
      buildPermissionKey(PERMISSION_CATEGORIES.AI, PERMISSION_TYPES.MANAGE),
    ],
  },
];
