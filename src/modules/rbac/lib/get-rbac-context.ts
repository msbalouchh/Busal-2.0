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
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  ensureSystemRoles,
  getRolePermissionAssignments,
  listPermissions,
  listRoles,
  type RolePermissionMatrix,
} from "@/services/staff-management.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";

export interface RbacManagementPermissions {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManagePermissions: boolean;
}

export interface RbacManagementContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  roles: Awaited<ReturnType<typeof listRoles>>;
  permissions: Awaited<ReturnType<typeof listPermissions>>;
  matrix: RolePermissionMatrix;
  permissionsFlags: RbacManagementPermissions;
}

function buildRbacPermissions(authorization: AuthorizationContext): RbacManagementPermissions {
  const { permissions, isOwner } = authorization;

  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.ROLES_VIEW),
    canCreate: isOwner || hasPermission(permissions, PERMISSION_CODES.ROLES_CREATE),
    canUpdate: isOwner || hasPermission(permissions, PERMISSION_CODES.ROLES_UPDATE),
    canDelete: isOwner || hasPermission(permissions, PERMISSION_CODES.ROLES_DELETE),
    canManagePermissions:
      isOwner ||
      hasPermission(permissions, PERMISSION_CODES.ROLES_MANAGE) ||
      hasPermission(permissions, PERMISSION_CODES.ROLES_UPDATE),
  };
}

export async function resolveRbacBusinessForUser(
  user: AuthUser,
): Promise<BusinessProfileData & { id: string }> {
  const business = await getBusinessByOwnerId(user.id);

  if (!business?.id) {
    throw permissionDenied();
  }

  return business;
}

export const getRbacManagementContext = cache(async (): Promise<RbacManagementContext> => {
  const user = await requireApplicationAccess();
  const business = await resolveRbacBusinessForUser(user);
  const authorization = await resolveAuthorizationContext(user, business);
  const permissionsFlags = buildRbacPermissions(authorization);

  if (!permissionsFlags.canView) {
    redirect(ROUTES.application);
  }

  await ensureSystemRoles(business.id);

  const [roles, permissions, assignments] = await Promise.all([
    listRoles(business.id),
    listPermissions(),
    getRolePermissionAssignments(business.id),
  ]);

  const visibleRoles = roles.filter((role) => !role.isArchived);

  return {
    user,
    business,
    authorization,
    roles: visibleRoles,
    permissions,
    matrix: {
      roles: visibleRoles,
      permissions,
      assignments,
    },
    permissionsFlags,
  };
});

export async function requireRbacActionContext(
  permission: (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES],
): Promise<RbacManagementContext> {
  const user = await getCurrentUser();

  if (!user) {
    throw permissionDenied();
  }

  const business = await resolveRbacBusinessForUser(user);
  const authorization = await resolveAuthorizationContext(user, business);

  if (!hasPermission(authorization.permissions, permission) && !authorization.isOwner) {
    throw permissionDenied();
  }

  await ensureSystemRoles(business.id);

  const [roles, permissions, assignments] = await Promise.all([
    listRoles(business.id),
    listPermissions(),
    getRolePermissionAssignments(business.id),
  ]);

  const visibleRoles = roles.filter((role) => !role.isArchived);

  return {
    user,
    business,
    authorization,
    roles: visibleRoles,
    permissions,
    matrix: {
      roles: visibleRoles,
      permissions,
      assignments,
    },
    permissionsFlags: buildRbacPermissions(authorization),
  };
}
