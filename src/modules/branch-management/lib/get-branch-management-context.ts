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
import type { BranchListQuery } from "@/modules/branch-management/types/branch-management-types";
import { getManagedBranch, listManagedBranches } from "@/services/branch-management.service";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";

export interface BranchManagementPermissions {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManageSettings: boolean;
}

export interface BranchManagementContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: BranchManagementPermissions;
}

function buildBranchPermissions(authorization: AuthorizationContext): BranchManagementPermissions {
  const { permissions, isOwner } = authorization;

  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.BRANCH_VIEW),
    canCreate:
      isOwner ||
      hasPermission(permissions, PERMISSION_CODES.BRANCH_CREATE) ||
      hasPermission(permissions, PERMISSION_CODES.BRANCH_MANAGE),
    canUpdate:
      isOwner ||
      hasPermission(permissions, PERMISSION_CODES.BRANCH_UPDATE) ||
      hasPermission(permissions, PERMISSION_CODES.BRANCH_MANAGE),
    canDelete:
      isOwner ||
      hasPermission(permissions, PERMISSION_CODES.BRANCH_DELETE) ||
      hasPermission(permissions, PERMISSION_CODES.BRANCH_MANAGE),
    canManageSettings:
      isOwner ||
      hasPermission(permissions, PERMISSION_CODES.BRANCH_SETTINGS) ||
      hasPermission(permissions, PERMISSION_CODES.BRANCH_MANAGE),
  };
}

async function resolveBranchBusinessForUser(
  user: AuthUser,
): Promise<BusinessProfileData & { id: string }> {
  const business = await getBusinessByOwnerId(user.id);

  if (!business?.id) {
    throw permissionDenied();
  }

  return business;
}

export const getBranchManagementContext = cache(async (): Promise<BranchManagementContext> => {
  const user = await requireApplicationAccess();
  const business = await resolveBranchBusinessForUser(user);
  const authorization = await resolveAuthorizationContext(user, business);
  const permissionsFlags = buildBranchPermissions(authorization);

  if (!permissionsFlags.canView) {
    redirect(ROUTES.application);
  }

  return { user, business, authorization, permissionsFlags };
});

export const getBranchListContext = cache(async (query: BranchListQuery = {}) => {
  const context = await getBranchManagementContext();
  const list = await listManagedBranches(context.business.id, query);

  return { ...context, list, query };
});

export const getBranchDetailManagementContext = cache(async (branchId: string) => {
  const context = await getBranchManagementContext();
  const branch = await getManagedBranch(context.business.id, branchId);

  return { ...context, branch };
});

export async function requireBranchActionContext(
  permission: (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES],
): Promise<BranchManagementContext> {
  const user = await getCurrentUser();

  if (!user) {
    throw permissionDenied();
  }

  const business = await resolveBranchBusinessForUser(user);
  const authorization = await resolveAuthorizationContext(user, business);

  if (!hasPermission(authorization.permissions, permission) && !authorization.isOwner) {
    throw permissionDenied();
  }

  return {
    user,
    business,
    authorization,
    permissionsFlags: buildBranchPermissions(authorization),
  };
}
