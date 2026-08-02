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
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";
import type { RestaurantFoundationBundle } from "@/modules/restaurant-management/types/restaurant-management-types";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import { listBranches } from "@/services/business-management.service";
import { getRestaurantFoundationBundle } from "@/services/restaurant-management.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";
import type { BranchData } from "@/services/staff-management.service";

export interface RestaurantManagementPermissions {
  canView: boolean;
  canUpdate: boolean;
  canManageSettings: boolean;
  canManageBranding: boolean;
}

export interface RestaurantManagementContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: RestaurantManagementPermissions;
  bundle: RestaurantFoundationBundle;
  branches: BranchData[];
}

function buildRestaurantPermissions(
  authorization: AuthorizationContext,
): RestaurantManagementPermissions {
  const { permissions, isOwner } = authorization;

  return {
    canView:
      isOwner ||
      hasPermission(permissions, PERMISSION_CODES.RESTAURANT_VIEW) ||
      hasPermission(permissions, PERMISSION_CODES.RESTAURANT_UPDATE),
    canUpdate:
      isOwner ||
      hasPermission(permissions, PERMISSION_CODES.RESTAURANT_UPDATE) ||
      hasPermission(permissions, PERMISSION_CODES.RESTAURANT_SETTINGS),
    canManageSettings:
      isOwner ||
      hasPermission(permissions, PERMISSION_CODES.RESTAURANT_SETTINGS) ||
      hasPermission(permissions, PERMISSION_CODES.RESTAURANT_UPDATE),
    canManageBranding:
      isOwner ||
      hasPermission(permissions, PERMISSION_CODES.RESTAURANT_BRANDING) ||
      hasPermission(permissions, PERMISSION_CODES.RESTAURANT_UPDATE),
  };
}

async function resolveRestaurantBusinessForUser(
  user: AuthUser,
): Promise<BusinessProfileData & { id: string }> {
  const business = await getBusinessByOwnerId(user.id);

  if (!business?.id) {
    throw permissionDenied();
  }

  return business;
}

export const getRestaurantManagementContext = cache(
  async (): Promise<RestaurantManagementContext> => {
    const user = await requireApplicationAccess();
    const business = await resolveRestaurantBusinessForUser(user);
    const authorization = await resolveAuthorizationContext(user, business);
    const permissionsFlags = buildRestaurantPermissions(authorization);

    if (!permissionsFlags.canView) {
      redirect(ROUTES.application);
    }

    const [bundle, branches] = await Promise.all([
      getRestaurantFoundationBundle(user.id),
      listBranches(business.id),
    ]);

    return { user, business, authorization, permissionsFlags, bundle, branches };
  },
);

export async function requireRestaurantActionContext(
  permission: (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES],
): Promise<RestaurantManagementContext> {
  const user = await getCurrentUser();

  if (!user) {
    throw permissionDenied();
  }

  const business = await resolveRestaurantBusinessForUser(user);
  const authorization = await resolveAuthorizationContext(user, business);

  if (!hasPermission(authorization.permissions, permission) && !authorization.isOwner) {
    throw permissionDenied();
  }

  const [bundle, branches] = await Promise.all([
    getRestaurantFoundationBundle(user.id),
    listBranches(business.id),
  ]);

  return {
    user,
    business,
    authorization,
    permissionsFlags: buildRestaurantPermissions(authorization),
    bundle,
    branches,
  };
}

export function requireRestaurantModuleEnabled(context: RestaurantManagementContext): void {
  if (!context.bundle.moduleEnabled) {
    redirect("/app/modules/restaurant");
  }
}

export { RESTAURANT_MANAGEMENT_ROUTES };
