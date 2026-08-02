import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PRODUCT_LIST_PAGE_SIZE } from "@/modules/product-management/constants/routes";
import {
  buildDuplicateProductName,
  buildDuplicateProductSku,
  normalizeProductName,
  normalizeProductSku,
  normalizeProductSlug,
  parseStringArray,
  slugifyProductName,
  validateProductInput,
  validateProductStatusTransition,
} from "@/modules/product-management/lib/product-validation";
import type {
  ProductBulkExportResult,
  ProductBulkImportInput,
  ProductBulkStatusInput,
  ProductDashboardStats,
  ProductListQuery,
  ProductListResult,
  ProductManagementInput,
  ProductManagementRecord,
  ProductSortField,
} from "@/modules/product-management/types/product-management-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: { category: { select: { id: true; name: true; menuId: true } } };
}>;

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

function decimalToNumber(value: Prisma.Decimal | null | undefined): number | null {
  if (value == null) {
    return null;
  }

  return Number(value);
}

function serializeProduct(product: ProductWithRelations): ProductManagementRecord {
  return {
    id: product.id,
    businessId: product.businessId,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    menuId: product.category.menuId,
    sku: product.sku,
    barcode: product.barcode,
    name: product.name,
    description: product.description,
    shortDescription: product.shortDescription,
    image: product.image,
    gallery: parseStringArray(product.gallery),
    status: product.status,
    productType: product.productType,
    price: Number(product.price),
    costPrice: decimalToNumber(product.costPrice),
    taxRate: decimalToNumber(product.taxRate),
    preparationTime: product.preparationTime,
    calories: product.calories,
    allergens: parseStringArray(product.allergens),
    ingredients: parseStringArray(product.ingredients),
    isVegetarian: product.isVegetarian,
    isVegan: product.isVegan,
    isHalal: product.isHalal,
    isGlutenFree: product.isGlutenFree,
    isFeatured: product.isFeatured,
    trackInventory: product.trackInventory,
    displayOrder: product.displayOrder,
    slug: product.slug,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

const productInclude = {
  category: { select: { id: true, name: true, menuId: true } },
} satisfies Prisma.ProductInclude;

function resolveOrderBy(
  sortBy: ProductSortField = "displayOrder",
  sortDirection: "asc" | "desc" = "asc",
): Prisma.ProductOrderByWithRelationInput[] {
  const direction = sortDirection;

  switch (sortBy) {
    case "name":
      return [{ name: direction }];
    case "price":
      return [{ price: direction }];
    case "createdAt":
      return [{ createdAt: direction }];
    case "status":
      return [{ status: direction }, { displayOrder: "asc" }];
    case "displayOrder":
    default:
      return [{ displayOrder: direction }, { name: "asc" }];
  }
}

async function assertCategoryInMenu(
  businessId: string,
  menuId: string,
  categoryId: string,
): Promise<void> {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, businessId, menuId },
    select: { id: true },
  });

  if (!category) {
    throw new Error("Category not found in this menu");
  }
}

