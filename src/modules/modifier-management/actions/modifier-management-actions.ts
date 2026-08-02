"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { MODIFIER_MANAGEMENT_ROUTES } from "@/modules/modifier-management/constants/routes";
import { requireModifierActionContext } from "@/modules/modifier-management/lib/get-modifier-management-context";
import {
  validateModifierGroupInput,
  validateModifierOptionInput,
} from "@/modules/modifier-management/lib/modifier-validation";
import type {
  ModifierManagementInput,
  ModifierOptionInput,
  ModifierOptionReorderInput,
  ProductModifierAssignmentInput,
} from "@/modules/modifier-management/types/modifier-management-types";
import {
  activateManagedModifierGroup,
  archiveManagedModifierGroup,
  assignModifierGroupsToProduct,
  createManagedModifierGroup,
  createManagedModifierOption,
  deleteManagedModifierGroup,
  deleteManagedModifierOption,
  duplicateManagedModifierGroup,
  reorderManagedModifierOptions,
  restoreManagedModifierGroup,
  updateManagedModifierGroup,
  updateManagedModifierOption,
} from "@/services/restaurant-modifier.service";

function revalidateModifierPages(menuId: string, modifierGroupId?: string) {
  revalidatePath(MODIFIER_MANAGEMENT_ROUTES.list(menuId));
  revalidatePath(MODIFIER_MANAGEMENT_ROUTES.assign(menuId));

  if (modifierGroupId) {
    revalidatePath(MODIFIER_MANAGEMENT_ROUTES.details(menuId, modifierGroupId));
    revalidatePath(MODIFIER_MANAGEMENT_ROUTES.edit(menuId, modifierGroupId));
  }
}

export async function createModifierManagementAction(
  menuId: string,
  input: ModifierManagementInput,
) {
  const context = await requireModifierActionContext(menuId, PERMISSION_CODES.MODIFIER_CREATE);
  validateModifierGroupInput(input);
  const modifierGroup = await createManagedModifierGroup(context.user.id, input);
  revalidateModifierPages(menuId, modifierGroup.id);
  return { success: true as const, modifierGroupId: modifierGroup.id };
}

export async function updateModifierManagementAction(
  menuId: string,
  modifierGroupId: string,
  input: ModifierManagementInput,
) {
  const context = await requireModifierActionContext(menuId, PERMISSION_CODES.MODIFIER_UPDATE);
  validateModifierGroupInput(input);
  await updateManagedModifierGroup(context.user.id, modifierGroupId, input);
  revalidateModifierPages(menuId, modifierGroupId);
  return { success: true as const };
}

export async function duplicateModifierManagementAction(menuId: string, modifierGroupId: string) {
  const context = await requireModifierActionContext(menuId, PERMISSION_CODES.MODIFIER_CREATE);
  const modifierGroup = await duplicateManagedModifierGroup(context.user.id, modifierGroupId);
  revalidateModifierPages(menuId, modifierGroup.id);
  return { success: true as const, modifierGroupId: modifierGroup.id };
}

export async function deleteModifierManagementAction(menuId: string, modifierGroupId: string) {
  const context = await requireModifierActionContext(menuId, PERMISSION_CODES.MODIFIER_DELETE);
  await deleteManagedModifierGroup(context.user.id, modifierGroupId);
  revalidateModifierPages(menuId, modifierGroupId);
  return { success: true as const };
}

export async function archiveModifierManagementAction(menuId: string, modifierGroupId: string) {
  const context = await requireModifierActionContext(menuId, PERMISSION_CODES.MODIFIER_DELETE);
  await archiveManagedModifierGroup(context.user.id, modifierGroupId);
  revalidateModifierPages(menuId, modifierGroupId);
  return { success: true as const };
}

export async function restoreModifierManagementAction(menuId: string, modifierGroupId: string) {
  const context = await requireModifierActionContext(menuId, PERMISSION_CODES.MODIFIER_UPDATE);
  await restoreManagedModifierGroup(context.user.id, modifierGroupId);
  revalidateModifierPages(menuId, modifierGroupId);
  return { success: true as const };
}

export async function activateModifierManagementAction(menuId: string, modifierGroupId: string) {
  const context = await requireModifierActionContext(menuId, PERMISSION_CODES.MODIFIER_UPDATE);
  await activateManagedModifierGroup(context.user.id, modifierGroupId);
  revalidateModifierPages(menuId, modifierGroupId);
  return { success: true as const };
}

export async function createModifierOptionAction(
  menuId: string,
  modifierGroupId: string,
  input: ModifierOptionInput,
) {
  const context = await requireModifierActionContext(menuId, PERMISSION_CODES.MODIFIER_UPDATE);
  validateModifierOptionInput(input);
  await createManagedModifierOption(context.user.id, modifierGroupId, input);
  revalidateModifierPages(menuId, modifierGroupId);
  return { success: true as const };
}

export async function updateModifierOptionAction(
  menuId: string,
  modifierGroupId: string,
  optionId: string,
  input: ModifierOptionInput,
) {
  const context = await requireModifierActionContext(menuId, PERMISSION_CODES.MODIFIER_UPDATE);
  validateModifierOptionInput(input);
  await updateManagedModifierOption(context.user.id, optionId, input);
  revalidateModifierPages(menuId, modifierGroupId);
  return { success: true as const };
}

export async function deleteModifierOptionAction(
  menuId: string,
  modifierGroupId: string,
  optionId: string,
) {
  const context = await requireModifierActionContext(menuId, PERMISSION_CODES.MODIFIER_UPDATE);
  await deleteManagedModifierOption(context.user.id, optionId);
  revalidateModifierPages(menuId, modifierGroupId);
  return { success: true as const };
}

export async function reorderModifierOptionsAction(
  menuId: string,
  input: ModifierOptionReorderInput,
) {
  const context = await requireModifierActionContext(menuId, PERMISSION_CODES.MODIFIER_UPDATE);
  await reorderManagedModifierOptions(context.user.id, input);
  revalidateModifierPages(menuId, input.modifierGroupId);
  return { success: true as const };
}

export async function assignModifierGroupsAction(input: ProductModifierAssignmentInput) {
  const context = await requireModifierActionContext(
    input.menuId,
    PERMISSION_CODES.MODIFIER_ASSIGN,
  );
  const assignment = await assignModifierGroupsToProduct(context.user.id, input);
  revalidateModifierPages(input.menuId);
  return { success: true as const, assignment };
}
