"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { STAFF_ROUTES } from "@/modules/staff/constants/routes";
import {
  createCustomRole,
  createStaffMember,
  deleteCustomRole,
  deleteStaffMember,
  saveRolePermissions,
  setStaffActiveStatus,
  updateCustomRole,
  updateStaffMember,
  type PermissionAssignmentInput,
  type RoleInput,
  type StaffInput,
} from "@/services/staff-management.service";

function revalidateStaffPages() {
  Object.values(STAFF_ROUTES).forEach((path) => revalidatePath(path));
}

export async function createStaffMemberAction(input: StaffInput) {
  return protectedAction(PERMISSION_CODES.STAFF_CREATE, async ({ platform }) => {
    await createStaffMember(platform.business.ownerId, input);
    revalidateStaffPages();
    return { success: true as const };
  });
}

export async function updateStaffMemberAction(staffId: string, input: StaffInput) {
  return protectedAction(PERMISSION_CODES.STAFF_UPDATE, async ({ platform }) => {
    await updateStaffMember(platform.business.ownerId, staffId, input);
    revalidateStaffPages();
    return { success: true as const };
  });
}

export async function deleteStaffMemberAction(staffId: string) {
  return protectedAction(PERMISSION_CODES.STAFF_DELETE, async ({ platform }) => {
    await deleteStaffMember(platform.business.ownerId, staffId);
    revalidateStaffPages();
    return { success: true as const };
  });
}

export async function setStaffActiveStatusAction(staffId: string, isActive: boolean) {
  return protectedAction(PERMISSION_CODES.STAFF_UPDATE, async ({ platform }) => {
    await setStaffActiveStatus(platform.business.ownerId, staffId, isActive);
    revalidateStaffPages();
    return { success: true as const };
  });
}

export async function createCustomRoleAction(input: RoleInput) {
  return protectedAction(PERMISSION_CODES.STAFF_UPDATE, async ({ platform }) => {
    await createCustomRole(platform.business.ownerId, input);
    revalidateStaffPages();
    return { success: true as const };
  });
}

export async function updateCustomRoleAction(roleId: string, input: RoleInput) {
  return protectedAction(PERMISSION_CODES.STAFF_UPDATE, async ({ platform }) => {
    await updateCustomRole(platform.business.ownerId, roleId, input);
    revalidateStaffPages();
    return { success: true as const };
  });
}

export async function deleteCustomRoleAction(roleId: string) {
  return protectedAction(PERMISSION_CODES.STAFF_UPDATE, async ({ platform }) => {
    await deleteCustomRole(platform.business.ownerId, roleId);
    revalidateStaffPages();
    return { success: true as const };
  });
}

export async function saveRolePermissionsAction(assignments: PermissionAssignmentInput[]) {
  return protectedAction(PERMISSION_CODES.STAFF_UPDATE, async ({ platform }) => {
    await saveRolePermissions(platform.business.ownerId, assignments);
    revalidateStaffPages();
    return { success: true as const };
  });
}
