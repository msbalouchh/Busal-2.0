import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { MODIFIER_LIST_PAGE_SIZE } from "@/modules/modifier-management/constants/routes";
import {
  buildDuplicateModifierGroupName,
  normalizeModifierName,
  resolveSelectionDefaults,
  validateModifierGroupInput,
  validateModifierOptionInput,
  validateModifierStatusTransition,
} from "@/modules/modifier-management/lib/modifier-validation";
import type {
  ModifierDashboardStats,
  ModifierListQuery,
  ModifierListResult,
  ModifierManagementInput,
  ModifierManagementRecord,
  ModifierOptionInput,
  ModifierOptionRecord,
  ModifierOptionReorderInput,
  ModifierSortField,
  ProductModifierAssignmentInput,
  ProductModifierAssignmentRecord,
} from "@/modules/modifier-management/types/modifier-management-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

type ModifierGroupWithRelations = Prisma.ModifierGroupGetPayload<{
  include: {
    options: { orderBy: { displayOrder: "asc" } };
    _count: { select: { productAssignments: true; options: true } };
  };
}>;

type ModifierOptionEntity = Prisma.ModifierOptionGetPayload<object>;

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

function serializeOption(option: ModifierOptionEntity): ModifierOptionRecord {
  return {
    id: option.id,
    modifierGroupId: option.modifierGroupId,
    name: option.name,
    description: option.description,
    priceAdjustment: Number(option.priceAdjustment),
    costAdjustment: decimalToNumber(option.costAdjustment),
    displayOrder: option.displayOrder,
    status: option.status,
    createdAt: option.createdAt.toISOString(),
    updatedAt: option.updatedAt.toISOString(),
  };
}

function serializeModifierGroup(group: ModifierGroupWithRelations): ModifierManagementRecord {
  return {
    id: group.id,
    businessId: group.businessId,
    name: group.name,
    description: group.description,
    selectionType: group.selectionType,
    minimumSelection: group.minimumSelection,
    maximumSelection: group.maximumSelection,
    isRequired: group.isRequired,
    displayOrder: group.displayOrder,
    status: group.status,
    optionCount: group._count.options,
    assignedProductCount: group._count.productAssignments,
    options: group.options.map(serializeOption),
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  };
}

const modifierGroupInclude = {
  options: { orderBy: { displayOrder: "asc" as const } },
  _count: { select: { productAssignments: true, options: true } },
} satisfies Prisma.ModifierGroupInclude;

