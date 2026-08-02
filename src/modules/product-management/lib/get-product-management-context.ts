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
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";
import { PRODUCT_LIST_PAGE_SIZE } from "@/modules/product-management/constants/routes";
import type { ProductListQuery } from "@/modules/product-management/types/product-management-types";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import { listManagedCategories } from "@/services/restaurant-category.service";
import { getManagedMenu } from "@/services/restaurant-menu.service";
import {
  getManagedProduct,
  getProductDashboardStats,
  listManagedProducts,
} from "@/services/restaurant-product.service";
import { getRestaurantFoundationBundle } from "@/services/restaurant-management.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";
import type { MenuManagementRecord } from "@/modules/menu-management/types/menu-management-types";
import type { CategoryManagementRecord } from "@/modules/category-management/types/category-management-types";

export interface ProductManagementPermissions {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canPublish: boolean;
  canImport: boolean;
  canExport: boolean;
}

export interface ProductManagementContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: ProductManagementPermissions;
  menu: MenuManagementRecord;
  categories: CategoryManagementRecord[];
  moduleEnabled: boolean;
}

function buildProductPermissions(
  authorization: AuthorizationContext,
): ProductManagementPermissions {
  const { permissions, isOwner } = authorization;

  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.PRODUCT_VIEW),
    canCreate: isOwner || hasPermission(permissions, PERMISSION_CODES.PRODUCT_CREATE),
    canUpdate: isOwner || hasPermission(permissions, PERMISSION_CODES.PRODUCT_UPDATE),
    canDelete: isOwner || hasPermission(permissions, PERMISSION_CODES.PRODUCT_DELETE),
    canPublish:
      isOwner ||
      hasPermission(permissions, PERMISSION_CODES.PRODUCT_PUBLISH) ||
      hasPermission(permissions, PERMISSION_CODES.PRODUCT_UPDATE),
    canImport: isOwner || hasPermission(permissions, PERMISSION_CODES.PRODUCT_IMPORT),
    canExport: isOwner || hasPermission(permissions, PERMISSION_CODES.PRODUCT_EXPORT),
  };
}

async function resolveProductBusinessForUser(
  user: AuthUser,
): Promise<BusinessProfileData & { id: string }> {
  const business = await getBusinessByOwnerId(user.id);

  if (!business?.id) {
    throw permissionDenied();
  }

  return business;
}

async function loadProductModuleContext(user: AuthUser) {
  const business = await resolveProductBusinessForUser(user);
  const authorization = await resolveAuthorizationContext(user, business);
  const bundle = await getRestaurantFoundationBundle(user.id);

  return { business, authorization, moduleEnabled: bundle.moduleEnabled };
}

async function loadMenuCategories(businessId: string, menuId: string) {
  const result = await listManagedCategories(businessId, menuId, { pageSize: 500 });
  return result.items;
}

export const getProductManagementContext = cache(
  async (menuId: string): Promise<ProductManagementContext> => {
    const user = await requireApplicationAccess();
    const loaded = await loadProductModuleContext(user);
    const permissionsFlags = buildProductPermissions(loaded.authorization);

    if (!permissionsFlags.canView) {
      redirect(ROUTES.application);
    }

    if (!loaded.moduleEnabled) {
      redirect("/app/modules/restaurant");
    }

    const menu = await getManagedMenu(loaded.business.id, menuId);

    if (!menu) {
      redirect(MENU_MANAGEMENT_ROUTES.list);
    }

    const categories = await loadMenuCategories(loaded.business.id, menuId);

    return {
      user,
      business: loaded.business,
      authorization: loaded.authorization,
      permissionsFlags,
      menu,
      categories,
      moduleEnabled: loaded.moduleEnabled,
    };
  },
);

export const getProductListContext = cache(async (menuId: string, query: ProductListQuery = {}) => {
  const context = await getProductManagementContext(menuId);
  const normalizedQuery: ProductListQuery = {
    ...query,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? PRODUCT_LIST_PAGE_SIZE,
  };
  const [list, stats] = await Promise.all([
    listManagedProducts(context.business.id, menuId, normalizedQuery),
    getProductDashboardStats(context.business.id, menuId),
  ]);

  return { ...context, list, stats, query: normalizedQuery };
});

export const getProductDetailContext = cache(async (menuId: string, productId: string) => {
  const context = await getProductManagementContext(menuId);
  const product = await getManagedProduct(context.business.id, menuId, productId);

  return { ...context, product };
});

export async function requireProductActionContext(
  menuId: string,
  permission: (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES],
): Promise<ProductManagementContext> {
  const user = await getCurrentUser();

  if (!user) {
    throw permissionDenied();
  }

  const loaded = await loadProductModuleContext(user);

  if (
    !hasPermission(loaded.authorization.permissions, permission) &&
    !loaded.authorization.isOwner
  ) {
    throw permissionDenied();
  }

  if (!loaded.moduleEnabled) {
    redirect("/app/modules/restaurant");
  }

  const menu = await getManagedMenu(loaded.business.id, menuId);

  if (!menu) {
    throw new Error("Menu not found");
  }

  const categories = await loadMenuCategories(loaded.business.id, menuId);

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags: buildProductPermissions(loaded.authorization),
    menu,
    categories,
    moduleEnabled: loaded.moduleEnabled,
  };
}