async function assertUniqueSku(
  businessId: string,
  sku: string,
  excludeProductId?: string,
): Promise<void> {
  const existing = await prisma.product.findFirst({
    where: {
      businessId,
      sku: normalizeProductSku(sku),
      ...(excludeProductId ? { NOT: { id: excludeProductId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("SKU must be unique within this business");
  }
}

async function assertUniqueBarcode(
  businessId: string,
  barcode: string | null | undefined,
  excludeProductId?: string,
): Promise<void> {
  const normalized = barcode?.trim();
  if (!normalized) {
    return;
  }

  const existing = await prisma.product.findFirst({
    where: {
      businessId,
      barcode: normalized,
      ...(excludeProductId ? { NOT: { id: excludeProductId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Barcode must be unique within this business");
  }
}

async function assertUniqueSlug(
  businessId: string,
  slug: string,
  excludeProductId?: string,
): Promise<void> {
  const existing = await prisma.product.findFirst({
    where: {
      businessId,
      slug: normalizeProductSlug(slug),
      ...(excludeProductId ? { NOT: { id: excludeProductId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Slug must be unique within this business");
  }
}

async function resolveUniqueSlug(
  businessId: string,
  name: string,
  preferred?: string,
): Promise<string> {
  const base = normalizeProductSlug(preferred?.trim() || slugifyProductName(name));
  let slug = base;
  let attempt = 2;

  while (
    await prisma.product.findFirst({
      where: { businessId, slug },
      select: { id: true },
    })
  ) {
    slug = `${base}-${attempt}`;
    attempt += 1;
  }

  return slug;
}

async function resolveUniqueSku(businessId: string, sku: string): Promise<string> {
  let next = normalizeProductSku(sku);
  let attempt = 2;

  while (
    await prisma.product.findFirst({
      where: { businessId, sku: next },
      select: { id: true },
    })
  ) {
    next = `${normalizeProductSku(sku)}-${attempt}`;
    attempt += 1;
  }

  return next;
}

async function getOwnedProduct(
  businessId: string,
  menuId: string,
  productId: string,
): Promise<ProductWithRelations | null> {
  return prisma.product.findFirst({
    where: {
      id: productId,
      businessId,
      category: { menuId },
    },
    include: productInclude,
  });
}

function buildProductData(
  input: ProductManagementInput,
  slug: string,
): Omit<Prisma.ProductCreateInput, "business" | "category"> {
  return {
    sku: normalizeProductSku(input.sku),
    barcode: input.barcode?.trim() || null,
    name: normalizeProductName(input.name),
    description: input.description?.trim() || null,
    shortDescription: input.shortDescription?.trim() || null,
    image: input.image?.trim() || null,
    gallery: parseStringArray(input.gallery),
    productType: input.productType,
    price: input.price,
    costPrice: input.costPrice ?? null,
    taxRate: input.taxRate ?? null,
    preparationTime: input.preparationTime ?? null,
    calories: input.calories ?? null,
    allergens: parseStringArray(input.allergens),
    ingredients: parseStringArray(input.ingredients),
    isVegetarian: input.isVegetarian ?? false,
    isVegan: input.isVegan ?? false,
    isHalal: input.isHalal ?? false,
    isGlutenFree: input.isGlutenFree ?? false,
    isFeatured: input.isFeatured ?? false,
    trackInventory: input.trackInventory ?? false,
    displayOrder: input.displayOrder ?? 0,
    slug,
    seoTitle: input.seoTitle?.trim() || null,
    seoDescription: input.seoDescription?.trim() || null,
  };
}

function buildMenuProductWhere(
  businessId: string,
  menuId: string,
  query: ProductListQuery,
): Prisma.ProductWhereInput {
  const search = query.search?.trim();

  return {
    businessId,
    category: { menuId },
    ...(query.status && query.status !== "ALL" ? { status: query.status } : {}),
    ...(query.productType && query.productType !== "ALL" ? { productType: query.productType } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.dietary === "vegetarian" ? { isVegetarian: true } : {}),
    ...(query.dietary === "vegan" ? { isVegan: true } : {}),
    ...(query.dietary === "halal" ? { isHalal: true } : {}),
    ...(query.dietary === "glutenFree" ? { isGlutenFree: true } : {}),
    ...(query.dietary === "featured" ? { isFeatured: true } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
            { barcode: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export async function getProductDashboardStats(
  businessId: string,
  menuId: string,
): Promise<ProductDashboardStats> {
  const where = { businessId, category: { menuId } };
  const [total, active, inactive, archived, featured] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.count({ where: { ...where, status: "ACTIVE" } }),
    prisma.product.count({ where: { ...where, status: "INACTIVE" } }),
    prisma.product.count({ where: { ...where, status: "ARCHIVED" } }),
    prisma.product.count({ where: { ...where, isFeatured: true } }),
  ]);

  return { total, active, inactive, archived, featured };
}

export async function listManagedProducts(
  businessId: string,
  menuId: string,
  query: ProductListQuery = {},
): Promise<ProductListResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? PRODUCT_LIST_PAGE_SIZE));
  const where = buildMenuProductWhere(businessId, menuId, query);

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: resolveOrderBy(query.sortBy, query.sortDirection),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: products.map(serializeProduct),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getManagedProduct(
  businessId: string,
  menuId: string,
  productId: string,
): Promise<ProductManagementRecord | null> {
  const product = await getOwnedProduct(businessId, menuId, productId);
  return product ? serializeProduct(product) : null;
}

export async function createManagedProduct(
  ownerId: string,
  menuId: string,
  input: ProductManagementInput,
): Promise<ProductManagementRecord> {
  validateProductInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  await assertCategoryInMenu(businessId, menuId, input.categoryId);
  await assertUniqueSku(businessId, input.sku);
  await assertUniqueBarcode(businessId, input.barcode);

  const slug = await resolveUniqueSlug(businessId, input.name, input.slug);
  await assertUniqueSlug(businessId, slug);

  const product = await prisma.product.create({
    data: {
      business: { connect: { id: businessId } },
      category: { connect: { id: input.categoryId } },
      ...buildProductData(input, slug),
      status: "INACTIVE",
    },
    include: productInclude,
  });

  return serializeProduct(product);
}

export async function updateManagedProduct(
  ownerId: string,
  menuId: string,
  productId: string,
  input: ProductManagementInput,
): Promise<ProductManagementRecord> {
  validateProductInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedProduct(businessId, menuId, productId);

  if (!existing) {
    throw new Error("Product not found");
  }

  if (existing.status === "ARCHIVED") {
    throw new Error("Archived products cannot be edited. Restore the product first.");
  }

  await assertCategoryInMenu(businessId, menuId, input.categoryId);
  await assertUniqueSku(businessId, input.sku, productId);
  await assertUniqueBarcode(businessId, input.barcode, productId);

  const slug = input.slug?.trim() ? normalizeProductSlug(input.slug) : existing.slug;
  await assertUniqueSlug(businessId, slug, productId);

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      category: { connect: { id: input.categoryId } },
      ...buildProductData(input, slug),
    },
    include: productInclude,
  });

  return serializeProduct(product);
}

export async function duplicateManagedProduct(
  ownerId: string,
  menuId: string,
  productId: string,
): Promise<ProductManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedProduct(businessId, menuId, productId);

  if (!existing) {
    throw new Error("Product not found");
  }

  const duplicateName = buildDuplicateProductName(existing.name);
  const duplicateSku = await resolveUniqueSku(businessId, buildDuplicateProductSku(existing.sku));
  const duplicateSlug = await resolveUniqueSlug(businessId, duplicateName, `${existing.slug}-copy`);

  const product = await prisma.product.create({
    data: {
      business: { connect: { id: businessId } },
      category: { connect: { id: existing.categoryId } },
      sku: duplicateSku,
      barcode: null,
      name: duplicateName,
      description: existing.description,
      shortDescription: existing.shortDescription,
      image: existing.image,
      gallery: parseStringArray(existing.gallery),
      status: "INACTIVE",
      productType: existing.productType,
      price: existing.price,
      costPrice: existing.costPrice,
      taxRate: existing.taxRate,
      preparationTime: existing.preparationTime,
      calories: existing.calories,
      allergens: parseStringArray(existing.allergens),
      ingredients: parseStringArray(existing.ingredients),
      isVegetarian: existing.isVegetarian,
      isVegan: existing.isVegan,
      isHalal: existing.isHalal,
      isGlutenFree: existing.isGlutenFree,
      isFeatured: false,
      trackInventory: existing.trackInventory,
      displayOrder: existing.displayOrder,
      slug: duplicateSlug,
      seoTitle: existing.seoTitle,
      seoDescription: existing.seoDescription,
    },
    include: productInclude,
  });

  return serializeProduct(product);
}

export async function deleteManagedProduct(
  ownerId: string,
  menuId: string,
  productId: string,
): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedProduct(businessId, menuId, productId);

  if (!existing) {
    throw new Error("Product not found");
  }

  await prisma.product.delete({ where: { id: productId } });
}

export async function archiveManagedProduct(
  ownerId: string,
  menuId: string,
  productId: string,
): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedProduct(businessId, menuId, productId);

  if (!existing) {
    throw new Error("Product not found");
  }

  if (existing.status === "ARCHIVED") {
    throw new Error("Product is already archived");
  }

  await prisma.product.update({
    where: { id: productId },
    data: { status: "ARCHIVED", isFeatured: false },
  });
}

export async function restoreManagedProduct(
  ownerId: string,
  menuId: string,
  productId: string,
): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedProduct(businessId, menuId, productId);

  if (!existing) {
    throw new Error("Product not found");
  }

  if (existing.status !== "ARCHIVED") {
    throw new Error("Only archived products can be restored");
  }

  validateProductStatusTransition(existing.status, "INACTIVE");

  await prisma.product.update({
    where: { id: productId },
    data: { status: "INACTIVE" },
  });
}

export async function publishManagedProduct(
  ownerId: string,
  menuId: string,
  productId: string,
): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedProduct(businessId, menuId, productId);

  if (!existing) {
    throw new Error("Product not found");
  }

  if (existing.status === "ARCHIVED") {
    throw new Error("Archived products cannot be published");
  }

  validateProductStatusTransition(existing.status, "ACTIVE");

  await prisma.product.update({
    where: { id: productId },
    data: { status: "ACTIVE" },
  });
}

export async function bulkUpdateManagedProductStatus(
  ownerId: string,
  input: ProductBulkStatusInput,
): Promise<number> {
  const businessId = await getOwnedBusinessId(ownerId);
  const uniqueIds = [...new Set(input.productIds.filter(Boolean))];

  if (uniqueIds.length === 0) {
    throw new Error("Select at least one product");
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: uniqueIds },
      businessId,
      category: { menuId: input.menuId },
    },
    select: { id: true, status: true },
  });

  if (products.length !== uniqueIds.length) {
    throw new Error("One or more products were not found in this menu");
  }

  for (const product of products) {
    validateProductStatusTransition(product.status, input.status);
  }

  const result = await prisma.product.updateMany({
    where: { id: { in: uniqueIds }, businessId },
    data: {
      status: input.status,
      ...(input.status === "ARCHIVED" ? { isFeatured: false } : {}),
    },
  });

  return result.count;
}

export async function bulkImportManagedProducts(
  ownerId: string,
  input: ProductBulkImportInput,
): Promise<{ imported: number; productIds: string[] }> {
  if (!input.products.length) {
    throw new Error("Import payload must include at least one product");
  }

  const productIds: string[] = [];

  for (const item of input.products) {
    const product = await createManagedProduct(ownerId, input.menuId, item);
    productIds.push(product.id);
  }

  return { imported: productIds.length, productIds };
}

export async function bulkExportManagedProducts(
  businessId: string,
  menuId: string,
  query: ProductListQuery = {},
): Promise<ProductBulkExportResult> {
  const where = buildMenuProductWhere(businessId, menuId, query);
  const products = await prisma.product.findMany({
    where,
    include: productInclude,
    orderBy: resolveOrderBy(query.sortBy, query.sortDirection),
  });

  const serialized = products.map(serializeProduct);

  return {
    exportedAt: new Date().toISOString(),
    menuId,
    count: serialized.length,
    products: serialized,
  };
}
