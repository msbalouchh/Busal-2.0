"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { CATEGORY_MANAGEMENT_ROUTES } from "@/modules/category-management/constants/routes";
import { requireCategoryActionContext } from "@/modules/category-management/lib/get-category-management-context";
import { validateCategoryInput } from "@/modules/category-management/lib/category-validation";
import type {
  CategoryManagementInput,
  CategoryReorderInput,
} from "@/modules/category-management/types/category-management-types";
import {
  archiveManagedCategory,
  createManagedCategory,
  deleteManagedCategory,
  duplicateManagedCategory,
  publishManagedCategory,
  reorderManagedCategories,
  restoreManagedCategory,
  updateManagedCategory,
} from "@/services/restaurant-category.service";

function revalidateCategoryPages(menuId: string, categoryId?: string) {
  revalidatePath(CATEGORY_MANAGEMENT_ROUTES.list(menuId));

  if (categoryId) {
    revalidatePath(CATEGORY_MANAGEMENT_ROUTES.details(menuId, categoryId));
    revalidatePath(CATEGORY_MANAGEMENT_ROUTES.edit(menuId, categoryId));
  }
}

export async function createCategoryManagementAction(
  menuId: string,
  input: CategoryManagementInput,
) {
  const context = await requireCategoryActionContext(menuId, PERMISSION_CODES.CATEGORY_CREATE);
  validateCategoryInput(input);
  const category = await createManagedCategory(context.user.id, menuId, input);
  revalidateCategoryPages(menuId, category.id);
  return { success: true as const, categoryId: category.id };
}

export async function updateCategoryManagementAction(
  menuId: string,
  categoryId: string,
  input: CategoryManagementInput,
) {
  const context = await requireCategoryActionContext(menuId, PERMISSION_CODES.CATEGORY_UPDATE);
  validateCategoryInput(input);
  await updateManagedCategory(context.user.id, menuId, categoryId, input);
  revalidateCategoryPages(menuId, categoryId);
  return { success: true as const };
}

export async function duplicateCategoryManagementAction(menuId: string, categoryId: string) {
  const context = await requireCategoryActionContext(menuId, PERMISSION_CODES.CATEGORY_CREATE);
  const category = await duplicateManagedCategory(context.user.id, menuId, categoryId);
  revalidateCategoryPages(menuId, category.id);
  return { success: true as const, categoryId: category.id };
}

export async function deleteCategoryManagementAction(menuId: string, categoryId: string) {
  const context = await requireCategoryActionContext(menuId, PERMISSION_CODES.CATEGORY_DELETE);
  await deleteManagedCategory(context.user.id, menuId, categoryId);
  revalidateCategoryPages(menuId, categoryId);
  return { success: true as const };
}

export async function archiveCategoryManagementAction(menuId: string, categoryId: string) {
  const context = await requireCategoryActionContext(menuId, PERMISSION_CODES.CATEGORY_DELETE);
  await archiveManagedCategory(context.user.id, menuId, categoryId);
  revalidateCategoryPages(menuId, categoryId);
  return { success: true as const };
}

export async function restoreCategoryManagementAction(menuId: string, categoryId: string) {
  const context = await requireCategoryActionContext(menuId, PERMISSION_CODES.CATEGORY_UPDATE);
  await restoreManagedCategory(context.user.id, menuId, categoryId);
  revalidateCategoryPages(menuId, categoryId);
  return { success: true as const };
}

export async function publishCategoryManagementAction(menuId: string, categoryId: string) {
  const context = await requireCategoryActionContext(menuId, PERMISSION_CODES.CATEGORY_PUBLISH);
  await publishManagedCategory(context.user.id, menuId, categoryId);
  revalidateCategoryPages(menuId, categoryId);
  return { success: true as const };
}

export async function reorderCategoriesManagementAction(input: CategoryReorderInput) {
  const context = await requireCategoryActionContext(
    input.menuId,
    PERMISSION_CODES.CATEGORY_UPDATE,
  );
  await reorderManagedCategories(context.user.id, input);
  revalidateCategoryPages(input.menuId);
  return { success: true as const };
}
