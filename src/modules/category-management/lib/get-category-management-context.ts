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
import { CATEGORY_LIST_PAGE_SIZE } from "@/modules/category-management/constants/routes";
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";
import type { CategoryListQuery } from "@/modules/category-management/types/category-management-types";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  getCategoryDashboardStats,
  getManagedCategory,
  listManagedCategories,
  listManagedCategoryTree,
} from "@/services/restaurant-category.service";
import { getManagedMenu } from "@/services/restaurant-menu.service";
import { getRestaurantFoundationBundle } from "@/services/restaurant-management.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";
import type { MenuManagementRecord } from "@/modules/menu-management/types/menu-management-types";

export interface CategoryManagementPermissions {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canPublish: boolean;
}

export interface CategoryManagementContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: CategoryManagementPermissions;
  menu: MenuManagementRecord;
  moduleEnabled: boolean;
}

function buildCategoryPermissions(
  authorization: AuthorizationContext,
): CategoryManagementPermissions {
  const { permissions, isOwner } = authorization;

  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.CATEGORY_VIEW),
    canCreate: isOwner || hasPermission(permissions, PERMISSION_CODES.CATEGORY_CREATE),
    canUpdate: isOwner || hasPermission(permissions, PERMISSION_CODES.CATEGORY_UPDATE),
    canDelete: isOwner || hasPermission(permissions, PERMISSION_CODES.CATEGORY_DELETE),
    canPublish:
      isOwner ||
      hasPermission(permissions, PERMISSION_CODES.CATEGORY_PUBLISH) ||
      hasPermission(permissions, PERMISSION_CODES.CATEGORY_UPDATE),
  };
}

async function resolveCategoryBusinessForUser(
  user: AuthUser,
): Promise<BusinessProfileData & { id: string }> {
  const business = await getBusinessByOwnerId(user.id);

  if (!business?.id) {
    throw permissionDenied();
  }

  return business;
}

async function loadCategoryModuleContext(user: AuthUser): Promise<{
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  moduleEnabled: boolean;
}> {
  const business = await resolveCategoryBusinessForUser(user);
  const authorization = await resolveAuthorizationContext(user, business);
  const bundle = await getRestaurantFoundationBundle(user.id);

  return {
    business,
    authorization,
    moduleEnabled: bundle.moduleEnabled,
  };
}

async function resolveMenuContext(businessId: string, menuId: string) {
  const menu = await getManagedMenu(businessId, menuId);

  if (!menu) {
    return null;
  }

  return menu;
}

export const getCategoryManagementContext = cache(
  async (menuId: string): Promise<CategoryManagementContext> => {
    const user = await requireApplicationAccess();
    const loaded = await loadCategoryModuleContext(user);
    const permissionsFlags = buildCategoryPermissions(loaded.authorization);

    if (!permissionsFlags.canView) {
      redirect(ROUTES.application);
    }

    if (!loaded.moduleEnabled) {
      redirect("/app/modules/restaurant");
    }

    const menu = await resolveMenuContext(loaded.business.id, menuId);

    if (!menu) {
      redirect(MENU_MANAGEMENT_ROUTES.list);
    }

    return {
      user,
      business: loaded.business,
      authorization: loaded.authorization,
      permissionsFlags,
      menu,
      moduleEnabled: loaded.moduleEnabled,
    };
  },
);

export const getCategoryListContext = cache(
  async (menuId: string, query: CategoryListQuery = {}) => {
    const context = await getCategoryManagementContext(menuId);
    const normalizedQuery: CategoryListQuery = {
      ...query,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? CATEGORY_LIST_PAGE_SIZE,
    };
    const [list, stats, tree] = await Promise.all([
      listManagedCategories(context.business.id, menuId, normalizedQuery),
      getCategoryDashboardStats(context.business.id, menuId),
      listManagedCategoryTree(context.business.id, menuId, normalizedQuery.status ?? "ALL"),
    ]);

    return { ...context, list, stats, tree, query: normalizedQuery };
  },
);

export const getCategoryDetailContext = cache(async (menuId: string, categoryId: string) => {
  const context = await getCategoryManagementContext(menuId);
  const [category, tree, parentOptions] = await Promise.all([
    getManagedCategory(context.business.id, menuId, categoryId),
    listManagedCategoryTree(context.business.id, menuId, "ALL"),
    listManagedCategories(context.business.id, menuId, { pageSize: 200 }),
  ]);

  return {
    ...context,
    category,
    tree,
    parentOptions: parentOptions.items.filter((entry) => entry.id !== categoryId),
  };
});

export const getCategoryCreateContext = cache(async (menuId: string) => {
  const context = await getCategoryManagementContext(menuId);
  const parentOptions = await listManagedCategories(context.business.id, menuId, {
    pageSize: 200,
  });

  return { ...context, parentOptions: parentOptions.items };
});

export async function requireCategoryActionContext(
  menuId: string,
  permission: (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES],
): Promise<CategoryManagementContext> {
  const user = await getCurrentUser();

  if (!user) {
    throw permissionDenied();
  }

  const loaded = await loadCategoryModuleContext(user);

  if (
    !hasPermission(loaded.authorization.permissions, permission) &&
    !loaded.authorization.isOwner
  ) {
    throw permissionDenied();
  }

  if (!loaded.moduleEnabled) {
    redirect("/app/modules/restaurant");
  }

  const menu = await resolveMenuContext(loaded.business.id, menuId);

  if (!menu) {
    throw new Error("Menu not found");
  }

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags: buildCategoryPermissions(loaded.authorization),
    menu,
    moduleEnabled: loaded.moduleEnabled,
  };
}
