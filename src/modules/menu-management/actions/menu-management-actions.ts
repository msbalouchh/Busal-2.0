"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { MENU_MANAGEMENT_ROUTES } from "@/modules/menu-management/constants/routes";
import { requireMenuActionContext } from "@/modules/menu-management/lib/get-menu-management-context";
import { validateMenuInput } from "@/modules/menu-management/lib/menu-validation";
import type {
  MenuBranchAssignmentInput,
  MenuManagementInput,
} from "@/modules/menu-management/types/menu-management-types";
import {
  archiveManagedMenu,
  assignManagedMenuBranches,
  createManagedMenu,
  duplicateManagedMenu,
  publishManagedMenu,
  restoreManagedMenu,
  setDefaultManagedMenu,
  updateManagedMenu,
} from "@/services/restaurant-menu.service";

function revalidateMenuPages(menuId?: string) {
  revalidatePath(MENU_MANAGEMENT_ROUTES.list);

  if (menuId) {
    revalidatePath(MENU_MANAGEMENT_ROUTES.details(menuId));
    revalidatePath(MENU_MANAGEMENT_ROUTES.edit(menuId));
  }
}

export async function createMenuManagementAction(input: MenuManagementInput) {
  const context = await requireMenuActionContext(PERMISSION_CODES.MENU_CREATE);
  validateMenuInput(input);
  const menu = await createManagedMenu(context.user.id, input);
  revalidateMenuPages(menu.id);
  return { success: true as const, menuId: menu.id };
}

export async function updateMenuManagementAction(menuId: string, input: MenuManagementInput) {
  const context = await requireMenuActionContext(PERMISSION_CODES.MENU_UPDATE);
  validateMenuInput(input);
  await updateManagedMenu(context.user.id, menuId, input);
  revalidateMenuPages(menuId);
  return { success: true as const };
}

export async function duplicateMenuManagementAction(menuId: string) {
  const context = await requireMenuActionContext(PERMISSION_CODES.MENU_CREATE);
  const menu = await duplicateManagedMenu(context.user.id, menuId);
  revalidateMenuPages(menu.id);
  return { success: true as const, menuId: menu.id };
}

export async function archiveMenuManagementAction(menuId: string) {
  const context = await requireMenuActionContext(PERMISSION_CODES.MENU_DELETE);
  await archiveManagedMenu(context.user.id, menuId);
  revalidateMenuPages(menuId);
  return { success: true as const };
}

export async function restoreMenuManagementAction(menuId: string) {
  const context = await requireMenuActionContext(PERMISSION_CODES.MENU_UPDATE);
  await restoreManagedMenu(context.user.id, menuId);
  revalidateMenuPages(menuId);
  return { success: true as const };
}

export async function publishMenuManagementAction(menuId: string) {
  const context = await requireMenuActionContext(PERMISSION_CODES.MENU_PUBLISH);
  await publishManagedMenu(context.user.id, menuId);
  revalidateMenuPages(menuId);
  return { success: true as const };
}

export async function setDefaultMenuManagementAction(menuId: string) {
  const context = await requireMenuActionContext(PERMISSION_CODES.MENU_UPDATE);
  await setDefaultManagedMenu(context.user.id, menuId);
  revalidateMenuPages(menuId);
  return { success: true as const };
}

export async function assignMenuBranchesManagementAction(input: MenuBranchAssignmentInput) {
  const context = await requireMenuActionContext(PERMISSION_CODES.MENU_UPDATE);
  await assignManagedMenuBranches(context.user.id, input);
  revalidateMenuPages(input.menuId);
  return { success: true as const };
}
