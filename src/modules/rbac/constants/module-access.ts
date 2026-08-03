import { PERMISSION_CATEGORIES } from "@/modules/rbac/constants/permission-categories";
import { buildPermissionKey } from "@/modules/rbac/constants/permission-catalog";
import { PERMISSION_TYPES } from "@/modules/rbac/constants/permission-types";
import type { PermissionKey } from "@/modules/rbac/types/permission";

/** Maps application routes to required permissions for `canAccessRoute`. */
export const ROUTE_PERMISSION_MAP: Record<string, PermissionKey | PermissionKey[]> = {
  "/dashboard": buildPermissionKey(PERMISSION_CATEGORIES.DASHBOARD, PERMISSION_TYPES.READ),
  "/app": buildPermissionKey(PERMISSION_CATEGORIES.DASHBOARD, PERMISSION_TYPES.READ),
  "/app/settings": buildPermissionKey(PERMISSION_CATEGORIES.SETTINGS, PERMISSION_TYPES.READ),
  "/app/settings/roles": buildPermissionKey(PERMISSION_CATEGORIES.STAFF, PERMISSION_TYPES.MANAGE),
  "/app/modules/restaurant": buildPermissionKey(PERMISSION_CATEGORIES.MENU, PERMISSION_TYPES.READ),
  "/app/modules/pos": buildPermissionKey(PERMISSION_CATEGORIES.POS, PERMISSION_TYPES.READ),
  "/app/modules/kitchen": buildPermissionKey(PERMISSION_CATEGORIES.KITCHEN, PERMISSION_TYPES.READ),
  "/app/modules/inventory": buildPermissionKey(
    PERMISSION_CATEGORIES.INVENTORY,
    PERMISSION_TYPES.READ,
  ),
  "/app/modules/marketing": buildPermissionKey(
    PERMISSION_CATEGORIES.MARKETING,
    PERMISSION_TYPES.READ,
  ),
  "/app/modules/finance": buildPermissionKey(PERMISSION_CATEGORIES.FINANCE, PERMISSION_TYPES.READ),
  "/app/modules/analytics": buildPermissionKey(
    PERMISSION_CATEGORIES.ANALYTICS,
    PERMISSION_TYPES.READ,
  ),
  "/app/modules/reports": buildPermissionKey(PERMISSION_CATEGORIES.REPORTS, PERMISSION_TYPES.READ),
  "/app/modules/ai": buildPermissionKey(PERMISSION_CATEGORIES.AI, PERMISSION_TYPES.READ),
  "/app/modules/billing": buildPermissionKey(PERMISSION_CATEGORIES.BILLING, PERMISSION_TYPES.READ),
  "/app/modules/developer": buildPermissionKey(
    PERMISSION_CATEGORIES.DEVELOPER,
    PERMISSION_TYPES.READ,
  ),
};

/** Maps module slugs to minimum read permission for `canAccessModule`. */
export const MODULE_PERMISSION_MAP: Record<string, PermissionKey> = {
  dashboard: buildPermissionKey(PERMISSION_CATEGORIES.DASHBOARD, PERMISSION_TYPES.READ),
  business: buildPermissionKey(PERMISSION_CATEGORIES.BUSINESS, PERMISSION_TYPES.READ),
  branches: buildPermissionKey(PERMISSION_CATEGORIES.BRANCHES, PERMISSION_TYPES.READ),
  staff: buildPermissionKey(PERMISSION_CATEGORIES.STAFF, PERMISSION_TYPES.READ),
  customers: buildPermissionKey(PERMISSION_CATEGORIES.CUSTOMERS, PERMISSION_TYPES.READ),
  reservations: buildPermissionKey(PERMISSION_CATEGORIES.RESERVATIONS, PERMISSION_TYPES.READ),
  menu: buildPermissionKey(PERMISSION_CATEGORIES.MENU, PERMISSION_TYPES.READ),
  kitchen: buildPermissionKey(PERMISSION_CATEGORIES.KITCHEN, PERMISSION_TYPES.READ),
  pos: buildPermissionKey(PERMISSION_CATEGORIES.POS, PERMISSION_TYPES.READ),
  orders: buildPermissionKey(PERMISSION_CATEGORIES.ORDERS, PERMISSION_TYPES.READ),
  inventory: buildPermissionKey(PERMISSION_CATEGORIES.INVENTORY, PERMISSION_TYPES.READ),
  marketing: buildPermissionKey(PERMISSION_CATEGORIES.MARKETING, PERMISSION_TYPES.READ),
  finance: buildPermissionKey(PERMISSION_CATEGORIES.FINANCE, PERMISSION_TYPES.READ),
  reports: buildPermissionKey(PERMISSION_CATEGORIES.REPORTS, PERMISSION_TYPES.READ),
  analytics: buildPermissionKey(PERMISSION_CATEGORIES.ANALYTICS, PERMISSION_TYPES.READ),
  ai: buildPermissionKey(PERMISSION_CATEGORIES.AI, PERMISSION_TYPES.READ),
  billing: buildPermissionKey(PERMISSION_CATEGORIES.BILLING, PERMISSION_TYPES.READ),
  settings: buildPermissionKey(PERMISSION_CATEGORIES.SETTINGS, PERMISSION_TYPES.READ),
  developer: buildPermissionKey(PERMISSION_CATEGORIES.DEVELOPER, PERMISSION_TYPES.READ),
};
