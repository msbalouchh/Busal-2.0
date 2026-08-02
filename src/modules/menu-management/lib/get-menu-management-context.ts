import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  hasPermission,
  resolveAuthorizationContext,
} from "@/modules/authorization/services/authorization.service";
import { permissionDenied } from "@/modules/authorization/utils/authorization-errors";
import { requireApplicationAccess } from "@/modules/application-shell/lib/require-application-access";
import { MENU_LIST_PAGE_SIZE } from "@/modules/menu-management/constants/routes";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";
import type { MenuListQuery } from "@/modules/menu-management/types/menu-management-types";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import { listBranches } from "@/services/business-management.service";
import {
  getManagedMenu,
  getMenuDashboardStats,
  listManagedMenus,
} from "@/services/restaurant-menu.service";
import { getRestaurantFoundationBundle } from "@/services/restaurant-management.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";
import type { BranchData } from "@/services/staff-management.service";

export interface MenuManagementPermissions {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canPublish: boolean;
}

export interface MenuManagementContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: MenuManagementPermissions;
  branches: BranchData[];
  moduleEnabled: boolean;
}

function buildMenuPermissions(authorization: AuthorizationContext): MenuManagementPermissions {
  const { permissions, isOwner } = authorization;

  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.MENU_VIEW),
    canCreate: isOwner || hasPermission(permissions, PERMISSION_CODES.MENU_CREATE),
    canUpdate: isOwner || hasPermission(permissions, PERMISSION_CODES.MENU_UPDATE),
    canDelete: isOwner || hasPermission(permissions, PERMISSION_CODES.MENU_DELETE),
    canPublish:
      isOwner ||
      hasPermission(permissions, PERMISSION_CODES.MENU_PUBLISH) ||
      hasPermission(permissions, PERMISSION_CODES.MENU_UPDATE),
  };
}

async function resolveMenuBusinessForUser(
  user: AuthUser,
): Promise<BusinessProfileData & { id: string }> {
  const business = await getBusinessByOwnerId(user.id);

  if (!business?.id) {
    throw permissionDenied();
  }

  return business;
}

async function loadMenuModuleContext(user: AuthUser): Promise<{
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  branches: BranchData[];
  moduleEnabled: boolean;
}> {
  const business = await resolveMenuBusinessForUser(user);
  const authorization = await resolveAuthorizationContext(user, business);
  const [branches, bundle] = await Promise.all([
    listBranches(business.id),
    getRestaurantFoundationBundle(user.id),
  ]);

  return {
    business,
    authorization,
    branches,
    moduleEnabled: bundle.moduleEnabled,
  };
}

export const getMenuManagementContext = cache(async (): Promise<MenuManagementContext> => {
  const user = await requireApplicationAccess();
  const loaded = await loadMenuModuleContext(user);
  const permissionsFlags = buildMenuPermissions(loaded.authorization);

  if (!permissionsFlags.canView) {
    redirect(ROUTES.application);
  }

  if (!loaded.moduleEnabled) {
    redirect("/app/modules/restaurant");
  }

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags,
    branches: loaded.branches,
    moduleEnabled: loaded.moduleEnabled,
  };
});

export const getMenuListContext = cache(async (query: MenuListQuery = {}) => {
  const context = await getMenuManagementContext();
  const normalizedQuery: MenuListQuery = {
    ...query,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? MENU_LIST_PAGE_SIZE,
  };
  const [list, stats] = await Promise.all([
    listManagedMenus(context.business.id, normalizedQuery),
    getMenuDashboardStats(context.business.id),
  ]);

  return { ...context, list, stats, query: normalizedQuery };
});

export const getMenuDetailContext = cache(async (menuId: string) => {
  const context = await getMenuManagementContext();
  const menu = await getManagedMenu(context.business.id, menuId);

  return { ...context, menu };
});

export async function requireMenuActionContext(
  permission: (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES],
): Promise<MenuManagementContext> {
  const user = await getCurrentUser();

  if (!user) {
    throw permissionDenied();
  }

  const loaded = await loadMenuModuleContext(user);

  if (
    !hasPermission(loaded.authorization.permissions, permission) &&
    !loaded.authorization.isOwner
  ) {
    throw permissionDenied();
  }

  if (!loaded.moduleEnabled) {
    redirect("/app/modules/restaurant");
  }

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags: buildMenuPermissions(loaded.authorization),
    branches: loaded.branches,
    moduleEnabled: loaded.moduleEnabled,
  };
}

export { RESTAURANT_MANAGEMENT_ROUTES };
