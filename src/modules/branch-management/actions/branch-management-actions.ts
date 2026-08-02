"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { BRANCH_MANAGEMENT_ROUTES } from "@/modules/branch-management/constants/routes";
import { requireBranchActionContext } from "@/modules/branch-management/lib/get-branch-management-context";
import type {
  BranchManagementInput,
  BranchSettingsInput,
} from "@/modules/branch-management/types/branch-management-types";
import {
  archiveManagedBranch,
  createManagedBranch,
  restoreManagedBranch,
  saveManagedBranchSettings,
  setPrimaryManagedBranch,
  updateManagedBranch,
} from "@/services/branch-management.service";

function revalidateBranchPages(branchId?: string) {
  revalidatePath(BRANCH_MANAGEMENT_ROUTES.list);
  revalidatePath(BRANCH_MANAGEMENT_ROUTES.create);

  if (branchId) {
    revalidatePath(BRANCH_MANAGEMENT_ROUTES.details(branchId));
    revalidatePath(BRANCH_MANAGEMENT_ROUTES.edit(branchId));
    revalidatePath(BRANCH_MANAGEMENT_ROUTES.settings(branchId));
  }
}

export async function createBranchManagementAction(input: BranchManagementInput) {
  const context = await requireBranchActionContext(PERMISSION_CODES.BRANCH_CREATE);
  const branch = await createManagedBranch(context.business.ownerId, input);
  revalidateBranchPages(branch.id);
  return { success: true as const, branchId: branch.id };
}

export async function updateBranchManagementAction(branchId: string, input: BranchManagementInput) {
  const context = await requireBranchActionContext(PERMISSION_CODES.BRANCH_UPDATE);
  await updateManagedBranch(context.business.ownerId, branchId, input);
  revalidateBranchPages(branchId);
  return { success: true as const };
}

export async function archiveBranchManagementAction(branchId: string) {
  const context = await requireBranchActionContext(PERMISSION_CODES.BRANCH_DELETE);
  await archiveManagedBranch(context.business.ownerId, branchId);
  revalidateBranchPages(branchId);
  return { success: true as const };
}

export async function restoreBranchManagementAction(branchId: string) {
  const context = await requireBranchActionContext(PERMISSION_CODES.BRANCH_UPDATE);
  await restoreManagedBranch(context.business.ownerId, branchId);
  revalidateBranchPages(branchId);
  return { success: true as const };
}

export async function setPrimaryBranchManagementAction(branchId: string) {
  const context = await requireBranchActionContext(PERMISSION_CODES.BRANCH_UPDATE);
  await setPrimaryManagedBranch(context.business.ownerId, branchId);
  revalidateBranchPages(branchId);
  return { success: true as const };
}

export async function saveBranchSettingsManagementAction(
  branchId: string,
  input: BranchSettingsInput,
) {
  const context = await requireBranchActionContext(PERMISSION_CODES.BRANCH_SETTINGS);
  await saveManagedBranchSettings(context.business.ownerId, branchId, input);
  revalidateBranchPages(branchId);
  return { success: true as const };
}
