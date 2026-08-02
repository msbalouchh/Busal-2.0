"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { STAFF_MANAGEMENT_ROUTES } from "@/modules/staff/constants/staff-management";
import type {
  BulkInviteInput,
  BulkStaffUpdateInput,
  StaffDirectoryQuery,
  StaffInvitationInput,
  StaffProfileInput,
} from "@/modules/staff/types/staff-management-types";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import type { PermissionAssignmentInput, RoleInput } from "@/services/staff-management.service";
import {
  archiveStaffRole,
  bulkInviteStaffMembers,
  bulkUpdateStaffMembers,
  cancelStaffInvitation,
  createStaffMemberProfile,
  createStaffRole,
  deleteStaffMemberProfile,
  duplicateStaffRole,
  inviteStaffMember,
  resendStaffInvitation,
  saveStaffRolePermissions,
  setStaffMemberActiveStatus,
  updateStaffMemberProfile,
  updateStaffSecurityStatus,
} from "@/services/staff-management-module.service";

function revalidateStaffPages() {
  Object.values(STAFF_MANAGEMENT_ROUTES).forEach((path) => revalidatePath(path));
  revalidatePath("/dashboard/staff/members");
  revalidatePath("/app/staff");
}

export async function createStaffProfileAction(input: StaffProfileInput) {
  return protectedAction(PERMISSION_CODES.STAFF_CREATE, async ({ platform }) => {
    const member = await createStaffMemberProfile(platform, input);
    revalidateStaffPages();
    return { success: true as const, member };
  });
}

export async function updateStaffProfileAction(staffId: string, input: StaffProfileInput) {
  return protectedAction(PERMISSION_CODES.STAFF_UPDATE, async ({ platform }) => {
    const member = await updateStaffMemberProfile(platform, staffId, input);
    revalidateStaffPages();
    return { success: true as const, member };
  });
}

export async function deleteStaffProfileAction(staffId: string) {
  return protectedAction(PERMISSION_CODES.STAFF_DELETE, async ({ platform }) => {
    await deleteStaffMemberProfile(platform, staffId);
    revalidateStaffPages();
    return { success: true as const };
  });
}

export async function setStaffProfileActiveAction(staffId: string, isActive: boolean) {
  return protectedAction(PERMISSION_CODES.STAFF_UPDATE, async ({ platform }) => {
    await setStaffMemberActiveStatus(platform, staffId, isActive);
    revalidateStaffPages();
    return { success: true as const };
  });
}

export async function updateStaffSecurityAction(
  staffId: string,
  input: {
    lockAccount?: boolean;
    suspend?: boolean;
    reactivate?: boolean;
    forcePasswordReset?: boolean;
  },
) {
  return protectedAction(PERMISSION_CODES.STAFF_UPDATE, async ({ platform }) => {
    const member = await updateStaffSecurityStatus(platform, staffId, input);
    revalidateStaffPages();
    return { success: true as const, member };
  });
}

export async function inviteStaffAction(input: StaffInvitationInput) {
  return protectedAction(PERMISSION_CODES.STAFF_CREATE, async ({ platform }) => {
    const invitation = await inviteStaffMember(platform, input);
    revalidateStaffPages();
    return { success: true as const, invitation };
  });
}

export async function bulkInviteStaffAction(input: BulkInviteInput) {
  return protectedAction(PERMISSION_CODES.STAFF_CREATE, async ({ platform }) => {
    const invitations = await bulkInviteStaffMembers(platform, input);
    revalidateStaffPages();
    return { success: true as const, invitations };
  });
}

export async function resendStaffInvitationAction(invitationId: string) {
  return protectedAction(PERMISSION_CODES.STAFF_CREATE, async ({ platform }) => {
    const invitation = await resendStaffInvitation(platform, invitationId);
    revalidateStaffPages();
    return { success: true as const, invitation };
  });
}

export async function cancelStaffInvitationAction(invitationId: string) {
  return protectedAction(PERMISSION_CODES.STAFF_CREATE, async ({ platform }) => {
    await cancelStaffInvitation(platform, invitationId);
    revalidateStaffPages();
    return { success: true as const };
  });
}

export async function bulkUpdateStaffAction(input: BulkStaffUpdateInput) {
  return protectedAction(PERMISSION_CODES.STAFF_UPDATE, async ({ platform }) => {
    await bulkUpdateStaffMembers(platform, input);
    revalidateStaffPages();
    return { success: true as const };
  });
}

export async function createStaffRoleAction(input: RoleInput) {
  return protectedAction(PERMISSION_CODES.STAFF_UPDATE, async ({ platform }) => {
    await createStaffRole(platform, input);
    revalidateStaffPages();
    return { success: true as const };
  });
}

export async function duplicateStaffRoleAction(roleId: string) {
  return protectedAction(PERMISSION_CODES.STAFF_UPDATE, async ({ platform }) => {
    await duplicateStaffRole(platform, roleId);
    revalidateStaffPages();
    return { success: true as const };
  });
}

export async function archiveStaffRoleAction(roleId: string) {
  return protectedAction(PERMISSION_CODES.STAFF_UPDATE, async ({ platform }) => {
    await archiveStaffRole(platform, roleId);
    revalidateStaffPages();
    return { success: true as const };
  });
}

export async function saveStaffPermissionsAction(assignments: PermissionAssignmentInput[]) {
  return protectedAction(PERMISSION_CODES.STAFF_UPDATE, async ({ platform }) => {
    await saveStaffRolePermissions(platform, assignments);
    revalidateStaffPages();
    return { success: true as const };
  });
}

export async function queryStaffDirectoryAction(query: StaffDirectoryQuery) {
  return protectedAction(PERMISSION_CODES.STAFF_VIEW, async ({ platform }) => {
    const { queryStaffDirectory } = await import("@/services/staff-management-module.service");
    return queryStaffDirectory(platform, query);
  });
}
