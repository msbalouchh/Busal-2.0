"use server";

import { revalidatePath } from "next/cache";

import { STAFF_ROUTES } from "@/modules/staff/constants/routes";
import { requireAuthenticatedUser } from "@/modules/onboarding/lib/onboarding-guard";
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
  const user = await requireAuthenticatedUser();
  await createStaffMember(user.id, input);
  revalidateStaffPages();
  return { success: true as const };
}

export async function updateStaffMemberAction(staffId: string, input: StaffInput) {
  const user = await requireAuthenticatedUser();
  await updateStaffMember(user.id, staffId, input);
  revalidateStaffPages();
  return { success: true as const };
}

export async function deleteStaffMemberAction(staffId: string) {
  const user = await requireAuthenticatedUser();
  await deleteStaffMember(user.id, staffId);
  revalidateStaffPages();
  return { success: true as const };
}

export async function setStaffActiveStatusAction(staffId: string, isActive: boolean) {
  const user = await requireAuthenticatedUser();
  await setStaffActiveStatus(user.id, staffId, isActive);
  revalidateStaffPages();
  return { success: true as const };
}

export async function createCustomRoleAction(input: RoleInput) {
  const user = await requireAuthenticatedUser();
  await createCustomRole(user.id, input);
  revalidateStaffPages();
  return { success: true as const };
}

export async function updateCustomRoleAction(roleId: string, input: RoleInput) {
  const user = await requireAuthenticatedUser();
  await updateCustomRole(user.id, roleId, input);
  revalidateStaffPages();
  return { success: true as const };
}

export async function deleteCustomRoleAction(roleId: string) {
  const user = await requireAuthenticatedUser();
  await deleteCustomRole(user.id, roleId);
  revalidateStaffPages();
  return { success: true as const };
}

export async function saveRolePermissionsAction(assignments: PermissionAssignmentInput[]) {
  const user = await requireAuthenticatedUser();
  await saveRolePermissions(user.id, assignments);
  revalidateStaffPages();
  return { success: true as const };
}