function resolveOrderBy(
  sortBy: ModifierSortField = "displayOrder",
  sortDirection: "asc" | "desc" = "asc",
): Prisma.ModifierGroupOrderByWithRelationInput[] {
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

function buildModifierWhere(
  businessId: string,
  query: ModifierListQuery,
): Prisma.ModifierGroupWhereInput {
  const where: Prisma.ModifierGroupWhereInput = { businessId };

  if (query.status && query.status !== "ALL") {
    where.status = query.status;
  }

  if (query.selectionType && query.selectionType !== "ALL") {
    where.selectionType = query.selectionType;
  }

  if (query.search?.trim()) {
    const search = query.search.trim();
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

async function assertUniqueModifierGroupName(
  businessId: string,
  name: string,
  excludeGroupId?: string,
): Promise<void> {
  const existing = await prisma.modifierGroup.findFirst({
    where: {
      businessId,
      name: normalizeModifierName(name),
      ...(excludeGroupId ? { NOT: { id: excludeGroupId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Modifier group name must be unique within this business");
  }
}

async function assertUniqueModifierOptionName(
  modifierGroupId: string,
  name: string,
  excludeOptionId?: string,
): Promise<void> {
  const existing = await prisma.modifierOption.findFirst({
    where: {
      modifierGroupId,
      name: normalizeModifierName(name),
      ...(excludeOptionId ? { NOT: { id: excludeOptionId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Modifier option name must be unique within this group");
  }
}

async function getOwnedModifierGroup(
  businessId: string,
  modifierGroupId: string,
): Promise<ModifierGroupWithRelations> {
  const group = await prisma.modifierGroup.findFirst({
    where: { id: modifierGroupId, businessId },
    include: modifierGroupInclude,
  });

  if (!group) {
    throw new Error("Modifier group not found");
  }

  return group;
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

async function getOwnedProductInMenu(
  businessId: string,
  menuId: string,
  productId: string,
): Promise<{ id: string; name: string }> {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      businessId,
      category: { menuId },
    },
    select: { id: true, name: true },
  });

  if (!product) {
    throw new Error("Product not found in this menu");
  }

  return product;
}

export async function getModifierDashboardStats(
  businessId: string,
): Promise<ModifierDashboardStats> {
  const [total, active, inactive, archived, totalOptions] = await Promise.all([
    prisma.modifierGroup.count({ where: { businessId } }),
    prisma.modifierGroup.count({ where: { businessId, status: "ACTIVE" } }),
    prisma.modifierGroup.count({ where: { businessId, status: "INACTIVE" } }),
    prisma.modifierGroup.count({ where: { businessId, status: "ARCHIVED" } }),
    prisma.modifierOption.count({ where: { modifierGroup: { businessId } } }),
  ]);

  return { total, active, inactive, archived, totalOptions };
}

export async function listManagedModifierGroups(
  businessId: string,
  query: ModifierListQuery = {},
): Promise<ModifierListResult> {
  const pageSize = query.pageSize ?? MODIFIER_LIST_PAGE_SIZE;
  const page = Math.max(1, query.page ?? 1);
  const where = buildModifierWhere(businessId, query);

  const [groups, total] = await Promise.all([
    prisma.modifierGroup.findMany({
      where,
      include: modifierGroupInclude,
      orderBy: resolveOrderBy(query.sortBy, query.sortDirection),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.modifierGroup.count({ where }),
  ]);

  return {
    items: groups.map(serializeModifierGroup),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getManagedModifierGroup(
  businessId: string,
  modifierGroupId: string,
): Promise<ModifierManagementRecord> {
  const group = await getOwnedModifierGroup(businessId, modifierGroupId);
  return serializeModifierGroup(group);
}

export async function createManagedModifierGroup(
  ownerId: string,
  input: ModifierManagementInput,
): Promise<ModifierManagementRecord> {
  validateModifierGroupInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  const name = normalizeModifierName(input.name);
  await assertUniqueModifierGroupName(businessId, name);

  const defaults = resolveSelectionDefaults(input.selectionType);
  const minimumSelection = input.minimumSelection ?? defaults.minimumSelection;
  const maximumSelection = input.maximumSelection ?? defaults.maximumSelection;

  if (minimumSelection > maximumSelection) {
    throw new Error("Minimum selection cannot exceed maximum selection");
  }

  const group = await prisma.modifierGroup.create({
    data: {
      businessId,
      name,
      description: input.description?.trim() || null,
      selectionType: input.selectionType,
      minimumSelection,
      maximumSelection,
      isRequired: input.isRequired ?? false,
      displayOrder: input.displayOrder ?? 0,
      status: "INACTIVE",
    },
    include: modifierGroupInclude,
  });

  return serializeModifierGroup(group);
}

export async function updateManagedModifierGroup(
  ownerId: string,
  modifierGroupId: string,
  input: ModifierManagementInput,
): Promise<ModifierManagementRecord> {
  validateModifierGroupInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedModifierGroup(businessId, modifierGroupId);
  const name = normalizeModifierName(input.name);
  await assertUniqueModifierGroupName(businessId, name, modifierGroupId);

  const defaults = resolveSelectionDefaults(input.selectionType);
  const minimumSelection = input.minimumSelection ?? defaults.minimumSelection;
  const maximumSelection = input.maximumSelection ?? defaults.maximumSelection;

  const group = await prisma.modifierGroup.update({
    where: { id: modifierGroupId },
    data: {
      name,
      description: input.description?.trim() || null,
      selectionType: input.selectionType,
      minimumSelection,
      maximumSelection,
      isRequired: input.isRequired ?? false,
      displayOrder: input.displayOrder ?? existing.displayOrder,
    },
    include: modifierGroupInclude,
  });

  return serializeModifierGroup(group);
}

export async function duplicateManagedModifierGroup(
  ownerId: string,
  modifierGroupId: string,
): Promise<ModifierManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedModifierGroup(businessId, modifierGroupId);
  let duplicateName = buildDuplicateModifierGroupName(existing.name);

  while (
    await prisma.modifierGroup.findFirst({
      where: { businessId, name: duplicateName },
      select: { id: true },
    })
  ) {
    duplicateName = buildDuplicateModifierGroupName(duplicateName);
  }

  const group = await prisma.modifierGroup.create({
    data: {
      businessId,
      name: duplicateName,
      description: existing.description,
      selectionType: existing.selectionType,
      minimumSelection: existing.minimumSelection,
      maximumSelection: existing.maximumSelection,
      isRequired: existing.isRequired,
      displayOrder: existing.displayOrder + 1,
      status: "INACTIVE",
      options: {
        create: existing.options.map((option) => ({
          name: option.name,
          description: option.description,
          priceAdjustment: option.priceAdjustment,
          costAdjustment: option.costAdjustment,
          displayOrder: option.displayOrder,
          status: option.status,
        })),
      },
    },
    include: modifierGroupInclude,
  });

  return serializeModifierGroup(group);
}

export async function deleteManagedModifierGroup(
  ownerId: string,
  modifierGroupId: string,
): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  await getOwnedModifierGroup(businessId, modifierGroupId);
  await prisma.modifierGroup.delete({ where: { id: modifierGroupId } });
}

export async function archiveManagedModifierGroup(
  ownerId: string,
  modifierGroupId: string,
): Promise<ModifierManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedModifierGroup(businessId, modifierGroupId);
  validateModifierStatusTransition(existing.status, "ARCHIVED");

  const group = await prisma.modifierGroup.update({
    where: { id: modifierGroupId },
    data: { status: "ARCHIVED" },
    include: modifierGroupInclude,
  });

  return serializeModifierGroup(group);
}

export async function restoreManagedModifierGroup(
  ownerId: string,
  modifierGroupId: string,
): Promise<ModifierManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedModifierGroup(businessId, modifierGroupId);
  validateModifierStatusTransition(existing.status, "INACTIVE");

  const group = await prisma.modifierGroup.update({
    where: { id: modifierGroupId },
    data: { status: "INACTIVE" },
    include: modifierGroupInclude,
  });

  return serializeModifierGroup(group);
}

export async function activateManagedModifierGroup(
  ownerId: string,
  modifierGroupId: string,
): Promise<ModifierManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedModifierGroup(businessId, modifierGroupId);
  validateModifierStatusTransition(existing.status, "ACTIVE");

  const group = await prisma.modifierGroup.update({
    where: { id: modifierGroupId },
    data: { status: "ACTIVE" },
    include: modifierGroupInclude,
  });

  return serializeModifierGroup(group);
}

export async function createManagedModifierOption(
  ownerId: string,
  modifierGroupId: string,
  input: ModifierOptionInput,
): Promise<ModifierManagementRecord> {
  validateModifierOptionInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  const group = await getOwnedModifierGroup(businessId, modifierGroupId);
  const name = normalizeModifierName(input.name);
  await assertUniqueModifierOptionName(modifierGroupId, name);

  const maxOrder = await prisma.modifierOption.aggregate({
    where: { modifierGroupId },
    _max: { displayOrder: true },
  });

  await prisma.modifierOption.create({
    data: {
      modifierGroupId,
      name,
      description: input.description?.trim() || null,
      priceAdjustment: input.priceAdjustment ?? 0,
      costAdjustment: input.costAdjustment ?? null,
      displayOrder: input.displayOrder ?? (maxOrder._max.displayOrder ?? -1) + 1,
      status: input.status ?? "ACTIVE",
    },
  });

  return getManagedModifierGroup(businessId, group.id);
}

export async function updateManagedModifierOption(
  ownerId: string,
  optionId: string,
  input: ModifierOptionInput,
): Promise<ModifierManagementRecord> {
  validateModifierOptionInput(input);
  const businessId = await getOwnedBusinessId(ownerId);

  const option = await prisma.modifierOption.findFirst({
    where: { id: optionId, modifierGroup: { businessId } },
    select: { id: true, modifierGroupId: true },
  });

  if (!option) {
    throw new Error("Modifier option not found");
  }

  const name = normalizeModifierName(input.name);
  await assertUniqueModifierOptionName(option.modifierGroupId, name, optionId);

  await prisma.modifierOption.update({
    where: { id: optionId },
    data: {
      name,
      description: input.description?.trim() || null,
      priceAdjustment: input.priceAdjustment ?? 0,
      costAdjustment: input.costAdjustment ?? null,
      displayOrder: input.displayOrder,
      status: input.status,
    },
  });

  return getManagedModifierGroup(businessId, option.modifierGroupId);
}

export async function deleteManagedModifierOption(
  ownerId: string,
  optionId: string,
): Promise<ModifierManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);

  const option = await prisma.modifierOption.findFirst({
    where: { id: optionId, modifierGroup: { businessId } },
    select: { id: true, modifierGroupId: true },
  });

  if (!option) {
    throw new Error("Modifier option not found");
  }

  await prisma.modifierOption.delete({ where: { id: optionId } });
  return getManagedModifierGroup(businessId, option.modifierGroupId);
}

export async function reorderManagedModifierOptions(
  ownerId: string,
  input: ModifierOptionReorderInput,
): Promise<ModifierManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const group = await getOwnedModifierGroup(businessId, input.modifierGroupId);

  const validIds = new Set(group.options.map((option) => option.id));
  if (
    input.optionIds.length !== validIds.size ||
    !input.optionIds.every((id) => validIds.has(id))
  ) {
    throw new Error("Invalid option order payload");
  }

  await prisma.$transaction(
    input.optionIds.map((optionId, index) =>
      prisma.modifierOption.update({
        where: { id: optionId },
        data: { displayOrder: index },
      }),
    ),
  );

  return getManagedModifierGroup(businessId, input.modifierGroupId);
}

export async function assignModifierGroupsToProduct(
  ownerId: string,
  input: ProductModifierAssignmentInput,
): Promise<ProductModifierAssignmentRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertMenuBelongsToBusiness(businessId, input.menuId);
  const product = await getOwnedProductInMenu(businessId, input.menuId, input.productId);

  const uniqueGroupIds = [...new Set(input.modifierGroupIds)];

  if (uniqueGroupIds.length > 0) {
    const validGroups = await prisma.modifierGroup.findMany({
      where: { businessId, id: { in: uniqueGroupIds } },
      select: { id: true },
    });

    if (validGroups.length !== uniqueGroupIds.length) {
      throw new Error("One or more modifier groups were not found");
    }
  }

  await prisma.productModifierGroup.deleteMany({ where: { productId: product.id } });

  if (uniqueGroupIds.length > 0) {
    await prisma.productModifierGroup.createMany({
      data: uniqueGroupIds.map((modifierGroupId, index) => ({
        productId: product.id,
        modifierGroupId,
        displayOrder: index,
      })),
    });
  }

  return {
    productId: product.id,
    productName: product.name,
    modifierGroupIds: uniqueGroupIds,
  };
}

export async function getProductModifierAssignment(
  businessId: string,
  menuId: string,
  productId: string,
): Promise<ProductModifierAssignmentRecord | null> {
  const product = await prisma.product.findFirst({
    where: { id: productId, businessId, category: { menuId } },
    select: {
      id: true,
      name: true,
      modifierGroups: {
        orderBy: { displayOrder: "asc" },
        select: { modifierGroupId: true },
      },
    },
  });

  if (!product) {
    return null;
  }

  return {
    productId: product.id,
    productName: product.name,
    modifierGroupIds: product.modifierGroups.map((entry) => entry.modifierGroupId),
  };
}

export async function listMenuProductsForModifierAssignment(
  businessId: string,
  menuId: string,
): Promise<Array<{ id: string; name: string; categoryName: string }>> {
  const products = await prisma.product.findMany({
    where: { businessId, category: { menuId } },
    select: {
      id: true,
      name: true,
      category: { select: { name: true } },
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    categoryName: product.category.name,
  }));
}
