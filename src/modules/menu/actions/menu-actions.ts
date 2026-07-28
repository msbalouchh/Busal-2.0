"use server";

import { revalidatePath } from "next/cache";

import { MENU_ROUTES } from "@/modules/menu/constants/routes";
import { requireAuthenticatedUser } from "@/modules/onboarding/lib/onboarding-guard";
import {
  assignModifierGroupsToMenuItem,
  createCategory,
  createMenuItem,
  createModifierGroup,
  createModifierOption,
  deleteCategory,
  deleteMenuItem,
  deleteModifierGroup,
  deleteModifierOption,
  reorderCategories,
  setCategoryActiveStatus,
  setMenuItemAvailability,
  setMenuItemFeatured,
  updateCategory,
  updateMenuItem,
  updateModifierGroup,
  updateModifierOption,
  type CategoryInput,
  type MenuItemInput,
  type ModifierGroupInput,
  type ModifierOptionInput,
} from "@/services/menu-management.service";

function revalidateMenuPages() {
  Object.values(MENU_ROUTES).forEach((path) => revalidatePath(path));
}

export async function createCategoryAction(input: CategoryInput) {
  const user = await requireAuthenticatedUser();
  await createCategory(user.id, input);
  revalidateMenuPages();
  return { success: true as const };
}

export async function updateCategoryAction(categoryId: string, input: CategoryInput) {
  const user = await requireAuthenticatedUser();
  await updateCategory(user.id, categoryId, input);
  revalidateMenuPages();
  return { success: true as const };
}

export async function deleteCategoryAction(categoryId: string) {
  const user = await requireAuthenticatedUser();
  await deleteCategory(user.id, categoryId);
  revalidateMenuPages();
  return { success: true as const };
}

export async function setCategoryActiveStatusAction(categoryId: string, isActive: boolean) {
  const user = await requireAuthenticatedUser();
  await setCategoryActiveStatus(user.id, categoryId, isActive);
  revalidateMenuPages();
  return { success: true as const };
}

export async function reorderCategoriesAction(orderedIds: string[]) {
  const user = await requireAuthenticatedUser();
  await reorderCategories(user.id, orderedIds);
  revalidateMenuPages();
  return { success: true as const };
}

export async function createMenuItemAction(input: MenuItemInput) {
  const user = await requireAuthenticatedUser();
  await createMenuItem(user.id, input);
  revalidateMenuPages();
  return { success: true as const };
}

export async function updateMenuItemAction(itemId: string, input: MenuItemInput) {
  const user = await requireAuthenticatedUser();
  await updateMenuItem(user.id, itemId, input);
  revalidateMenuPages();
  return { success: true as const };
}

export async function deleteMenuItemAction(itemId: string) {
  const user = await requireAuthenticatedUser();
  await deleteMenuItem(user.id, itemId);
  revalidateMenuPages();
  return { success: true as const };
}

export async function setMenuItemAvailabilityAction(itemId: string, isAvailable: boolean) {
  const user = await requireAuthenticatedUser();
  await setMenuItemAvailability(user.id, itemId, isAvailable);
  revalidateMenuPages();
  return { success: true as const };
}

export async function setMenuItemFeaturedAction(itemId: string, isFeatured: boolean) {
  const user = await requireAuthenticatedUser();
  await setMenuItemFeatured(user.id, itemId, isFeatured);
  revalidateMenuPages();
  return { success: true as const };
}

export async function createModifierGroupAction(input: ModifierGroupInput) {
  const user = await requireAuthenticatedUser();
  await createModifierGroup(user.id, input);
  revalidateMenuPages();
  return { success: true as const };
}

export async function updateModifierGroupAction(groupId: string, input: ModifierGroupInput) {
  const user = await requireAuthenticatedUser();
  await updateModifierGroup(user.id, groupId, input);
  revalidateMenuPages();
  return { success: true as const };
}

export async function deleteModifierGroupAction(groupId: string) {
  const user = await requireAuthenticatedUser();
  await deleteModifierGroup(user.id, groupId);
  revalidateMenuPages();
  return { success: true as const };
}

export async function createModifierOptionAction(groupId: string, input: ModifierOptionInput) {
  const user = await requireAuthenticatedUser();
  await createModifierOption(user.id, groupId, input);
  revalidateMenuPages();
  return { success: true as const };
}

export async function updateModifierOptionAction(optionId: string, input: ModifierOptionInput) {
  const user = await requireAuthenticatedUser();
  await updateModifierOption(user.id, optionId, input);
  revalidateMenuPages();
  return { success: true as const };
}

export async function deleteModifierOptionAction(optionId: string) {
  const user = await requireAuthenticatedUser();
  await deleteModifierOption(user.id, optionId);
  revalidateMenuPages();
  return { success: true as const };
}

export async function assignModifierGroupsAction(itemId: string, modifierGroupIds: string[]) {
  const user = await requireAuthenticatedUser();
  await assignModifierGroupsToMenuItem(user.id, itemId, modifierGroupIds);
  revalidateMenuPages();
  return { success: true as const };
}
