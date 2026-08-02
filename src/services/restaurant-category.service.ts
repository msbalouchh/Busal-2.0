import "server-only";

import type { CategoryStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { CATEGORY_LIST_PAGE_SIZE } from "@/modules/category-management/constants/routes";
import {
  buildDuplicateCategoryName,
  buildDuplicateCategorySlug,
  normalizeCategoryName,
  normalizeCategorySlug,
  slugifyCategoryName,
  validateCategoryInput,
  validateCategoryStatusTransition,
} from "@/modules/category-management/lib/category-validation";
import type {
  CategoryDashboardStats,
  CategoryListQuery,
  CategoryListResult,
  CategoryManagementInput,
  CategoryManagementRecord,
  CategoryReorderInput,
  CategorySortField,
  CategoryTreeNode,
} from "@/modules/category-management/types/category-management-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

type CategoryWithRelations = Prisma.CategoryGetPayload<{
  include: {
    parentCategory: { select: { id: true; name: true } };
    _count: { select: { childCategories: true } };
  };
}>;

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

async function assertMenuBelongsToBusiness(businessId: string, menuId: string): Promise<void> {
  const menu = await prisma.menu.findFirst({
    where: { id: menuId, businessId },
    select: { id: true },
  });

  if (!menu) {
    throw new Error("Menu not found");
  }
}

function serializeCategory(category: CategoryWithRelations): CategoryManagementRecord {
  return {
    id: category.id,
    businessId: category.businessId,
    menuId: category.menuId,
    parentCategoryId: category.parentCategoryId,
    parentCategoryName: category.parentCategory?.name ?? null,
    name: category.name,
    description: category.description,
    image: category.image,
    icon: category.icon,
    displayOrder: category.displayOrder,
    status: category.status,
    isFeatured: category.isFeatured,
    slug: category.slug,
    seoTitle: category.seoTitle,
    seoDescription: category.seoDescription,
    childCount: category._count.childCategories,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

const categoryInclude = {
  parentCategory: { select: { id: true, name: true } },
  _count: { select: { childCategories: true } },
} satisfies Prisma.CategoryInclude;

function resolveOrderBy(
  sortBy: CategorySortField = "displayOrder",
  sortDirection: "asc" | "desc" = "asc",
): Prisma.CategoryOrderByWithRelationInput[] {
  const direction = sortDirection;

  switch (sortBy) {
    case "name":
      return [{ name: direction }];
    case "createdAt":
      return [{ createdAt: direction }];
    case "status":
      return [{ status: direction }, { displayOrder: "asc" }];
    case "displayOrder":
    default:
      return [{ displayOrder: direction }, { name: "asc" }];
  }
}

async function assertUniqueCategoryName(
  menuId: string,
  name: string,
  excludeCategoryId?: string,
): Promise<void> {
  const existing = await prisma.category.findFirst({
    where: {
      menuId,
      name: normalizeCategoryName(name),
      ...(excludeCategoryId ? { NOT: { id: excludeCategoryId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Category name must be unique within this menu");
  }
}

async function assertUniqueCategorySlug(
  menuId: string,
  slug: string,
  excludeCategoryId?: string,
): Promise<void> {
  const existing = await prisma.category.findFirst({
    where: {
      menuId,
      slug: normalizeCategorySlug(slug),
      ...(excludeCategoryId ? { NOT: { id: excludeCategoryId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Category slug must be unique within this menu");
  }
}

async function resolveUniqueSlug(
  menuId: string,
  name: string,
  preferred?: string,
): Promise<string> {
  const base = normalizeCategorySlug(preferred?.trim() || slugifyCategoryName(name));
  let slug = base;
  let attempt = 2;

  while (
    await prisma.category.findFirst({
      where: { menuId, slug },
      select: { id: true },
    })
  ) {
    slug = `${base}-${attempt}`;
    attempt += 1;
  }

  return slug;
}

async function getOwnedCategory(
  businessId: string,
  menuId: string,
  categoryId: string,
): Promise<CategoryWithRelations | null> {
  return prisma.category.findFirst({
    where: { id: categoryId, businessId, menuId },
    include: categoryInclude,
  });
}

async function assertValidParentCategory(
  businessId: string,
  menuId: string,
  categoryId: string | undefined,
  parentCategoryId: string | null | undefined,
): Promise<void> {
  if (!parentCategoryId) {
    return;
  }

  if (categoryId && parentCategoryId === categoryId) {
    throw new Error("A category cannot be its own parent");
  }

  const parent = await prisma.category.findFirst({
    where: { id: parentCategoryId, businessId, menuId },
    select: { id: true, parentCategoryId: true },
  });

  if (!parent) {
    throw new Error("Parent category not found");
  }

  if (!categoryId) {
    return;
  }

  let currentId: string | null = parent.parentCategoryId;
  const visited = new Set<string>([parentCategoryId, categoryId]);

  while (currentId) {
    if (currentId === categoryId) {
      throw new Error("Circular parent-child relationship detected");
    }

    if (visited.has(currentId)) {
      throw new Error("Circular parent-child relationship detected");
    }

    visited.add(currentId);

    const ancestor: { parentCategoryId: string | null } | null = await prisma.category.findUnique({
      where: { id: currentId },
      select: { parentCategoryId: true },
    });

    currentId = ancestor?.parentCategoryId ?? null;
  }
}

function buildCategoryData(
  input: CategoryManagementInput,
  slug: string,
): Omit<Prisma.CategoryCreateInput, "business" | "menu" | "parentCategory" | "childCategories"> {
  return {
    name: normalizeCategoryName(input.name),
    description: input.description?.trim() || null,
    image: input.image?.trim() || null,
    icon: input.icon?.trim() || null,
    displayOrder: input.displayOrder ?? 0,
    isFeatured: input.isFeatured ?? false,
    slug,
    seoTitle: input.seoTitle?.trim() || null,
    seoDescription: input.seoDescription?.trim() || null,
  };
}

export async function getCategoryDashboardStats(
  businessId: string,
  menuId: string,
): Promise<CategoryDashboardStats> {
  const where = { businessId, menuId };
  const [total, active, inactive, archived, featured] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.count({ where: { ...where, status: "ACTIVE" } }),
    prisma.category.count({ where: { ...where, status: "INACTIVE" } }),
    prisma.category.count({ where: { ...where, status: "ARCHIVED" } }),
    prisma.category.count({ where: { ...where, isFeatured: true } }),
  ]);

  return { total, active, inactive, archived, featured };
}

export async function listManagedCategories(
  businessId: string,
  menuId: string,
  query: CategoryListQuery = {},
): Promise<CategoryListResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? CATEGORY_LIST_PAGE_SIZE));
  const search = query.search?.trim();

  const where: Prisma.CategoryWhereInput = {
    businessId,
    menuId,
    ...(query.status && query.status !== "ALL" ? { status: query.status } : {}),
    ...(query.parentCategoryId === "ROOT"
      ? { parentCategoryId: null }
      : query.parentCategoryId && query.parentCategoryId !== "ALL"
        ? { parentCategoryId: query.parentCategoryId }
        : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, categories] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      include: categoryInclude,
      orderBy: resolveOrderBy(query.sortBy, query.sortDirection),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: categories.map(serializeCategory),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listManagedCategoryTree(
  businessId: string,
  menuId: string,
  status?: CategoryStatus | "ALL",
): Promise<CategoryTreeNode[]> {
  const categories = await prisma.category.findMany({
    where: {
      businessId,
      menuId,
      ...(status && status !== "ALL" ? { status } : {}),
    },
    include: categoryInclude,
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  const nodes = new Map<string, CategoryTreeNode>();

  for (const category of categories) {
    nodes.set(category.id, { ...serializeCategory(category), children: [] });
  }

  const roots: CategoryTreeNode[] = [];

  for (const node of nodes.values()) {
    if (node.parentCategoryId && nodes.has(node.parentCategoryId)) {
      nodes.get(node.parentCategoryId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function getManagedCategory(
  businessId: string,
  menuId: string,
  categoryId: string,
): Promise<CategoryManagementRecord | null> {
  const category = await getOwnedCategory(businessId, menuId, categoryId);
  return category ? serializeCategory(category) : null;
}

export async function createManagedCategory(
  ownerId: string,
  menuId: string,
  input: CategoryManagementInput,
): Promise<CategoryManagementRecord> {
  validateCategoryInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  await assertMenuBelongsToBusiness(businessId, menuId);
  await assertUniqueCategoryName(menuId, input.name);
  await assertValidParentCategory(businessId, menuId, undefined, input.parentCategoryId);

  const slug = await resolveUniqueSlug(menuId, input.name, input.slug);
  await assertUniqueCategorySlug(menuId, slug);

  const category = await prisma.category.create({
    data: {
      business: { connect: { id: businessId } },
      menu: { connect: { id: menuId } },
      ...(input.parentCategoryId
        ? { parentCategory: { connect: { id: input.parentCategoryId } } }
        : {}),
      ...buildCategoryData(input, slug),
      status: "INACTIVE",
    },
    include: categoryInclude,
  });

  return serializeCategory(category);
}

export async function updateManagedCategory(
  ownerId: string,
  menuId: string,
  categoryId: string,
  input: CategoryManagementInput,
): Promise<CategoryManagementRecord> {
  validateCategoryInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedCategory(businessId, menuId, categoryId);

  if (!existing) {
    throw new Error("Category not found");
  }

  if (existing.status === "ARCHIVED") {
    throw new Error("Archived categories cannot be edited. Restore the category first.");
  }

  await assertValidParentCategory(businessId, menuId, categoryId, input.parentCategoryId);
  await assertUniqueCategoryName(menuId, input.name, categoryId);

  const slug = input.slug?.trim() ? normalizeCategorySlug(input.slug) : existing.slug;
  await assertUniqueCategorySlug(menuId, slug, categoryId);

  const category = await prisma.category.update({
    where: { id: categoryId },
    data: {
      ...buildCategoryData(input, slug),
      ...(input.parentCategoryId
        ? { parentCategory: { connect: { id: input.parentCategoryId } } }
        : { parentCategory: { disconnect: true } }),
    },
    include: categoryInclude,
  });

  return serializeCategory(category);
}

export async function duplicateManagedCategory(
  ownerId: string,
  menuId: string,
  categoryId: string,
): Promise<CategoryManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedCategory(businessId, menuId, categoryId);

  if (!existing) {
    throw new Error("Category not found");
  }

  let duplicateName = buildDuplicateCategoryName(existing.name);
  let attempt = 2;

  while (
    await prisma.category.findFirst({
      where: { menuId, name: duplicateName },
      select: { id: true },
    })
  ) {
    duplicateName = `${buildDuplicateCategoryName(existing.name)} ${attempt}`;
    attempt += 1;
  }

  const duplicateSlug = await resolveUniqueSlug(
    menuId,
    duplicateName,
    buildDuplicateCategorySlug(existing.slug),
  );

  const category = await prisma.category.create({
    data: {
      business: { connect: { id: businessId } },
      menu: { connect: { id: menuId } },
      ...(existing.parentCategoryId
        ? { parentCategory: { connect: { id: existing.parentCategoryId } } }
        : {}),
      name: duplicateName,
      description: existing.description,
      image: existing.image,
      icon: existing.icon,
      displayOrder: existing.displayOrder,
      status: "INACTIVE",
      isFeatured: false,
      slug: duplicateSlug,
      seoTitle: existing.seoTitle,
      seoDescription: existing.seoDescription,
    },
    include: categoryInclude,
  });

  return serializeCategory(category);
}

export async function deleteManagedCategory(
  ownerId: string,
  menuId: string,
  categoryId: string,
): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedCategory(businessId, menuId, categoryId);

  if (!existing) {
    throw new Error("Category not found");
  }

  if (existing._count.childCategories > 0) {
    throw new Error("Remove or reassign child categories before deleting this category");
  }

  await prisma.category.delete({ where: { id: categoryId } });
}

export async function archiveManagedCategory(
  ownerId: string,
  menuId: string,
  categoryId: string,
): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedCategory(businessId, menuId, categoryId);

  if (!existing) {
    throw new Error("Category not found");
  }

  if (existing.status === "ARCHIVED") {
    throw new Error("Category is already archived");
  }

  await prisma.category.update({
    where: { id: categoryId },
    data: { status: "ARCHIVED", isFeatured: false },
  });
}

export async function restoreManagedCategory(
  ownerId: string,
  menuId: string,
  categoryId: string,
): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedCategory(businessId, menuId, categoryId);

  if (!existing) {
    throw new Error("Category not found");
  }

  if (existing.status !== "ARCHIVED") {
    throw new Error("Only archived categories can be restored");
  }

  validateCategoryStatusTransition(existing.status, "INACTIVE");

  await prisma.category.update({
    where: { id: categoryId },
    data: { status: "INACTIVE" },
  });
}

export async function publishManagedCategory(
  ownerId: string,
  menuId: string,
  categoryId: string,
): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedCategory(businessId, menuId, categoryId);

  if (!existing) {
    throw new Error("Category not found");
  }

  if (existing.status === "ARCHIVED") {
    throw new Error("Archived categories cannot be published");
  }

  validateCategoryStatusTransition(existing.status, "ACTIVE");

  await prisma.category.update({
    where: { id: categoryId },
    data: { status: "ACTIVE" },
  });
}

export async function reorderManagedCategories(
  ownerId: string,
  input: CategoryReorderInput,
): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertMenuBelongsToBusiness(businessId, input.menuId);

  const categories = await prisma.category.findMany({
    where: {
      businessId,
      menuId: input.menuId,
      parentCategoryId: input.parentCategoryId ?? null,
    },
    select: { id: true },
  });

  const validIds = new Set(categories.map((category) => category.id));

  if (input.orderedIds.length !== validIds.size) {
    throw new Error("Reorder list must include all categories at this level");
  }

  for (const id of input.orderedIds) {
    if (!validIds.has(id)) {
      throw new Error("Category not found in this menu level");
    }
  }

  await Promise.all(
    input.orderedIds.map((id, index) =>
      prisma.category.update({
        where: { id },
        data: { displayOrder: index },
      }),
    ),
  );
}
