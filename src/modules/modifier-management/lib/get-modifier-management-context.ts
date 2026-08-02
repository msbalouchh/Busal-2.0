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
import { MODIFIER_LIST_PAGE_SIZE } from "@/modules/modifier-management/constants/routes";
import type { ModifierListQuery } from "@/modules/modifier-management/types/modifier-management-types";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import { getManagedMenu } from "@/services/restaurant-menu.service";
import {
  getManagedModifierGroup,
  getModifierDashboardStats,
  getProductModifierAssignment,
  listManagedModifierGroups,
  listMenuProductsForModifierAssignment,
} from "@/services/restaurant-modifier.service";
import { getRestaurantFoundationBundle } from "@/services/restaurant-management.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";
import type { MenuManagementRecord } from "@/modules/menu-management/types/menu-management-types";

export interface ModifierManagementPermissions {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canAssign: boolean;
}

export interface ModifierManagementContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: ModifierManagementPermissions;
  menu: MenuManagementRecord;
  moduleEnabled: boolean;
}

function buildModifierPermissions(
  authorization: AuthorizationContext,
): ModifierManagementPermissions {
  const { permissions, isOwner } = authorization;

  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.MODIFIER_VIEW),
    canCreate: isOwner || hasPermission(permissions, PERMISSION_CODES.MODIFIER_CREATE),
    canUpdate: isOwner || hasPermission(permissions, PERMISSION_CODES.MODIFIER_UPDATE),
    canDelete: isOwner || hasPermission(permissions, PERMISSION_CODES.MODIFIER_DELETE),
    canAssign: isOwner || hasPermission(permissions, PERMISSION_CODES.MODIFIER_ASSIGN),
  };
}

async function resolveModifierBusinessForUser(
  user: AuthUser,
): Promise<BusinessProfileData & { id: string }> {
  const business = await getBusinessByOwnerId(user.id);

  if (!business?.id) {
    throw permissionDenied();
  }

  return business;
}

async function loadModifierModuleContext(user: AuthUser) {
  const business = await resolveModifierBusinessForUser(user);
  const authorization = await resolveAuthorizationContext(user, business);
  const bundle = await getRestaurantFoundationBundle(user.id);

  return { business, authorization, moduleEnabled: bundle.moduleEnabled };
}

export const getModifierManagementContext = cache(
  async (menuId: string): Promise<ModifierManagementContext> => {
    const user = await requireApplicationAccess();
    const loaded = await loadModifierModuleContext(user);
    const permissionsFlags = buildModifierPermissions(loaded.authorization);

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

export const getModifierListContext = cache(
  async (menuId: string, query: ModifierListQuery = {}) => {
    const context = await getModifierManagementContext(menuId);
    const normalizedQuery: ModifierListQuery = {
      ...query,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? MODIFIER_LIST_PAGE_SIZE,
    };
    const [list, stats] = await Promise.all([
      listManagedModifierGroups(context.business.id, normalizedQuery),
      getModifierDashboardStats(context.business.id),
    ]);

    return { ...context, list, stats, query: normalizedQuery };
  },
);

export const getModifierDetailContext = cache(async (menuId: string, modifierGroupId: string) => {
  const context = await getModifierManagementContext(menuId);

  try {
    const modifierGroup = await getManagedModifierGroup(context.business.id, modifierGroupId);
    return { ...context, modifierGroup };
  } catch {
    return { ...context, modifierGroup: null };
  }
});

export const getModifierAssignmentContext = cache(async (menuId: string, productId?: string) => {
  const context = await getModifierManagementContext(menuId);
  const [modifierGroups, products] = await Promise.all([
    listManagedModifierGroups(context.business.id, { pageSize: 500, status: "ALL" }),
    listMenuProductsForModifierAssignment(context.business.id, menuId),
  ]);

  const assignment = productId
    ? await getProductModifierAssignment(context.business.id, menuId, productId)
    : null;

  return {
    ...context,
    modifierGroups: modifierGroups.items,
    products,
    assignment,
    selectedProductId: productId ?? products[0]?.id ?? null,
  };
});

export async function requireModifierActionContext(
  menuId: string,
  permission: (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES],
): Promise<ModifierManagementContext> {
  const user = await getCurrentUser();

  if (!user) {
    throw permissionDenied();
  }

  const loaded = await loadModifierModuleContext(user);

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

  return {
    user,
    business: loaded.business,
    authorization: loaded.authorization,
    permissionsFlags: buildModifierPermissions(loaded.authorization),
    menu,
    moduleEnabled: loaded.moduleEnabled,
  };
}
