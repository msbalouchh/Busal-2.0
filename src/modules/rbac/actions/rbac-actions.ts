"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { RBAC_ROUTES } from "@/modules/rbac/constants/rbac-routes";
import { requireRbacActionContext } from "@/modules/rbac/lib/get-rbac-context";
import {
  createCustomRole,
  deleteCustomRole,
  saveRolePermissions,
  updateCustomRole,
  type PermissionAssignmentInput,
  type RoleInput,
} from "@/services/staff-management.service";

function revalidateRbacPages() {
  Object.values(RBAC_ROUTES).forEach((path) => revalidatePath(path));
  revalidatePath("/app/settings");
}

export async function createRbacRoleAction(input: RoleInput) {
  const context = await requireRbacActionContext(PERMISSION_CODES.ROLES_CREATE);
  await createCustomRole(context.business.ownerId, input);
  revalidateRbacPages();
  return { success: true as const };
}

export async function updateRbacRoleAction(roleId: string, input: RoleInput) {
  const context = await requireRbacActionContext(PERMISSION_CODES.ROLES_UPDATE);
  await updateCustomRole(context.business.ownerId, roleId, input);
  revalidateRbacPages();
  return { success: true as const };
}

export async function deleteRbacRoleAction(roleId: string) {
  const context = await requireRbacActionContext(PERMISSION_CODES.ROLES_DELETE);
  await deleteCustomRole(context.business.ownerId, roleId);
  revalidateRbacPages();
  return { success: true as const };
}

export async function saveRbacPermissionsAction(assignments: PermissionAssignmentInput[]) {
  const context = await requireRbacActionContext(PERMISSION_CODES.ROLES_MANAGE);
  await saveRolePermissions(context.business.ownerId, assignments);
  revalidateRbacPages();
  return { success: true as const };
}
