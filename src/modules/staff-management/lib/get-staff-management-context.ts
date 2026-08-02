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
import { requireBusinessContext } from "@/modules/business-context/services/business-context.service";
import { STAFF_LIST_PAGE_SIZE } from "@/modules/staff-management/constants/routes";
import type { StaffListQuery } from "@/modules/staff-management/types/staff-management-types";
import { getCurrentUser } from "@/services/auth.service";
import { getBusinessByOwnerId } from "@/services/business-profile.service";
import {
  getStaffMemberProfile,
  queryStaffDirectory,
} from "@/services/staff-management-module.service";
import { ensureSystemRoles, listRoles } from "@/services/staff-management.service";
import { listBranches } from "@/services/business-management.service";
import type { AuthUser } from "@/types/auth";
import type { AuthorizationContext } from "@/modules/authorization/types/authorization";
import type { BusinessProfileData } from "@/types/business-profile";
import type { BranchData, RoleData } from "@/services/staff-management.service";
import type { StaffDirectoryQuery } from "@/modules/staff/types/staff-management-types";
import type { StaffListResult } from "@/modules/staff-management/types/staff-management-types";

export interface StaffManagementPermissions {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canAssignRole: boolean;
  canAssignBranch: boolean;
}

export interface StaffManagementContext {
  user: AuthUser;
  business: BusinessProfileData & { id: string };
  authorization: AuthorizationContext;
  permissionsFlags: StaffManagementPermissions;
  branches: BranchData[];
  roles: RoleData[];
}

function buildStaffPermissions(authorization: AuthorizationContext): StaffManagementPermissions {
  const { permissions, isOwner } = authorization;

  return {
    canView: isOwner || hasPermission(permissions, PERMISSION_CODES.STAFF_VIEW),
    canCreate: isOwner || hasPermission(permissions, PERMISSION_CODES.STAFF_CREATE),
    canUpdate: isOwner || hasPermission(permissions, PERMISSION_CODES.STAFF_UPDATE),
    canDelete: isOwner || hasPermission(permissions, PERMISSION_CODES.STAFF_DELETE),
    canAssignRole:
      isOwner ||
      hasPermission(permissions, PERMISSION_CODES.STAFF_ASSIGN_ROLE) ||
      hasPermission(permissions, PERMISSION_CODES.STAFF_UPDATE),
    canAssignBranch:
      isOwner ||
      hasPermission(permissions, PERMISSION_CODES.STAFF_ASSIGN_BRANCH) ||
      hasPermission(permissions, PERMISSION_CODES.STAFF_UPDATE),
  };
}

async function resolveStaffBusinessForUser(
  user: AuthUser,
): Promise<BusinessProfileData & { id: string }> {
  const business = await getBusinessByOwnerId(user.id);

  if (!business?.id) {
    throw permissionDenied();
  }

  return business;
}

function mapListQueryToDirectoryQuery(
  businessId: string,
  query: StaffListQuery,
): StaffDirectoryQuery {
  const directoryQuery: StaffDirectoryQuery = {
    search: query.search,
    branchId: query.branchId || null,
    roleId: query.roleId || null,
    department: query.department || null,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? STAFF_LIST_PAGE_SIZE,
  };

  if (query.status === "ARCHIVED") {
    directoryQuery.isActive = false;
  } else if (query.status === "ACTIVE") {
    directoryQuery.isActive = true;
    directoryQuery.employmentStatus = "ACTIVE";
  } else if (query.status && query.status !== "ALL") {
    directoryQuery.employmentStatus = query.status;
  }

  return directoryQuery;
}

export const getStaffManagementContext = cache(async (): Promise<StaffManagementContext> => {
  const user = await requireApplicationAccess();
  const business = await resolveStaffBusinessForUser(user);
  const authorization = await resolveAuthorizationContext(user, business);
  const permissionsFlags = buildStaffPermissions(authorization);

  if (!permissionsFlags.canView) {
    redirect(ROUTES.application);
  }

  await ensureSystemRoles(business.id);
  const [branches, roles] = await Promise.all([listBranches(business.id), listRoles(business.id)]);

  return {
    user,
    business,
    authorization,
    permissionsFlags,
    branches,
    roles: roles.filter((role) => !role.isArchived),
  };
});

export const getStaffListContext = cache(async (query: StaffListQuery = {}) => {
  const context = await getStaffManagementContext();
  const platform = await requireBusinessContext();
  const directory = await queryStaffDirectory(
    platform,
    mapListQueryToDirectoryQuery(context.business.id, query),
  );
  const list: StaffListResult = {
    items: directory.items,
    total: directory.total,
    page: directory.page,
    pageSize: directory.pageSize,
    totalPages: directory.totalPages,
  };

  return { ...context, list, query };
});

export const getStaffDetailContext = cache(async (staffId: string) => {
  const context = await getStaffManagementContext();
  const platform = await requireBusinessContext();
  const member = await getStaffMemberProfile(platform, staffId);

  return { ...context, member };
});

export async function requireStaffActionContext(
  permission: (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES],
): Promise<StaffManagementContext> {
  const user = await getCurrentUser();

  if (!user) {
    throw permissionDenied();
  }

  const business = await resolveStaffBusinessForUser(user);
  const authorization = await resolveAuthorizationContext(user, business);

  if (!hasPermission(authorization.permissions, permission) && !authorization.isOwner) {
    throw permissionDenied();
  }

  const [branches, roles] = await Promise.all([listBranches(business.id), listRoles(business.id)]);

  return {
    user,
    business,
    authorization,
    permissionsFlags: buildStaffPermissions(authorization),
    branches,
    roles: roles.filter((role) => !role.isArchived),
  };
}
