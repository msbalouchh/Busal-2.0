"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { PRODUCT_MANAGEMENT_ROUTES } from "@/modules/product-management/constants/routes";
import { requireProductActionContext } from "@/modules/product-management/lib/get-product-management-context";
import { validateProductInput } from "@/modules/product-management/lib/product-validation";
import type {
  ProductBulkImportInput,
  ProductBulkStatusInput,
  ProductListQuery,
  ProductManagementInput,
} from "@/modules/product-management/types/product-management-types";
import {
  archiveManagedProduct,
  bulkExportManagedProducts,
  bulkImportManagedProducts,
  bulkUpdateManagedProductStatus,
  createManagedProduct,
  deleteManagedProduct,
  duplicateManagedProduct,
  publishManagedProduct,
  restoreManagedProduct,
  updateManagedProduct,
} from "@/services/restaurant-product.service";

function revalidateProductPages(menuId: string, productId?: string) {
  revalidatePath(PRODUCT_MANAGEMENT_ROUTES.list(menuId));

  if (productId) {
    revalidatePath(PRODUCT_MANAGEMENT_ROUTES.details(menuId, productId));
    revalidatePath(PRODUCT_MANAGEMENT_ROUTES.edit(menuId, productId));
  }
}

export async function createProductManagementAction(menuId: string, input: ProductManagementInput) {
  const context = await requireProductActionContext(menuId, PERMISSION_CODES.PRODUCT_CREATE);
  validateProductInput(input);
  const product = await createManagedProduct(context.user.id, menuId, input);
  revalidateProductPages(menuId, product.id);
  return { success: true as const, productId: product.id };
}

export async function updateProductManagementAction(
  menuId: string,
  productId: string,
  input: ProductManagementInput,
) {
  const context = await requireProductActionContext(menuId, PERMISSION_CODES.PRODUCT_UPDATE);
  validateProductInput(input);
  await updateManagedProduct(context.user.id, menuId, productId, input);
  revalidateProductPages(menuId, productId);
  return { success: true as const };
}

export async function duplicateProductManagementAction(menuId: string, productId: string) {
  const context = await requireProductActionContext(menuId, PERMISSION_CODES.PRODUCT_CREATE);
  const product = await duplicateManagedProduct(context.user.id, menuId, productId);
  revalidateProductPages(menuId, product.id);
  return { success: true as const, productId: product.id };
}

export async function deleteProductManagementAction(menuId: string, productId: string) {
  const context = await requireProductActionContext(menuId, PERMISSION_CODES.PRODUCT_DELETE);
  await deleteManagedProduct(context.user.id, menuId, productId);
  revalidateProductPages(menuId, productId);
  return { success: true as const };
}

export async function archiveProductManagementAction(menuId: string, productId: string) {
  const context = await requireProductActionContext(menuId, PERMISSION_CODES.PRODUCT_DELETE);
  await archiveManagedProduct(context.user.id, menuId, productId);
  revalidateProductPages(menuId, productId);
  return { success: true as const };
}

export async function restoreProductManagementAction(menuId: string, productId: string) {
  const context = await requireProductActionContext(menuId, PERMISSION_CODES.PRODUCT_UPDATE);
  await restoreManagedProduct(context.user.id, menuId, productId);
  revalidateProductPages(menuId, productId);
  return { success: true as const };
}

export async function publishProductManagementAction(menuId: string, productId: string) {
  const context = await requireProductActionContext(menuId, PERMISSION_CODES.PRODUCT_PUBLISH);
  await publishManagedProduct(context.user.id, menuId, productId);
  revalidateProductPages(menuId, productId);
  return { success: true as const };
}

export async function bulkUpdateProductStatusAction(input: ProductBulkStatusInput) {
  const context = await requireProductActionContext(input.menuId, PERMISSION_CODES.PRODUCT_UPDATE);
  const updated = await bulkUpdateManagedProductStatus(context.user.id, input);
  revalidateProductPages(input.menuId);
  return { success: true as const, updated };
}

export async function bulkImportProductsAction(input: ProductBulkImportInput) {
  const context = await requireProductActionContext(input.menuId, PERMISSION_CODES.PRODUCT_IMPORT);
  const result = await bulkImportManagedProducts(context.user.id, input);
  revalidateProductPages(input.menuId);
  return { success: true as const, ...result };
}

export async function bulkExportProductsAction(menuId: string, query: ProductListQuery = {}) {
  const context = await requireProductActionContext(menuId, PERMISSION_CODES.PRODUCT_EXPORT);
  const exportResult = await bulkExportManagedProducts(context.business.id, menuId, query);
  return { success: true as const, export: exportResult };
}
